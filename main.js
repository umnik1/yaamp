const isDev = require('electron-is-dev')
const path = require('path')
const url = require('url')
const { ipcMain, webContents, session } = require('electron')
const crypto = require("crypto");
const DiscordRPC =  require('discord-rpc');

const checkForUpdatesAndNotify = require('./src/node/updates.js')
const interceptStreamProtocol = require('./src/node/protocol.js')

const electron = require('electron')
const fs = require('fs')
const {readFile} = require('fs/promises');

const app = electron.app
const BrowserWindow = electron.BrowserWindow

const { YandexMusicClient } = require('yandex-music-client/YandexMusicClient')
const { getTrackUrl } = require('yandex-music-client/trackUrl')

if (isDev) {
  require('electron-debug')({ showDevTools: 'undocked' })
}

const tokenPath = app.getPath("userData") + '/token.json';
const skinPath = app.getPath("userData") + '/skin.json';
const URL_WITH_ACCESS_TOKEN_REGEX = 'https:\\/\\/music\\.yandex\\.(?:ru|com|by|kz|ua)\\/#access_token=([^&]*)';

let nowPlaying = 0;
let nowPlaylist = [];

let yaAuthToken = '';
let skinData = '';
const sessionId = crypto.randomBytes(20).toString('hex');
const clientId = '1161295534770892860';

if (process.platform !== 'linux' && process.platform !== 'darwin') {
  DiscordRPC.register(clientId);

  const rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.login({ clientId }).catch(console.error);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  electron.protocol.interceptStreamProtocol(
    'file',
    interceptStreamProtocol(),
    (error) => {
      if (error) {
        console.error('Failed to register protocol')
      }
    },
  )

  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().size

  app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
  // For Linux: Remove "resizable"

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true,
    useContentSize: false,
    frame: false,
    hasShadow: false,
    show: false,
    resizable: false,
    fullscreenable: false,
    icon: path.join(__dirname, 'res/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false,
      preload: path.join(__dirname, 'src/node/preload.js'),
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: './dist/index.html',
    protocol: 'file:',
    slashes: true
  }))

  // and show window once it's ready (to prevent flashing)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    checkForUpdatesAndNotify()
  })

  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null
  })

}


function createLogin() {
  electron.protocol.interceptStreamProtocol(
    'file',
    interceptStreamProtocol(),
    (error) => {
      if (error) {
        console.error('Failed to register protocol')
      }
    },
  )

  app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 350,
    height: 450,
    frame: false,
    hasShadow: false,
    resizable: false,
    icon: path.join(__dirname, 'res/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'src/node/preload.js'),
    }
  })

  // and load the index.html of the app.
  mainWindow.loadURL('http://yaamp.ru/login.html')

  mainWindow.on('closed', function () {
    // Dereference the window object
    mainWindow = null
  })

}


const getTokenFromFile = async()=>{
  try {
    const result = await readFile(tokenPath,'binary')
    yaAuthToken = result;
  } catch (error) {
    fs.writeFile(tokenPath, '', (error) => {});  }
}

const getSkinFromFile = async()=>{
  try {
    const result = await readFile(skinPath,'binary')
    skinData = result;
  } catch (error) {
    fs.writeFile(skinPath, '', (error) => {});  }
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// Linux has transparency disabled and window creation delayed
// due to issues with transparency of Chromium on Linux.
// See https://bugs.chromium.org/p/chromium/issues/detail?id=854601#c7
if (process.platform === 'linux') {
  app.disableHardwareAcceleration()
  app.on('ready', () => {
    getTokenFromFile().then( () => {
  
      if (yaAuthToken) {
        setTimeout(createWindow, 100)
      } else {
        setTimeout(createLogin, 100)
      }
    })
  })
} else {
  app.on('ready', () => {
    getTokenFromFile().then( () => {
  
      if (yaAuthToken) {
        createWindow()
      } else {
        createLogin()
      }
    })
  })
}

if (yaAuthToken) {
  app.on('web-contents-created', (event, contents) => {
    // Prevent all navigation for security reasons
    // See https://github.com/electron/electron/blob/master/docs/tutorial/security.md#13-disable-or-limit-navigation
    contents.on('will-navigate', (event, navigationUrl) => {
      event.preventDefault()
    })
    // Prevent new window creation for security reasons
    // and open the URLs in the default browser instead
    // See https://github.com/electron/electron/blob/master/docs/tutorial/security.md#14-disable-or-limit-creation-of-new-windows
    contents.on('new-window', (event, navigationUrl) => {
      const parsedUrl = url.parse(navigationUrl)

      if (parsedUrl.protocol === 'file:' || parsedUrl.protocol === 'chrome-devtools:') {
        return
      }

      event.preventDefault()
      electron.shell.openExternal(navigationUrl)
    })
  })
} else {
  app.on('web-contents-created', (event, contents) => {

    contents.on('will-navigate', (event, navigationUrl) => {

      const match = navigationUrl.match(URL_WITH_ACCESS_TOKEN_REGEX);
      if (match) {
        fs.writeFile(tokenPath, match[1], (error) => {
          if (!error) {
            app.relaunch();
            app.quit();
          }
        });
      }
    })
  })}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

let accountData = {};

getTokenFromFile().then( () => {
  const client = new YandexMusicClient({
    BASE: "https://api.music.yandex.net:443",
    HEADERS: {
        'Authorization': `OAuth ${yaAuthToken}`,
        // specify 'en' to receive data in English
        'Accept-Language': 'ru'
      },
  });

  client.account.getAccountStatus().then(async ({result}) => {
    accountData.uid = result.account.uid;
    accountData.login = result.account.login;
    accountData.fullName = result.account.fullName;
    accountData.secondName = result.account.secondName;
    accountData.firstName = result.account.firstName;
    accountData.displayName = result.account.displayName;
  });


  // Получаем любимые треки
  ipcMain.handle('getLikedTracks', async (event) => {
    nowPlaylist = [];
    let likeTrackIDs = [];

    const data = await client.tracks.getLikedTracksIds(client, accountData.uid).then((data) => {
        data.result.library.tracks.forEach((element) => {
          likeTrackIDs.push(element.id);
        });
        return data;
    })

    const tracks = await client.tracks.getTracks({"track-ids": likeTrackIDs}).then((data) => {
      return data;
    })

    return tracks;
  })

  // Получаем URL трека по ID
  ipcMain.handle('getTrackByID', async (event, trackid) => {

    nowPlaying = trackid;

    const data = await getTrackUrl(client, trackid).then((data) => {
        return data;
    })

    await client.tracks.playAudio({"track-id": trackid, "from": 'web-main-rup-radio-main', "timestamp": new Date().toISOString(), 'uid': accountData.uid, 'play-id': sessionId}).then((data) => {
      return data;
    })

    if (process.platform !== 'linux' && process.platform !== 'darwin') {
      // Discord Integration

      // Check on uploaded track
      if (!/^.*-.*-.*-.*-.*$/.test(trackid)) {
        await client.tracks.getTracks({"track-ids": [trackid]}).then((data) => {
          const element = data.result[0];
          const startTimestamp = new Date();

          let artist = [];

          element.artists.forEach((a) => {
            artist.push(a.name);
          });

          const presObj = {
            details: `${element.title}`,
            state: `${artist.join(', ')}`,
            largeImageKey: 'https://' + element.coverUri.replace("%%", "200x200"),
            largeImageText: `${artist.join(', ')} - ${element.title}`,
            smallImageKey: 'https://yaamp.ru/icon.png',
            smallImageText: 'Yaamp.ru',
            buttons: [
              {
                label: 'Listen this track',
                url: `https://music.yandex.ru/track/${element.id}`,
              },
            ],
          };
        
          rpc.setActivity(presObj);

          return data;
        })
      }
      
    }

    return data;

  })

  // Получаем список плейлистов пользователя
  ipcMain.handle('getUserPlaylists', async (event) => {
    let userPlaylists = [];

    await client.playlists.getPlayLists(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userPlaylists.push({ title: element.title, uid: element.uid, kind: element.kind });
      });

      return userPlaylists;
    });

    return userPlaylists;
  })

  // Задаём плейлист
  ipcMain.handle('setPlaylist', async (event, data) => {
    let tracks = [];
    let tracksList = [];


    await client.playlists.getPlaylistById(data.uid, data.kind).then(async (data) => {
      nowPlaylist = { uid: data.result.uid, kind: data.result.kind, title: data.result.title };
      
      let tracks = [];

      data.result.tracks.forEach((element) => {
        tracks.push(element.id);
      });

      await client.tracks.getTracks({"track-ids": tracks}).then((data) => {
        mainWindow.webContents.send('setTracks', data.result);
      })

    });

    return true;
  })

  // Получаем список исполнителей пользователя
  ipcMain.handle('getUserArtists', async (event) => {
    let userArtists = [];

    await client.artists.getArtists(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userArtists.push({ title: element.name, id: element.id });
      });

      return userArtists;
    });

    return userArtists;
  })

  // Задаём испольнителя
  ipcMain.handle('setArtist', async (event, data) => {
    let tracks = [];

    await client.artists.getPopularTracks(data.id).then(async (data) => {
      tracks = data.result.tracks;
      tracks = await client.tracks.getTracks({"track-ids": tracks}).then((data) => {
        mainWindow.webContents.send('setTracks', data.result);
        
        return data;
      })

      return tracks;
    });

    return true;
  })

  // Получаем список альбомов пользователя
  ipcMain.handle('getUserAlbums', async (event) => {
    let userAlbumsIds = [];
    let userAlbums = [];

    await client.albums.getAlbums(client, accountData.uid).then((data) => {
      data.result.forEach((element) => {
        userAlbumsIds.push(element.id);
      });
    });

    await client.albums.getAlbumsByIds({"album-ids": userAlbumsIds}).then((data) => {
      data.result.forEach((element) => {
        if (element.type !== 'podcast') {
          userAlbums.push({ title: element.artists[0].name + ' - ' +element.title, id: element.id });
        }
      });
    });

    return userAlbums;
  })

  // Задаём альбом
  ipcMain.handle('setAlbum', async (event, data) => {
    nowPlaylist = [];
    let tracks = [];

    await client.albums.getAlbumsWithTracks(data.id).then(async (data) => {
      data.result.volumes[0].forEach((element) => {
        tracks.push(element.id);
      });
      tracks = await client.tracks.getTracks({"track-ids": tracks}).then((data) => {
        mainWindow.webContents.send('setTracks', data.result);
        
        return data;
      })

      return tracks;
    });

    return true;
  })

  // Получаем список станций
  ipcMain.handle('getRotor', async (event) => {
    let stations = [];
    let userAlbums = [];

    await client.rotor.getStationsList('ru').then((data) => {
      data.result.forEach((element) => {
        stations.push({ title: element.station.name, id: element.station.id.type + ':' + element.station.id.tag });
      });
    });

    return stations;
  })

  // Задаём станцию
  ipcMain.handle('setRotor', async (event, data) => {
    nowPlaylist = [];
    let rotorTracks = [];
    let lastTrackID = null;

    mainWindow.webContents.send('setLoader');

    await client.rotor.sendStationFeedback(data.id, {type: 'radioStarted', "from": 'web-main-rup-radio-main', "timestamp": new Date().toISOString()}, null).then((data) => {
      // console.log(data);
    })

    for (let i = 0; i < 15; i++) {
      if (i !== 0) {
        lastTrackID = rotorTracks[rotorTracks.length - 1].id;
      }

      await client.rotor.getStationTracks(data.id, true, lastTrackID).then((data) => {
        data.result.sequence.forEach((element) => {
          rotorTracks.push(element.track);
        });
      });
    }

    mainWindow.webContents.send('setTracks', rotorTracks);
    mainWindow.webContents.send('hideLoader');

    return true;
  })

  // Моя волна
  ipcMain.handle('setMywave', async (event) => {
    nowPlaylist = [];
    let myWave = [];

    let lastTrackID = null;

    await client.rotor.sendStationFeedback('user:onyourwave', {type: 'radioStarted', "from": 'web-main-rup-radio-main', "timestamp": new Date().toISOString()}, null).then((data) => {
      // console.log(data);
    })

    mainWindow.webContents.send('setLoader');

    for (let i = 0; i < 25; i++) {
      if (i !== 0) {
        lastTrackID = myWave[myWave.length - 1].id;
      }

      await client.rotor.getStationTracks('user:onyourwave', true, lastTrackID).then((data) => {
        data.result.sequence.forEach((element) => {
          myWave.push(element.track);
        });
      });
    }

    mainWindow.webContents.send('setTracks', myWave);
    mainWindow.webContents.send('hideLoader');

    return true;
  })


  // Любимые треки
  ipcMain.handle('setMyloved', async (event) => {
    nowPlaylist = [];
    let likeTrackIDs = [];

    const data = await client.tracks.getLikedTracksIds(client, accountData.uid).then((data) => {
        data.result.library.tracks.forEach((element) => {
          likeTrackIDs.push(element.id);
        });
        return data;
    })

    const tracks = await client.tracks.getTracks({"track-ids": likeTrackIDs}).then((data) => {
      mainWindow.webContents.send('setTracks', data.result);
    })
  })


  // Поиск
  ipcMain.handle('search', async (event, data) => {
    let best = [];

    await client.search.getSearchSuggest(data.searchText).then(async (data) => {
      if (data.result.best) {
        if (data.result.best.type === 'artist') {
          best = [{type: data.result.best.type, id: data.result.best.result.id, name: data.result.best.result.name }];
        }
        if (data.result.best.type === 'album') {
          best = [{type: data.result.best.type, id: data.result.best.result.id, name: data.result.best.result.title }];
        }
      }

      return best;
    });

    return best;
  })

  // Лендинг блоки
  ipcMain.handle('lendings', async (event, data) => {
    let lendings = [];

    const ALL_LANDING_BLOCKS = [
      "personalplaylists",
    ];

    const allBlocks = ALL_LANDING_BLOCKS.join(",");

    lendings = await client.landing.getLandingBlocks(allBlocks).then((data) => {
      lendings = data.result.blocks;

      return data.result.blocks[0].entities;
    })

    return lendings;
  })

  // Открытие ссылок
  ipcMain.handle('openLink', async (event, data) => {
    require('electron').shell.openExternal(data.link)

    return true;
  })

  // Играет сейчас
  ipcMain.handle('openPlayNow', async (event, data) => {
    require('electron').shell.openExternal(`https://music.yandex.ru/track/${nowPlaying}`)

    return true;
  })

  // Сохранения скина
  ipcMain.handle('setSkin', async (event, data) => {
    fs.writeFile(skinPath, data.link, (error) => {});

    return true;
  })

  // Удаление скина при ошибке
  ipcMain.handle('deleteSkin', async (event, data) => {
    fs.writeFile(skinPath, '', (error) => {});

    return true;
  })

  // Получение скина
  ipcMain.handle('getSkin', async (event, data) => {
    skinData = await getSkinFromFile().then( () => {
      return skinData;
    });

    return skinData;
  })

  // Поставить лайк
  ipcMain.handle('setLike', async (event, data) => {
    await client.tracks.likeTracks(client, {"track-ids": nowPlaying}).then((data) => {
      mainWindow.webContents.send('showMessage', 'Трек добавлен в "Мне нравится"');
    })
  })

  // Поставить дизлайк
  ipcMain.handle('setDislike', async (event, data) => {
    await client.tracks.dislikeTracks(accountData.uid, {"track-ids": nowPlaying}).then((data) => {
      mainWindow.webContents.send('showMessage', 'Дизлайк поставлен');
    })
  })

  // Выход из профиля
  ipcMain.handle('logout', async (event) => {
    fs.writeFile(tokenPath, '', (error) => {});
    await session.defaultSession.clearStorageData();
    app.relaunch();
    app.quit();
  })

  // Текущий плейлист
  ipcMain.handle('nowPlaylist', async (event, data) => {
    return nowPlaylist;
  })

  // Рекомендации по плейлисту
  ipcMain.handle('setPlaylistRecomendation', async (event, data) => {
    let tracks = [];

    mainWindow.webContents.send('setLoader');
    for (let i = 0; i < 25; i++) {
      await client.playlists.getRecommendations(data.uid, data.kind).then(async (data) => {
        data.result.tracks.forEach((element) => {
          tracks.push(element.id);
        });
      });
    }

    await client.tracks.getTracks({"track-ids": tracks}).then((data) => {
      mainWindow.webContents.send('setTracks', data.result);
      mainWindow.webContents.send('hideLoader');
    })

  })

})