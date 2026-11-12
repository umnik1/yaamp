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
} = require('./lastfm-core');

const API_ROOT = 'https://ws.audioscrobbler.com/2.0/';

// Зарезервировано под ключ приложения Yaamp. Пока пусто — пользователь вводит свои.
const BUILTIN_API_KEY = '';
const BUILTIN_API_SECRET = '';

let pendingAuthToken = null;

let listenSession = {
  trackKey: null,
  artist: null,
  title: null,
  album: null,
  durationSec: 0,
  startedAt: null,
  lastElapsed: null,
  listenedSec: 0,
  nowPlayingSent: false,
  scrobbled: false,
  lastStatus: null,
};

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
  listenSession = {
    trackKey: null,
    artist: null,
    title: null,
    album: null,
    durationSec: 0,
    startedAt: null,
    lastElapsed: null,
    listenedSec: 0,
    nowPlayingSent: false,
    scrobbled: false,
    lastStatus: null,
  };
}

function resolveAlbum(trackId, albumFromRenderer) {
  if (albumFromRenderer) return albumFromRenderer;
  const meta = playbackState.currentTrackMetadata;
  if (!meta) return '';
  if (trackId != null && String(meta.id) !== String(trackId)) return '';
  return meta.albums?.[0]?.title || '';
}

function accumulateListenTime(elapsedSec, status) {
  if (status !== 'PLAYING') {
    listenSession.lastElapsed = elapsedSec;
    return;
  }

  if (listenSession.lastElapsed == null) {
    listenSession.lastElapsed = elapsedSec;
    return;
  }

  const delta = elapsedSec - listenSession.lastElapsed;
  listenSession.lastElapsed = elapsedSec;

  // Нормальный тик ~1с; скачок вперёд/назад — перемотка, не копим.
  if (delta > 0 && delta <= 2.5) {
    listenSession.listenedSec += delta;
  }
}

async function sendNowPlaying() {
  const params = {
    artist: listenSession.artist,
    track: listenSession.title,
    duration: Math.floor(listenSession.durationSec),
  };
  if (listenSession.album) params.album = listenSession.album;

  await callMethod('track.updateNowPlaying', params, { signed: true, session: true });
  debugLog('nowPlaying ok', trackLabel());
}

async function sendScrobble() {
  const params = {
    artist: listenSession.artist,
    track: listenSession.title,
    timestamp: Math.floor(listenSession.startedAt / 1000),
    duration: Math.floor(listenSession.durationSec),
  };
  if (listenSession.album) params.album = listenSession.album;

  await callMethod('track.scrobble', params, { signed: true, session: true });
  debugLog(
    'scrobble ok',
    `${trackLabel()} (listened ${Math.floor(listenSession.listenedSec)}s / ${Math.floor(listenSession.durationSec)}s)`,
  );
}

async function handlePlaybackProgress(payload = {}) {
  const creds = getCredentials();
  if (!creds.enabled || !creds.sessionKey || !creds.apiKey || !creds.apiSecret) {
    return;
  }

  const artist = (payload.artist || '').trim();
  const title = (payload.title || '').trim();
  const durationSec = Number(payload.durationSec) || 0;
  const elapsedSec = Number(payload.elapsedSec) || 0;
  const status = payload.status || 'STOPPED';
  const trackId = payload.trackId != null ? String(payload.trackId) : '';
  const trackKey = trackId || `${artist}\0${title}`;

  if (!artist || !title) {
    return;
  }

  if (listenSession.trackKey !== trackKey) {
    if (listenSession.trackKey) {
      debugLog(
        'track end',
        `${trackLabel()} scrobbled=${listenSession.scrobbled} listened=${Math.floor(listenSession.listenedSec)}s`,
      );
    }
    listenSession = {
      trackKey,
      artist,
      title,
      album: resolveAlbum(trackId, payload.album),
      durationSec,
      startedAt: Date.now(),
      lastElapsed: elapsedSec,
      listenedSec: 0,
      nowPlayingSent: false,
      scrobbled: false,
      lastStatus: status,
    };
    debugLog('track start', `${trackLabel()} (${Math.floor(durationSec)}s)`);
  } else {
    if (durationSec > 0) listenSession.durationSec = durationSec;
    if (!listenSession.album) {
      listenSession.album = resolveAlbum(trackId, payload.album);
    }
    accumulateListenTime(elapsedSec, status);

    if (listenSession.lastStatus !== status) {
      if (status === 'PAUSED' || status === 'STOPPED') {
        debugLog(
          status.toLowerCase(),
          `${trackLabel()} listened=${Math.floor(listenSession.listenedSec)}s (now playing на Last.fm не сбрасываем)`,
        );
      } else if (status === 'PLAYING') {
        debugLog('resume', trackLabel());
      }
      listenSession.lastStatus = status;
    }
  }

  if (status === 'PLAYING' && !listenSession.nowPlayingSent) {
    listenSession.nowPlayingSent = true;
    sendNowPlaying().catch((error) => console.error('[lastfm] nowPlaying fail', error));
  }

  if (
    shouldScrobble({
      durationSec: listenSession.durationSec,
      listenedSec: listenSession.listenedSec,
      alreadyScrobbled: listenSession.scrobbled,
    })
  ) {
    listenSession.scrobbled = true;
    sendScrobble().catch((error) => {
      listenSession.scrobbled = false;
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
