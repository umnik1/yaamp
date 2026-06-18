const path = require('path');
const url = require('url');
const fs = require('fs');
const electron = require('electron');

const checkForUpdatesAndNotify = require('./src/node/updates.js');
const interceptStreamProtocol = require('./src/node/protocol.js');
const { createApiServer, stopApiServer } = require('./src/node/api-server.js');
const userData = require('./src/node/user-data');
const mainWindowRef = require('./src/node/main-window');
const { touchBar } = require('./src/node/touch-bar');
const { registerIpcHandlers } = require('./src/node/ipc');

const { app, BrowserWindow } = electron;

const URL_WITH_ACCESS_TOKEN_REGEX = 'https:\\/\\/music\\.yandex\\.(?:ru|com|by|kz|ua)\\/#access_token=([^&]*)';

// раскомментировать для отображения дебаг панели
// require('electron-debug')({ showDevTools: true, devToolsMode: 'undocked' })

function registerProtocol() {
  electron.protocol.interceptStreamProtocol(
    'file',
    interceptStreamProtocol(),
    (error) => {
      if (error) {
        console.error('Failed to register protocol');
      }
    },
  );
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
}

function createWindow() {
  registerProtocol();

  userData.getSettingsFromFile().then(() => {
    const win = new BrowserWindow({
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
      },
    });

    mainWindowRef.set(win);

    win.loadURL(url.format({
      pathname: './dist/index.html',
      protocol: 'file:',
      slashes: true,
    }));
    win.setTouchBar(touchBar);

    win.once('ready-to-show', () => {
      win.webContents.setZoomFactor(userData.settingsData.zoom ? userData.settingsData.zoom : 1);
      win.show();
      checkForUpdatesAndNotify();

      if (userData.settingsData.api && userData.settingsData.api.enabled) {
        createApiServer(userData.settingsData.api.port || 8080, win);
      }
    });

    win.on('closed', () => {
      stopApiServer();
      mainWindowRef.set(null);
    });
  });
}

function createLogin() {
  registerProtocol();

  const win = new BrowserWindow({
    width: 350,
    height: 450,
    frame: false,
    hasShadow: false,
    resizable: false,
    icon: path.join(__dirname, 'res/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'src/node/preload.js'),
    },
  });

  mainWindowRef.set(win);
  win.loadURL('http://yaamp.ru/login.html');

  win.on('closed', () => {
    mainWindowRef.set(null);
  });
}

function registerWebContentsHandlers(isAuthenticated) {
  if (isAuthenticated) {
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (event) => {
        event.preventDefault();
      });
      contents.on('new-window', (event, navigationUrl) => {
        const parsedUrl = url.parse(navigationUrl);
        if (parsedUrl.protocol === 'file:' || parsedUrl.protocol === 'chrome-devtools:') {
          return;
        }
        event.preventDefault();
        electron.shell.openExternal(navigationUrl);
      });
    });
  } else {
    app.on('web-contents-created', (event, contents) => {
      contents.on('will-navigate', (event, navigationUrl) => {
        const match = navigationUrl.match(URL_WITH_ACCESS_TOKEN_REGEX);
        if (match) {
          fs.writeFile(userData.tokenPath, match[1], (error) => {
            if (!error) {
              app.relaunch();
              app.quit();
            }
          });
        }
      });
    });
  }
}

function startApp() {
  userData.getTokenFromFile().then(() => {
    const isAuthenticated = !!userData.yaAuthToken;
    registerWebContentsHandlers(isAuthenticated);

    if (isAuthenticated) {
      registerIpcHandlers();
    }

    const launch = isAuthenticated ? createWindow : createLogin;
    if (process.platform === 'linux') {
      setTimeout(launch, 100);
    } else {
      launch();
    }
  });
}

if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

app.on('ready', startApp);

app.on('window-all-closed', () => {
  stopApiServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindowRef.get() === null) {
    createWindow();
  } else if (
    userData.settingsData.api &&
    userData.settingsData.api.enabled &&
    mainWindowRef.get() &&
    !mainWindowRef.get().isDestroyed()
  ) {
    createApiServer(userData.settingsData.api.port || 8080, mainWindowRef.get());
  }
});
