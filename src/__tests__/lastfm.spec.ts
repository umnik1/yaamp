const {
  signParams,
  canScrobbleTrack,
  scrobbleThresholdSec,
  shouldScrobble,
  normalizeLastfmSettings,
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
