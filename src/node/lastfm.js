const axios = require('axios');
const userData = require('./user-data');
const playbackState = require('./playback-state');
const {
  defaultLastfmSettings,
  normalizeLastfmSettings,
  signParams,
  canScrobbleTrack,
  scrobbleThresholdSec,
  shouldScrobble,
  emptyListenSession,
  applyPlayback,
} = require('./lastfm-core');

const API_ROOT = 'https://ws.audioscrobbler.com/2.0/';

// Зарезервировано под ключ приложения Yaamp. Пока пусто — пользователь вводит свои.
const BUILTIN_API_KEY = '';
const BUILTIN_API_SECRET = '';

let pendingAuthToken = null;

let listenSession = emptyListenSession();

function debugLog(event, details = '') {
  const suffix = details ? ` ${details}` : '';
  console.log(`[lastfm] ${event}${suffix}`);
}

function trackLabel(session = listenSession) {
  if (!session?.artist || !session?.title) return '(unknown)';
  return `${session.artist} - ${session.title}`;
}

function ensureLastfmSettings() {
  const { settingsData } = userData;
  if (!settingsData.lastfm) {
    settingsData.lastfm = defaultLastfmSettings();
  } else {
    settingsData.lastfm = normalizeLastfmSettings(settingsData.lastfm);
  }
  return settingsData.lastfm;
}

function getCredentials() {
  const lastfm = ensureLastfmSettings();
  return {
    apiKey: lastfm.apiKey || BUILTIN_API_KEY,
    apiSecret: lastfm.apiSecret || BUILTIN_API_SECRET,
    sessionKey: lastfm.sessionKey,
    username: lastfm.username,
    enabled: lastfm.enabled,
  };
}

function publicLastfmSettings() {
  const lastfm = ensureLastfmSettings();
  const creds = getCredentials();
  return {
    enabled: lastfm.enabled,
    apiKey: lastfm.apiKey,
    username: lastfm.username,
    hasSecret: Boolean(creds.apiSecret),
    hasSession: Boolean(lastfm.sessionKey),
    canAuth: Boolean(creds.apiKey && creds.apiSecret),
  };
}

function parseLastfmErrorPayload(data) {
  if (!data) return null;
  if (typeof data === 'object' && data.error != null) {
    return { code: data.error, message: data.message || String(data.error) };
  }
  if (typeof data === 'string') {
    const codeMatch = data.match(/<error code="(\d+)">([^<]*)<\/error>/);
    if (codeMatch) {
      return { code: Number(codeMatch[1]), message: codeMatch[2].trim() };
    }
  }
  return null;
}

function lastfmErrorMessage(method, error) {
  const payload = parseLastfmErrorPayload(error?.response?.data)
    || parseLastfmErrorPayload(error?.data);
  if (payload) {
    if (Number(payload.code) === 11) {
      return 'Last.fm недоступен с этой сети (Access Denied). Попробуйте VPN или другую сеть.';
    }
    return `Last.fm ${method}: ${payload.message} (код ${payload.code})`;
  }
  if (error?.response?.status) {
    return `Last.fm ${method}: HTTP ${error.response.status}`;
  }
  return error?.message || `Last.fm ${method}: неизвестная ошибка`;
}

async function callMethod(method, params, { signed = true, session = false } = {}) {
  const creds = getCredentials();
  if (!creds.apiKey || (signed && !creds.apiSecret)) {
    throw new Error('Last.fm API key/secret не заданы');
  }

  const body = {
    method,
    api_key: creds.apiKey,
    format: 'json',
    ...params,
  };

  if (session) {
    if (!creds.sessionKey) {
      throw new Error('Нет сессии Last.fm');
    }
    body.sk = creds.sessionKey;
  }

  if (signed) {
    body.api_sig = signParams(body, creds.apiSecret);
  }

  const form = new URLSearchParams();
  Object.keys(body).forEach((key) => {
    if (body[key] !== undefined && body[key] !== null) {
      form.append(key, String(body[key]));
    }
  });

  let data;
  try {
    const response = await axios.post(API_ROOT, form.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Yaamp/0.0.8',
      },
      timeout: 15000,
      validateStatus: () => true,
    });
    data = response.data;
    if (response.status >= 400) {
      throw Object.assign(new Error('Last.fm HTTP error'), { response, data });
    }
  } catch (error) {
    throw new Error(lastfmErrorMessage(method, error));
  }

  const apiError = parseLastfmErrorPayload(data);
  if (apiError) {
    throw new Error(lastfmErrorMessage(method, { data }));
  }

  return data;
}

function saveLastfmPatch(patch) {
  const lastfm = ensureLastfmSettings();
  if (patch.enabled !== undefined) lastfm.enabled = Boolean(patch.enabled);
  if (typeof patch.apiKey === 'string') lastfm.apiKey = patch.apiKey.trim();
  if (typeof patch.apiSecret === 'string' && patch.apiSecret.length > 0) {
    lastfm.apiSecret = patch.apiSecret.trim();
  }
  if (typeof patch.sessionKey === 'string') lastfm.sessionKey = patch.sessionKey;
  if (typeof patch.username === 'string') lastfm.username = patch.username;
  userData.saveSettings();
  return publicLastfmSettings();
}

async function beginAuth() {
  const creds = getCredentials();
  if (!creds.apiKey || !creds.apiSecret) {
    throw new Error('Сначала укажите API key и secret Last.fm');
  }

  const data = await callMethod('auth.getToken', {}, { signed: true, session: false });
  pendingAuthToken = data.token;
  const authUrl = `https://www.last.fm/api/auth/?api_key=${encodeURIComponent(creds.apiKey)}&token=${encodeURIComponent(pendingAuthToken)}`;
  return { authUrl, token: pendingAuthToken };
}

async function completeAuth() {
  if (!pendingAuthToken) {
    throw new Error('Сначала нажмите «Авторизовать»');
  }

  const data = await callMethod(
    'auth.getSession',
    { token: pendingAuthToken },
    { signed: true, session: false },
  );

  const session = data.session;
  if (!session || !session.key) {
    throw new Error('Last.fm не вернул session key');
  }

  pendingAuthToken = null;
  return saveLastfmPatch({
    sessionKey: session.key,
    username: session.name || '',
    enabled: true,
  });
}

function logout() {
  pendingAuthToken = null;
  resetListenSession();
  return saveLastfmPatch({
    sessionKey: '',
    username: '',
  });
}

function resetListenSession() {
  listenSession = emptyListenSession();
}

function resolveAlbum(trackId, albumFromRenderer) {
  if (albumFromRenderer) return albumFromRenderer;
  const meta = playbackState.currentTrackMetadata;
  if (!meta) return '';
  if (trackId != null && String(meta.id) !== String(trackId)) return '';
  return meta.albums?.[0]?.title || '';
}

async function sendNowPlaying(session) {
  const params = {
    artist: session.artist,
    track: session.title,
    duration: Math.floor(session.durationSec),
  };
  if (session.album) params.album = session.album;

  await callMethod('track.updateNowPlaying', params, { signed: true, session: true });
  debugLog('nowPlaying ok', trackLabel(session));
}

async function sendScrobble(session) {
  const params = {
    artist: session.artist,
    track: session.title,
    timestamp: Math.floor(session.startedAt / 1000),
    duration: Math.floor(session.durationSec),
  };
  if (session.album) params.album = session.album;

  await callMethod('track.scrobble', params, { signed: true, session: true });
  debugLog(
    'scrobble ok',
    `${trackLabel(session)} (listened ${Math.floor(session.listenedSec)}s / ${Math.floor(session.durationSec)}s)`,
  );
}

async function handlePlaybackProgress(payload = {}) {
  const creds = getCredentials();
  if (!creds.enabled || !creds.sessionKey || !creds.apiKey || !creds.apiSecret) {
    return;
  }

  const artist = (payload.artist || '').trim();
  const title = (payload.title || '').trim();
  if (!artist || !title) return;

  const durationSec = Number(payload.durationSec) || 0;
  const elapsedSec = Number(payload.elapsedSec) || 0;
  const status = payload.status || 'STOPPED';
  const trackId = payload.trackId != null ? String(payload.trackId) : '';
  const trackKey = trackId || `${artist}\0${title}`;
  const previous = listenSession;
  const result = applyPlayback(previous, {
    trackKey,
    artist,
    title,
    album: resolveAlbum(trackId, payload.album),
    durationSec,
    elapsedSec,
    status,
  }, Date.now());

  listenSession = result.session;

  if (result.events.includes('end')) {
    debugLog(
      'track end',
      `${trackLabel(previous)} scrobbled=${previous.scrobbled} listened=${Math.floor(previous.listenedSec)}s`,
    );
  }
  if (result.events.includes('start')) {
    debugLog('track start', `${trackLabel()} (${Math.floor(listenSession.durationSec)}s)`);
  }
  if (result.events.includes('paused') || result.events.includes('stopped')) {
    const eventName = result.events.includes('paused') ? 'paused' : 'stopped';
    debugLog(
      eventName,
      `${trackLabel()} listened=${Math.floor(listenSession.listenedSec)}s (now playing на Last.fm не сбрасываем)`,
    );
  }
  if (result.events.includes('resume')) {
    debugLog('resume', trackLabel());
  }

  if (result.sendNowPlaying) {
    const target = listenSession;
    sendNowPlaying(target).then(() => {
      if (listenSession === target) target.nowPlayingSent = true;
    }).catch((error) => console.error('[lastfm] nowPlaying fail', error));
  }

  if (result.sendScrobble) {
    const target = listenSession;
    sendScrobble(target).catch((error) => {
      if (listenSession === target) target.scrobbled = false;
      console.error('[lastfm] scrobble fail', error);
    });
  }
}

module.exports = {
  API_ROOT,
  BUILTIN_API_KEY,
  BUILTIN_API_SECRET,
  defaultLastfmSettings,
  normalizeLastfmSettings,
  ensureLastfmSettings,
  publicLastfmSettings,
  signParams,
  canScrobbleTrack,
  scrobbleThresholdSec,
  shouldScrobble,
  saveLastfmPatch,
  beginAuth,
  completeAuth,
  logout,
  handlePlaybackProgress,
  resetListenSession,
  _getListenSession: () => listenSession,
  _setPendingAuthToken: (token) => { pendingAuthToken = token; },
};
