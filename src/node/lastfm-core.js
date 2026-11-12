const crypto = require('crypto');

const MIN_TRACK_DURATION_SEC = 30;
const MAX_LISTEN_BEFORE_SCROBBLE_SEC = 4 * 60;

function defaultLastfmSettings() {
  return {
    enabled: false,
    apiKey: '',
    apiSecret: '',
    sessionKey: '',
    username: '',
  };
}

function normalizeLastfmSettings(parsed) {
  const defaults = defaultLastfmSettings();
  if (!parsed || typeof parsed !== 'object') {
    return { ...defaults };
  }
  return {
    enabled: parsed.enabled === true,
    apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
    apiSecret: typeof parsed.apiSecret === 'string' ? parsed.apiSecret : '',
    sessionKey: typeof parsed.sessionKey === 'string' ? parsed.sessionKey : '',
    username: typeof parsed.username === 'string' ? parsed.username : '',
  };
}

function signParams(params, apiSecret) {
  const keys = Object.keys(params).filter((key) => key !== 'format' && key !== 'api_sig').sort();
  const base = keys.map((key) => `${key}${params[key]}`).join('') + apiSecret;
  return crypto.createHash('md5').update(base, 'utf8').digest('hex');
}

function canScrobbleTrack(durationSec) {
  return Number(durationSec) > MIN_TRACK_DURATION_SEC;
}

function scrobbleThresholdSec(durationSec) {
  const duration = Number(durationSec) || 0;
  return Math.min(Math.floor(duration / 2), MAX_LISTEN_BEFORE_SCROBBLE_SEC);
}

function shouldScrobble({ durationSec, listenedSec, alreadyScrobbled }) {
  if (alreadyScrobbled) return false;
  if (!canScrobbleTrack(durationSec)) return false;
  return Number(listenedSec) >= scrobbleThresholdSec(durationSec);
}

const NOW_PLAYING_RETRY_MS = 15000;
const REPLAY_ELAPSED_MAX_SEC = 1.5;
const REPLAY_REWIND_MIN_SEC = 2;

function emptyListenSession() {
  return {
    trackKey: null,
    artist: null,
    title: null,
    album: '',
    durationSec: 0,
    startedAt: null,
    lastElapsed: null,
    listenedSec: 0,
    nowPlayingSent: false,
    nowPlayingAttemptAt: 0,
    scrobbled: false,
    lastStatus: null,
  };
}

// Тот же трек, но позиция отмотана к началу — новый прослуш.
function isReplay(session, trackKey, status, elapsedSec) {
  if (!session?.trackKey || session.trackKey !== trackKey) return false;
  if (status !== 'PLAYING') return false;
  if (session.lastElapsed == null) return false;
  return elapsedSec <= REPLAY_ELAPSED_MAX_SEC
    && session.lastElapsed - elapsedSec >= REPLAY_REWIND_MIN_SEC;
}

function applyPlayback(session, event, now) {
  const status = event.status || 'STOPPED';
  const elapsedSec = Number(event.elapsedSec) || 0;
  const durationSec = Number(event.durationSec) || 0;
  const trackKey = event.trackKey;
  const current = session && session.trackKey ? session : emptyListenSession();
  const events = [];
  const fresh = current.trackKey !== trackKey || isReplay(current, trackKey, status, elapsedSec);

  let next;
  if (fresh) {
    if (current.trackKey) events.push('end');
    // Новый объект: ответ API по старой сессии не должен трогать эту.
    next = {
      ...emptyListenSession(),
      trackKey,
      artist: event.artist,
      title: event.title,
      album: event.album || '',
      durationSec,
      startedAt: status === 'PLAYING' ? now : null,
      lastElapsed: elapsedSec,
      lastStatus: status,
    };
    events.push('start');
  } else {
    next = current;
    if (durationSec > 0) next.durationSec = durationSec;
    if (!next.album && event.album) next.album = event.album;

    if (status !== 'PLAYING') {
      next.lastElapsed = elapsedSec;
    } else if (next.lastElapsed == null) {
      next.lastElapsed = elapsedSec;
    } else {
      const delta = elapsedSec - next.lastElapsed;
      next.lastElapsed = elapsedSec;
      if (delta > 0 && delta <= 2.5) next.listenedSec += delta;
    }

    if (status === 'PLAYING' && next.startedAt == null) {
      next.startedAt = now;
    }

    if (next.lastStatus !== status) {
      if (status === 'PAUSED' || status === 'STOPPED') events.push(status.toLowerCase());
      else if (status === 'PLAYING') events.push('resume');
      next.lastStatus = status;
    }
  }

  let sendNowPlaying = false;
  if (status === 'PLAYING' && !next.nowPlayingSent) {
    if (!next.nowPlayingAttemptAt || now - next.nowPlayingAttemptAt >= NOW_PLAYING_RETRY_MS) {
      next.nowPlayingAttemptAt = now;
      sendNowPlaying = true;
    }
  }

  let sendScrobble = false;
  if (next.startedAt != null && shouldScrobble({
    durationSec: next.durationSec,
    listenedSec: next.listenedSec,
    alreadyScrobbled: next.scrobbled,
  })) {
    next.scrobbled = true;
    sendScrobble = true;
  }

  return { session: next, events, sendNowPlaying, sendScrobble };
}

module.exports = {
  MIN_TRACK_DURATION_SEC,
  MAX_LISTEN_BEFORE_SCROBBLE_SEC,
  NOW_PLAYING_RETRY_MS,
  defaultLastfmSettings,
  normalizeLastfmSettings,
  signParams,
  canScrobbleTrack,
  scrobbleThresholdSec,
  shouldScrobble,
  emptyListenSession,
  isReplay,
  applyPlayback,
};
