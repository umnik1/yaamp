const {
  signParams,
  canScrobbleTrack,
  scrobbleThresholdSec,
  shouldScrobble,
  normalizeLastfmSettings,
  emptyListenSession,
  applyPlayback,
  NOW_PLAYING_RETRY_MS,
} = require('../node/lastfm-core');

describe('lastfm signing', () => {
  it('builds api_sig from sorted params + secret', () => {
    const params = {
      method: 'auth.getToken',
      api_key: 'demoKey',
      format: 'json',
    };
    const sig = signParams(params, 'demoSecret');
    expect(sig).toBe(
      require('crypto')
        .createHash('md5')
        .update('api_keydemoKeymethodauth.getTokendemoSecret', 'utf8')
        .digest('hex'),
    );
  });

  it('ignores format and api_sig when signing', () => {
    const a = signParams({ method: 'track.scrobble', artist: 'A', track: 'T', format: 'json' }, 's');
    const b = signParams({ method: 'track.scrobble', artist: 'A', track: 'T', api_sig: 'x' }, 's');
    expect(a).toBe(b);
  });
});

describe('lastfm scrobble threshold', () => {
  it('rejects tracks 30 seconds or shorter', () => {
    expect(canScrobbleTrack(30)).toBe(false);
    expect(canScrobbleTrack(29)).toBe(false);
    expect(canScrobbleTrack(31)).toBe(true);
  });

  it('uses half duration capped at 4 minutes', () => {
    expect(scrobbleThresholdSec(100)).toBe(50);
    expect(scrobbleThresholdSec(600)).toBe(240);
  });

  it('scrobbles once after enough listened time', () => {
    expect(
      shouldScrobble({ durationSec: 100, listenedSec: 49, alreadyScrobbled: false }),
    ).toBe(false);
    expect(
      shouldScrobble({ durationSec: 100, listenedSec: 50, alreadyScrobbled: false }),
    ).toBe(true);
    expect(
      shouldScrobble({ durationSec: 100, listenedSec: 50, alreadyScrobbled: true }),
    ).toBe(false);
  });
});

describe('lastfm listen session', () => {
  const track = (over = {}) => ({
    trackKey: '1',
    artist: 'Artist',
    title: 'Title',
    album: 'Album',
    durationSec: 100,
    elapsedSec: 0,
    status: 'PLAYING',
    ...over,
  });

  it('does not start the scrobble clock until playback', () => {
    const selected = applyPlayback(
      emptyListenSession(),
      track({ status: 'STOPPED', elapsedSec: 0 }),
      1_000,
    );
    expect(selected.session.startedAt).toBeNull();
    expect(selected.sendNowPlaying).toBe(false);

    const playing = applyPlayback(selected.session, track({ elapsedSec: 0 }), 5_000);
    expect(playing.session.startedAt).toBe(5_000);
    expect(playing.sendNowPlaying).toBe(true);
  });

  it('starts a new session when the same track restarts', () => {
    let session = applyPlayback(emptyListenSession(), track({ elapsedSec: 0 }), 1_000).session;
    session = applyPlayback(session, track({ elapsedSec: 40 }), 40_000).session;
    session.scrobbled = true;
    session.nowPlayingSent = true;

    const replay = applyPlayback(session, track({ elapsedSec: 0 }), 50_000);
    expect(replay.session).not.toBe(session);
    expect(replay.events).toContain('start');
    expect(replay.session.listenedSec).toBe(0);
    expect(replay.session.scrobbled).toBe(false);
    expect(replay.session.nowPlayingSent).toBe(false);
    expect(replay.session.startedAt).toBe(50_000);
    expect(replay.sendNowPlaying).toBe(true);
    session.scrobbled = false;
    expect(replay.session.scrobbled).toBe(false);
  });

  it('retries now playing only after the backoff', () => {
    const first = applyPlayback(emptyListenSession(), track({ elapsedSec: 0 }), 1_000);
    expect(first.sendNowPlaying).toBe(true);

    const soon = applyPlayback(first.session, track({ elapsedSec: 1 }), 2_000);
    expect(soon.sendNowPlaying).toBe(false);
    expect(soon.session).toBe(first.session);

    const later = applyPlayback(
      soon.session,
      track({ elapsedSec: 2 }),
      1_000 + NOW_PLAYING_RETRY_MS,
    );
    expect(later.sendNowPlaying).toBe(true);
  });

  it('keeps the same session across pause and resume', () => {
    const started = applyPlayback(emptyListenSession(), track({ elapsedSec: 1 }), 1_000);
    started.session.nowPlayingSent = true;
    const paused = applyPlayback(started.session, track({ status: 'PAUSED', elapsedSec: 10 }), 10_000);
    expect(paused.session).toBe(started.session);
    expect(paused.events).toContain('paused');
    expect(paused.session.startedAt).toBe(1_000);

    const resumed = applyPlayback(paused.session, track({ elapsedSec: 10 }), 20_000);
    expect(resumed.session).toBe(started.session);
    expect(resumed.events).toContain('resume');
    expect(resumed.sendNowPlaying).toBe(false);
  });
});

describe('lastfm settings normalize', () => {
  it('fills defaults for missing values', () => {
    expect(normalizeLastfmSettings(undefined)).toEqual({
      enabled: false,
      apiKey: '',
      apiSecret: '',
      sessionKey: '',
      username: '',
    });
  });

  it('keeps provided fields', () => {
    expect(
      normalizeLastfmSettings({
        enabled: true,
        apiKey: 'k',
        apiSecret: 's',
        sessionKey: 'sk',
        username: 'u',
      }),
    ).toEqual({
      enabled: true,
      apiKey: 'k',
      apiSecret: 's',
      sessionKey: 'sk',
      username: 'u',
    });
  });
});
