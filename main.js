// TODO: Нужно сделать рефакторинг всего кода, но мне лень с:

const path = require('path');
const url = require('url');
const { ipcMain, webContents, session, remote, screen, TouchBar, nativeImage } = require('electron');
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar;
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

// раскомментировать для отображения дебаг панели
//require('electron-debug')({ showDevTools:true, devToolsMode: 'undocked' })

const tokenPath = app.getPath("userData") + '/token.json';
const skinPath = app.getPath("userData") + '/skin.json';
const eqPath = app.getPath("userData") + '/eq.json';
const settingsPath = app.getPath("userData") + '/settings.json';
const URL_WITH_ACCESS_TOKEN_REGEX = 'https:\\/\\/music\\.yandex\\.(?:ru|com|by|kz|ua)\\/#access_token=([^&]*)';

let nowPlaying = 0;
let nowPlaylist = [];

let yaAuthToken = '';
let skinData = '';
let eqData = '';
let settingsData = {
  windows: {
    mainWindow: {
      x: 0,
      y: 12,
      visible: true,
    },
    playlistWindow: {
      x: 0,
      y: 244,
      size: [0, 0],
      visible: true,
    },
    equalizerWindow: {
      x: 0,
      y: 128,
      visible: true,
    },
    milkdropWindow: {
      x: 275,
      y: 12,
      size: [7,8],
      visible: true,
    }
  },
  zoom: 1
};

let resetSettings = settingsData;
let currentBounds;

// Discord
const sessionId = crypto.randomBytes(20).toString('hex');
const clientId = '1161295534770892860';

DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });

rpc.login({ clientId }).catch(console.error);

// Mac Touchbar
let prev = new TouchBarButton({
  backgroundColor: '#000000',
  icon: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAASZJREFUOE9jXLv12H8GKoPr9+8zzJ8wmYERZLiTlyXVjN+37TjD0nVrGS4dOIow/Nz56xRb8OH5BwaQq48dO8Zw69S5ATK8t2cq3CfFJdkYvoLJI8uBXH7u/DmG89euM9w6eRa3y0Gaff38GCLC3RjQgwyXHIrh+IIFlwEwcZBX0C2myHBkgwkZfvv0eeKDBd1gQobjTS3owWJkqMmwYuUulIjFFywkuRxkKroFVDUc3QKqG45sAdmGg4IABrAVDTB5ZDnkpIgS5qAChxoAlkPhhoMMBRU43z+8p4b54Ox/5/QFBsaWKUv/g2z78f0HVQyGGXL7zAUGRnl5w/+MDIwIgxkhbCZGBob/DFAZRkYGRqg4SA4k+h8k9h9UzzAyMCDLwdQCpQBA03BAzydq3wAAAABJRU5ErkJggg=='),
  iconPosition: 'overlay',
  click: () => {
    mainWindow.webContents.send('prevTrack');
  }
})

let play = new TouchBarButton({
  backgroundColor: '#000000',
  icon: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAQ9JREFUOE/FlbESwUAQhnfzLswo6YxOoTBDyzsoeQQlHaWSjoKhVJ4uoRGqoFFKR3dmw0oGiRM345rM3F2+/78/uxccToUEzcN2HBh0e4AEzxez2vDz2QL6oyFshOXDTcv+WcA9ukCuhRBwWG3+BG+3ut5J6o2a8onIuWmZYK1t2C0jnBO8VC7DZDxWFgnCI2NhONtWEfna+XMmUSKxnauIaINXKwVPL1jCQfh+tQ0vxefM2fk7KK/Fdh4FfQ9XcK4C/RqeSadeMv3UTaGZ04WjY3CHPj4oQenCObsnHXyv/Q9ULc1OX5La5XzRAmaI5zyZyEkABDTQhyMC8i8Eb/PIT+B9/n7j/q6ktfs0SgOutQw52vzOQLoAAAAASUVORK5CYII='),
  iconPosition: 'overlay',
  click: () => {
    mainWindow.webContents.send('playPause');
  }
})

let next = new TouchBarButton({
  backgroundColor: '#000000',
  icon: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAPtJREFUOE9jXLv12H8GKoPr9+8zaCoqMjCCDHfysqSa8fu2HWdYum4tQ3RQMMLwc+evU2zBh+cfGECuPnbsGENydPQAGd7bMxXsk+KSbAwfweTQ5UEuP3f+HMP5a9fxuxxkgK+fH8PmTZswLIDJRYS7MSAHJ8mGg1yHbgFVDUe3gOqGI1tAE8NhYUx1w5Ejj6qGo6cKqhmObjAo7Ck23MhQE5x5sBULMDl0eZzpHFTgUANg5FCQoaAC5/uH99QwH5z93917z8DYMmXpf5BtP77/oIrBMEP2rVvKwGhmFgquLBgZmRj+///PwMjIiNUSRgbs4gw41F+4sJ0BABVaXHLFWpERAAAAAElFTkSuQmCC'),
  iconPosition: 'overlay',
  click: () => {
    mainWindow.webContents.send('nextTrack');
  }
})

let trackinfo = new TouchBarButton({
  backgroundColor: '#000000',
  textColor: '#01E804',
  label: '',
  click: () => {
    mainWindow.webContents.send('nextTrack');
  }
})

const touchBar = new TouchBar({
  items: [
    prev,
    play,
    next,
    new TouchBarSpacer({ size: 'small' }),
    trackinfo
  ]
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

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

  app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
  // For Linux: Remove "resizable"

  // Create the browser window.
  getSettingsFromFile().then( () => {

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
    mainWindow.setTouchBar(touchBar)

    // and show window once it's ready (to prevent flashing)
    mainWindow.once('ready-to-show', () => {
      mainWindow.webContents.setZoomFactor(settingsData.zoom ? settingsData.zoom : 1)
      mainWindow.show()
      checkForUpdatesAndNotify()
    })

    mainWindow.on('closed', function () {
      // Dereference the window object
      mainWindow = null
    })

  });

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

const getEQFromFile = async()=>{
  try {
    const result = await readFile(eqPath,'binary')
    eqData = result;
  } catch (error) {
    fs.writeFile(eqPath, '', (error) => {});  }
}


const getSettingsFromFile = async()=>{
  try {
    const result = await readFile(settingsPath, 'binary')
    settingsData = JSON.parse(result);
  } catch (error) {
    fs.writeFile(settingsPath, JSON.stringify(settingsData), (error) => {});  }
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

    if (!trackid.includes('blob')) {
      nowPlaying = trackid;

      const data = await getTrackUrl(client, trackid).then((data) => {
          return data;
      })
  
      await client.tracks.playAudio({"track-id": trackid, "from": 'web-main-rup-radio-main', "timestamp": new Date().toISOString(), 'uid': accountData.uid, 'play-id': sessionId}).then((data) => {
        return data;
      })
  
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
                  label: 'Listen to this track',
                  url: `https://music.yandex.ru/track/${element.id}`,
                },
              ],
            };
          
            rpc.setActivity(presObj);
  
            return data;
          })
        }
        
      return data;
    } else {

      return trackid;
    }

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


  let locked = false;

  // Разблокировка окна для перетаскивания окон
  ipcMain.handle('movingWindowStarted', async (event, data) => {
    if (!locked) {
      const { width, height } = mainWindow.getBounds();
      const newWidth = width + 500;
      const newHeight = height + 500;

      mainWindow.webContents.send('unlockWindow');

      mainWindow.setBounds({
        width: newWidth,
        height: newHeight
      })

      locked = true;
    }
  })
  
  // Блокировка окна для перетаскивания окон
  ipcMain.handle('movingWindowEnded', async (event, data) => {
  
    if (data) {
      const windows = data.windows;
  
      windows.forEach(window => {
        if (window.key == 'main') {
          settingsData.windows.mainWindow.x = window.x;
          settingsData.windows.mainWindow.y = window.y;
        } else if (window.key == 'playlist') {
          settingsData.windows.playlistWindow.x = window.x;
          settingsData.windows.playlistWindow.y = window.y;
        } else if (window.key == 'equalizer') {
          settingsData.windows.equalizerWindow.x = window.x;
          settingsData.windows.equalizerWindow.y = window.y;
        } else if (window.key == 'milkdrop') {
          settingsData.windows.milkdropWindow.x = window.x;
          settingsData.windows.milkdropWindow.y = window.y;
        }
  
      });
    
      fs.writeFile(settingsPath, JSON.stringify(settingsData), (error) => {
        if (error) {
          console.error('Error writing to settings file:', error);
        } else {
          mainWindow.webContents.send('lockWindow');
        }
      });
    }
  
    locked = false;
  })

  // Блокировка окна для перетаскивания окон без сохраения
  ipcMain.handle('movingWindowEndedWithoutSave', async (event) => {
    mainWindow.webContents.send('lockWindowWithoutSave');
    setTimeout(() => {

    mainWindow.center();
  }, 100)

  })

  // Увеличение окна
  ipcMain.handle('setRatio', async (event, data) => {
    settingsData.zoom = data.value;

    fs.writeFile(settingsPath, JSON.stringify(settingsData), (error) => {});

    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 3000)

  })

  // Получение настроек
  ipcMain.handle('getSettings', async (event) => {

    if (!settingsData.windows.milkdropWindow) {
      settingsData.windows.milkdropWindow = {
        x: 275,
        y: 12,
        size: [7,8],
        visible: true,
      };
    }
    
    return JSON.stringify(settingsData);
  })

  // Задать размер
  ipcMain.handle('setSize', async (event, data) => {

    if (data.id == 'playlist-resize-target') {
      settingsData.windows.playlistWindow.size = data.size;
    } else if (data.id == 'gen-resize-target') {
      settingsData.windows.milkdropWindow.size = data.size;
    }

    fs.writeFile(settingsPath, JSON.stringify(settingsData), (error) => {
      console.log(error);
    });
  })

  // Сохранение EQ
  ipcMain.handle('setEQ', async (event, data) => {
    fs.writeFile(eqPath, data.link, (error) => {});
    console.log(data.link);
    mainWindow.webContents.send('showMessage', 'EQ сохранён');
    return true;
  })

  // Получение EQ
  ipcMain.handle('getEq', async (event, data) => {
    eqData = await getEQFromFile().then( () => {
      return eqData;
    });

    return eqData;
  })

  // Сбросить настройки
  ipcMain.handle('resetSettings', async (event, data) => {
    fs.writeFile(settingsPath, JSON.stringify(resetSettings), (error) => {
      console.log(error);
    });
    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 3000)
  })

  // Milkdrop fullscreen
  ipcMain.handle('toggle-milkdrop-fullscreen', async (event, status) => {
    if (status) {
      currentBounds = mainWindow.getBounds();

      mainWindow.maximize();
      mainWindow.webContents.send('setFullscreen', status);

    } else {
      mainWindow.webContents.send('setFullscreen', status);
      mainWindow.restore();
      mainWindow.setBounds(currentBounds);
    }
  })

  ipcMain.handle('isPlay', async (event, data) => {
    if (data) {
      play.icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAQ9JREFUOE/FlbESwUAQhnfzLswo6YxOoTBDyzsoeQQlHaWSjoKhVJ4uoRGqoFFKR3dmw0oGiRM345rM3F2+/78/uxccToUEzcN2HBh0e4AEzxez2vDz2QL6oyFshOXDTcv+WcA9ukCuhRBwWG3+BG+3ut5J6o2a8onIuWmZYK1t2C0jnBO8VC7DZDxWFgnCI2NhONtWEfna+XMmUSKxnauIaINXKwVPL1jCQfh+tQ0vxefM2fk7KK/Fdh4FfQ9XcK4C/RqeSadeMv3UTaGZ04WjY3CHPj4oQenCObsnHXyv/Q9ULc1OX5La5XzRAmaI5zyZyEkABDTQhyMC8i8Eb/PIT+B9/n7j/q6ktfs0SgOutQw52vzOQLoAAAAASUVORK5CYII=');
    } else {
      play.icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAPZJREFUOE9jXLv12H8GKoPr9+8zrJmzjIERZLiTlyXVjN+37TjD0nVrGe6duYkw/Nz56xRb8OH5BwaQq48dO8bw/PqjATC8t2cqii+KS7LhfHxyIJefO3+O4fy16wzPrj7E7nKQAb5+fmADI8LdGJCDDJ8csuE4g2VkGz4a5vBkSr/UcgNHDjUy1ETJRMjpHJ8cTpeDChxqAFgOfX79MSSHggwFFTjfP7ynhvng7A/OoS1Tlv4H2fbj+w+qGAwz5AXI5To6rv8ZGBgZGBkZEYYzMjIwwqoQEJuRkeH///9gGgRh4D8jAwMjiGBgYGBkQoiD1IC0AwDEdnVTCfcsTgAAAABJRU5ErkJggg==');
    }
  })

  ipcMain.handle('nowPlaying', async (event, data) => {
    trackinfo.label = data;
  })


})