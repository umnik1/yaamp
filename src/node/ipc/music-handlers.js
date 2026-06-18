const { ipcMain } = require('electron');
const { getTrackUrl } = require('yandex-music-client/trackUrl');
const mainWindow = require('../main-window');
const playbackState = require('../playback-state');
const userData = require('../user-data');
const { rpc, sessionId } = require('../discord');

const DEFAULT_WHEEL_SEEDS = ['user:onyourwave'];
const RADIO_FROM = 'web-main-rup-radio-main';

function sendToRenderer(channel, ...args) {
  mainWindow.get()?.webContents.send(channel, ...args);
}

function registerMusicHandlers(client) {
  const { accountData } = playbackState;

  ipcMain.handle('getLikedTracks', async () => {
    playbackState.nowPlaylist = [];
    const likeTrackIDs = [];

    await client.tracks.getLikedTracksIds(client, accountData.uid).then((data) => {
      data.result.library.tracks.forEach((element) => {
        likeTrackIDs.push(element.id);
      });
    });

    return client.tracks.getTracks({ 'track-ids': likeTrackIDs });
  });

  ipcMain.handle('getTrackByID', async (event, trackid) => {
    if (trackid.includes('blob')) {
      return trackid;
    }

    playbackState.nowPlaying = trackid;

    const data = await getTrackUrl(client, trackid);

    await client.tracks.playAudio({
      'track-id': trackid,
      from: RADIO_FROM,
      timestamp: new Date().toISOString(),
      uid: accountData.uid,
      'play-id': sessionId,
    });

    if (!/^.*-.*-.*-.*-.*$/.test(trackid)) {
      await client.tracks.getTracks({ 'track-ids': [trackid] }).then((trackData) => {
        const element = trackData.result[0];
        playbackState.currentTrackMetadata = element;
        sendToRenderer('trackMetadata', element);
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
        });
      });
    }

    return data;
  });

  ipcMain.handle('getUserPlaylists', async () => {
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

  ipcMain.handle('getWheelWaves', async () => fetchWheelWaves());

  ipcMain.handle('resetWheel', async () => {
    saveWheelSeeds(DEFAULT_WHEEL_SEEDS);
    return fetchWheelWaves();
  });

  ipcMain.handle('setWave', async (event, data) => {
    playbackState.nowPlaylist = [];

    if (data.seeds) {
      saveWheelSeeds(data.seeds);
    }

    sendToRenderer('setLoader');

    const { tracks } = await client.rotor.getRotorSessionTracksBySeed(data, 10);

    sendToRenderer('setTracks', tracks);
    sendToRenderer('hideLoader');

    return true;
  });

  ipcMain.handle('setPlaylist', async (event, data) => {
    await client.playlists.getPlaylistById(data.uid, data.kind).then(async (playlistData) => {
      playbackState.nowPlaylist = {
        uid: playlistData.result.uid,
        kind: playlistData.result.kind,
        title: playlistData.result.title,
      };

      const trackIds = playlistData.result.tracks.map((element) => element.id);

      await client.tracks.getTracks({ 'track-ids': trackIds }).then((tracksData) => {
        sendToRenderer('setTracks', tracksData.result);
      });
    });

    return true;
  });

  ipcMain.handle('getUserArtists', async () => {
    const userArtists = [];

    await client.artists.getArtists(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userArtists.push({ title: element.name, id: element.id });
      });
    });

    return userArtists;
  });

  ipcMain.handle('setArtist', async (event, data) => {
    sendToRenderer('setLoader');

    try {
      const artistData = await client.artists.getPopularTracks(data.id);
      const tracksData = await client.tracks.getTracks({ 'track-ids': artistData.result.tracks });
      sendToRenderer('setTracks', tracksData.result);
    } finally {
      sendToRenderer('hideLoader');
    }

    return true;
  });

  ipcMain.handle('getUserAlbums', async () => {
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

  ipcMain.handle('setAlbum', async (event, data) => {
    playbackState.nowPlaylist = [];

    await client.albums.getAlbumsWithTracks(data.id).then(async (albumData) => {
      const trackIds = albumData.result.volumes[0].map((element) => element.id);

      await client.tracks.getTracks({ 'track-ids': trackIds }).then((tracksData) => {
        sendToRenderer('setTracks', tracksData.result);
      });
    });

    return true;
  });

  ipcMain.handle('getRotor', async () => {
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

  const loadRadioTracks = async (stationId, iterations) => {
    const tracks = [];
    let lastTrackID = null;

    await client.rotor.sendStationFeedback(
      stationId,
      { type: 'radioStarted', from: RADIO_FROM, timestamp: new Date().toISOString() },
      null,
    );

    sendToRenderer('setLoader');

    for (let i = 0; i < iterations; i++) {
      if (i !== 0) {
        lastTrackID = tracks[tracks.length - 1].id;
      }

      await client.rotor.getStationTracks(stationId, true, lastTrackID).then((data) => {
        data.result.sequence.forEach((element) => {
          tracks.push(element.track);
        });
      });
    }

    sendToRenderer('setTracks', tracks);
    sendToRenderer('hideLoader');
  };

  ipcMain.handle('setRotor', async (event, data) => {
    playbackState.nowPlaylist = [];
    await loadRadioTracks(data.id, 15);
    return true;
  });

  ipcMain.handle('setMywave', async () => {
    playbackState.nowPlaylist = [];
    await loadRadioTracks('user:onyourwave', 25);
    return true;
  });

  ipcMain.handle('setMyloved', async () => {
    playbackState.nowPlaylist = [];
    const likeTrackIDs = [];

    await client.tracks.getLikedTracksIds(client, accountData.uid).then((data) => {
      data.result.library.tracks.forEach((element) => {
        likeTrackIDs.push(element.id);
      });
    });

    await client.tracks.getTracks({ 'track-ids': likeTrackIDs }).then((data) => {
      sendToRenderer('setTracks', data.result);
    });
  });

  ipcMain.handle('search', async (event, data) => {
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

  ipcMain.handle('lendings', async () => {
    const ALL_LANDING_BLOCKS = ['personalplaylists'];
    const allBlocks = ALL_LANDING_BLOCKS.join(',');

    return client.landing.getLandingBlocks(allBlocks).then((data) => {
      return data.result.blocks[0].entities;
    });
  });

  ipcMain.handle('setLike', async () => {
    await client.tracks.likeTracks(client, { 'track-ids': playbackState.nowPlaying }).then(() => {
      sendToRenderer('showMessage', 'Трек добавлен в "Мне нравится"');
    });
  });

  ipcMain.handle('setDislike', async () => {
    await client.tracks.dislikeTracks(accountData.uid, { 'track-ids': playbackState.nowPlaying }).then(() => {
      sendToRenderer('showMessage', 'Дизлайк поставлен');
    });
  });

  ipcMain.handle('nowPlaylist', async () => playbackState.nowPlaylist);

  ipcMain.handle('getCurrentTrackMetadata', async () => playbackState.currentTrackMetadata);

  ipcMain.handle('setPlaylistRecomendation', async (event, data) => {
    const tracks = [];

    sendToRenderer('setLoader');

    for (let i = 0; i < 25; i++) {
      await client.playlists.getRecommendations(data.uid, data.kind).then((recData) => {
        recData.result.tracks.forEach((element) => {
          tracks.push(element.id);
        });
      });
    }

    await client.tracks.getTracks({ 'track-ids': tracks }).then((tracksData) => {
      sendToRenderer('setTracks', tracksData.result);
      sendToRenderer('hideLoader');
    });
  });
}

module.exports = { registerMusicHandlers };
