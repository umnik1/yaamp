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

module.exports = {
  MIN_TRACK_DURATION_SEC,
  MAX_LISTEN_BEFORE_SCROBBLE_SEC,
  defaultLastfmSettings,
  normalizeLastfmSettings,
  signParams,
  canScrobbleTrack,
  scrobbleThresholdSec,
  shouldScrobble,
};
