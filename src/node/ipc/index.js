const { YandexMusicClient } = require('yandex-music-client/YandexMusicClient');
const userData = require('../user-data');
const playbackState = require('../playback-state');
const { registerMusicHandlers } = require('./music-handlers');
const { registerAppHandlers } = require('./app-handlers');

async function registerIpcHandlers() {
  const client = new YandexMusicClient({
    BASE: 'https://api.music.yandex.net:443',
    HEADERS: {
      Authorization: `OAuth ${userData.yaAuthToken}`,
      'Accept-Language': 'ru',
    },
  });

  client.account.getAccountStatus().then(({ result }) => {
    playbackState.accountData.uid = result.account.uid;
    playbackState.accountData.login = result.account.login;
    playbackState.accountData.fullName = result.account.fullName;
    playbackState.accountData.secondName = result.account.secondName;
    playbackState.accountData.firstName = result.account.firstName;
    playbackState.accountData.displayName = result.account.displayName;
  });

  registerMusicHandlers(client);
  registerAppHandlers();
}

module.exports = { registerIpcHandlers };
