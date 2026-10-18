const { ipcMain } = require('electron');
const { getTrackUrl } = require('yandex-music-client/trackUrl');
const mainWindow = require('../main-window');
const playbackState = require('../playback-state');
const userData = require('../user-data');
const history = require('../history');
const { rpc, sessionId } = require('../discord');

const DEFAULT_WHEEL_SEEDS = ['user:onyourwave'];
const RADIO_FROM = 'web-main-rup-radio-main';

function sendToRenderer(channel, ...args) {
  mainWindow.get()?.webContents.send(channel, ...args);
}

const API_ERROR_MESSAGE = 'Не удалось получить данные из Яндекс Музыки';

// Регистрирует IPC-обработчик, который при ошибке API убирает лоадер и
// показывает сообщение, а затем пробрасывает ошибку вызывающему коду.
function handle(channel, fn, errorMessage = API_ERROR_MESSAGE) {
  ipcMain.handle(channel, async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[${channel}]`, error);
      sendToRenderer('hideLoader');
      sendToRenderer('showMessage', errorMessage);
      throw error;
    }
  });
}

// Растёт при каждой замене плейлиста; по нему фоновая догрузка радио
// понимает, что пользователь уже переключился на другой плейлист.
let playlistGeneration = 0;

function replaceTracks(tracks) {
  playlistGeneration++;
  sendToRenderer('setTracks', tracks);
}

function logError(context) {
  return (error) => console.error(`[${context}]`, error);
}

function registerMusicHandlers(client) {
  const { accountData } = playbackState;

  handle('getLikedTracks', async () => {
    playbackState.nowPlaylist = [];
    const likeTrackIDs = [];

    await client.tracks.getLikedTracksIds(client, accountData.uid).then((data) => {
      data.result.library.tracks.forEach((element) => {
        likeTrackIDs.push(element.id);
      });
    });

    return client.tracks.getTracks({ 'track-ids': likeTrackIDs });
  });

  const updateTrackMetadata = async (trackid) => {
    const trackData = await client.tracks.getTracks({ 'track-ids': [trackid] });
    const element = trackData.result[0];
    if (!element) return;

    playbackState.currentTrackMetadata = element;
    sendToRenderer('trackMetadata', element);
    if (history.addTrack(element)) {
      sendToRenderer('historyUpdated', history.entries);
    }

    const artist = element.artists.map((a) => a.name);
    rpc.setActivity({
      details: `${element.title}`,
      state: `${artist.join(', ')}`,
      largeImageKey: 'https://' + element.coverUri.replace('%%', '200x200'),
      largeImageText: `${artist.join(', ')} - ${element.title}`,
      smallImageKey: 'https://yaamp.ru/icon.png',
      smallImageText: 'Yaamp.ru',
      buttons: [
        {
          label: 'Listen to this track',
          url: `https://music.yandex.ru/track/${element.id}`,
        },
      ],
    }).catch(logError('discord'));
  };

  handle('getTrackByID', async (event, trackid) => {
    if (trackid.includes('blob')) {
      return trackid;
    }

    playbackState.nowPlaying = trackid;

    const data = await getTrackUrl(client, trackid);

    // Статистика прослушивания и метаданные не должны задерживать или
    // ломать воспроизведение, поэтому их ошибки только логируются.
    client.tracks.playAudio({
      'track-id': trackid,
      from: RADIO_FROM,
      timestamp: new Date().toISOString(),
      uid: accountData.uid,
      'play-id': sessionId,
    }).catch(logError('playAudio'));

    if (!/^.*-.*-.*-.*-.*$/.test(trackid)) {
      updateTrackMetadata(trackid).catch(logError('trackMetadata'));
    }

    return data;
  }, 'Не удалось загрузить трек');

  handle('getUserPlaylists', async () => {
    const userPlaylists = [];

    await client.playlists.getPlayLists(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userPlaylists.push({ title: element.title, uid: element.uid, kind: element.kind });
      });
    });

    return userPlaylists;
  });

  const getWheelSeeds = () => userData.settingsData.wheelSeeds || DEFAULT_WHEEL_SEEDS;

  const saveWheelSeeds = (seeds) => {
    userData.settingsData.wheelSeeds = seeds;
    userData.saveSettings();
  };

  const fetchWheelWaves = async () => {
    const { waves } = await client.wheel.getNewWheelWaves({
      context: {
        type: 'WAVE',
        data: { seeds: getWheelSeeds() },
      },
      feedbacks: [],
    });
    return waves;
  };

  handle('getWheelWaves', async () => fetchWheelWaves());

  handle('resetWheel', async () => {
    saveWheelSeeds(DEFAULT_WHEEL_SEEDS);
    return fetchWheelWaves();
  });

  handle('setWave', async (event, data) => {
    playbackState.nowPlaylist = [];

    if (data.seeds) {
      saveWheelSeeds(data.seeds);
    }

    sendToRenderer('setLoader');

    const { tracks } = await client.rotor.getRotorSessionTracksBySeed(data, 10);

    replaceTracks(tracks);
    sendToRenderer('hideLoader');

    return true;
  });

  handle('setPlaylist', async (event, data) => {
    await client.playlists.getPlaylistById(data.uid, data.kind).then(async (playlistData) => {
      playbackState.nowPlaylist = {
        uid: playlistData.result.uid,
        kind: playlistData.result.kind,
        title: playlistData.result.title,
      };

      const trackIds = playlistData.result.tracks.map((element) => element.id);

      await client.tracks.getTracks({ 'track-ids': trackIds }).then((tracksData) => {
        replaceTracks(tracksData.result);
      });
    });

    return true;
  });

  handle('getUserArtists', async () => {
    const userArtists = [];

    await client.artists.getArtists(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userArtists.push({ title: element.name, id: element.id });
      });
    });

    return userArtists;
  });

  handle('setArtist', async (event, data) => {
    sendToRenderer('setLoader');

    try {
      const artistData = await client.artists.getPopularTracks(data.id);
      const tracksData = await client.tracks.getTracks({ 'track-ids': artistData.result.tracks });
      replaceTracks(tracksData.result);
    } finally {
      sendToRenderer('hideLoader');
    }

    return true;
  });

  handle('getUserAlbums', async () => {
    const userAlbumsIds = [];
    const userAlbums = [];

    await client.albums.getAlbums(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userAlbumsIds.push(element.id);
      });
    });

    await client.albums.getAlbumsByIds({ 'album-ids': userAlbumsIds }).then((data) => {
      data.result.forEach((element) => {
        if (element.type !== 'podcast') {
          userAlbums.push({
            title: element.artists[0].name + ' - ' + element.title,
            id: element.id,
          });
        }
      });
    });

    return userAlbums;
  });

  handle('setAlbum', async (event, data) => {
    playbackState.nowPlaylist = [];

    await client.albums.getAlbumsWithTracks(data.id).then(async (albumData) => {
      const trackIds = albumData.result.volumes[0].map((element) => element.id);

      await client.tracks.getTracks({ 'track-ids': trackIds }).then((tracksData) => {
        replaceTracks(tracksData.result);
      });
    });

    return true;
  });

  handle('getRotor', async () => {
    const stations = [];

    await client.rotor.getStationsList('ru').then((data) => {
      data.result.forEach((element) => {
        stations.push({
          title: element.station.name,
          id: element.station.id.type + ':' + element.station.id.tag,
        });
      });
    });

    return stations;
  });

  // Треки станции приходят порциями, и каждая следующая зависит от последнего
  // трека предыдущей. Первую порцию показываем сразу, остальные дописываем
  // в конец плейлиста по мере загрузки.
  const loadRadioTracks = async (stationId, iterations) => {
    let lastTrackID = null;
    let generation = null;

    await client.rotor.sendStationFeedback(
      stationId,
      { type: 'radioStarted', from: RADIO_FROM, timestamp: new Date().toISOString() },
      null,
    );

    sendToRenderer('setLoader');

    try {
      for (let i = 0; i < iterations; i++) {
        const data = await client.rotor.getStationTracks(stationId, true, lastTrackID);
        const tracks = data.result.sequence.map((element) => element.track);
        if (tracks.length === 0) break;

        lastTrackID = tracks[tracks.length - 1].id;
        if (i === 0) {
          replaceTracks(tracks);
          generation = playlistGeneration;
        } else if (generation !== playlistGeneration) {
          break;
        } else {
          sendToRenderer('appendTracks', tracks);
        }

        if (i === 0) {
          sendToRenderer('hideLoader');
        }
      }
    } finally {
      sendToRenderer('hideLoader');
    }
  };

  handle('setRotor', async (event, data) => {
    playbackState.nowPlaylist = [];
    await loadRadioTracks(data.id, 15);
    return true;
  });

  handle('setMywave', async () => {
    playbackState.nowPlaylist = [];
    await loadRadioTracks('user:onyourwave', 25);
    return true;
  });

  handle('setMyloved', async () => {
    playbackState.nowPlaylist = [];
    const likeTrackIDs = [];

    await client.tracks.getLikedTracksIds(client, accountData.uid).then((data) => {
      data.result.library.tracks.forEach((element) => {
        likeTrackIDs.push(element.id);
      });
    });

    await client.tracks.getTracks({ 'track-ids': likeTrackIDs }).then((data) => {
      replaceTracks(data.result);
    });
  });

  handle('search', async (event, data) => {
    let best = [];

    await client.search.getSearchSuggest(data.searchText).then((searchData) => {
      if (searchData.result.best) {
        if (searchData.result.best.type === 'artist') {
          best = [{
            type: searchData.result.best.type,
            id: searchData.result.best.result.id,
            name: searchData.result.best.result.name,
          }];
        }
        if (searchData.result.best.type === 'album') {
          best = [{
            type: searchData.result.best.type,
            id: searchData.result.best.result.id,
            name: searchData.result.best.result.title,
          }];
        }
      }
    });

    return best;
  });

  handle('lendings', async () => {
    const ALL_LANDING_BLOCKS = ['personalplaylists'];
    const allBlocks = ALL_LANDING_BLOCKS.join(',');

    return client.landing.getLandingBlocks(allBlocks).then((data) => {
      return data.result.blocks[0].entities;
    });
  });

  handle('setLike', async () => {
    await client.tracks.likeTracks(client, { 'track-ids': playbackState.nowPlaying }).then(() => {
      sendToRenderer('showMessage', 'Трек добавлен в "Мне нравится"');
    });
  });

  handle('setDislike', async () => {
    await client.tracks.dislikeTracks(accountData.uid, { 'track-ids': playbackState.nowPlaying }).then(() => {
      sendToRenderer('showMessage', 'Дизлайк поставлен');
    });
  });

  handle('nowPlaylist', async () => playbackState.nowPlaylist);

  handle('getCurrentTrackMetadata', async () => playbackState.currentTrackMetadata);

  handle('getHistory', async () => history.entries);

  handle('clearHistory', async () => {
    history.clearHistory();
    sendToRenderer('historyUpdated', history.entries);
    return true;
  });

  handle('setPlaylistRecomendation', async (event, data) => {
    const REQUESTS = 25;
    const CONCURRENCY = 5;
    const tracks = [];

    sendToRenderer('setLoader');

    try {
      for (let i = 0; i < REQUESTS; i += CONCURRENCY) {
        const batch = Array.from({ length: Math.min(CONCURRENCY, REQUESTS - i) }, () =>
          client.playlists.getRecommendations(data.uid, data.kind)
        );
        for (const recData of await Promise.all(batch)) {
          recData.result.tracks.forEach((element) => {
            tracks.push(element.id);
          });
        }
      }

      const tracksData = await client.tracks.getTracks({ 'track-ids': [...new Set(tracks)] });
      replaceTracks(tracksData.result);
    } finally {
      sendToRenderer('hideLoader');
    }
  });
}

module.exports = { registerMusicHandlers };
