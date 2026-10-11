const fs = require('fs');
const { ipcMain, session, nativeImage, shell, app } = require('electron');
const mainWindow = require('../main-window');
const playbackState = require('../playback-state');
const userData = require('../user-data');
const { createApiServer, stopApiServer } = require('../api-server');
const { play, trackinfo } = require('../touch-bar');

function sendToRenderer(channel, ...args) {
  mainWindow.get()?.webContents.send(channel, ...args);
}

function registerAppHandlers() {
  let locked = false;

  ipcMain.handle('openLink', async (event, data) => {
    shell.openExternal(data.link);
    return true;
  });

  ipcMain.handle('openPlayNow', async () => {
    shell.openExternal(`https://music.yandex.ru/track/${playbackState.nowPlaying}`);
    return true;
  });

  ipcMain.handle('setSkin', async (event, data) => {
    fs.writeFile(userData.skinPath, data.link, () => {});
    return true;
  });

  ipcMain.handle('deleteSkin', async () => {
    fs.writeFile(userData.skinPath, '', () => {});
    return true;
  });

  ipcMain.handle('getSkin', async () => {
    await userData.getSkinFromFile();
    return userData.skinData;
  });

  ipcMain.handle('logout', async () => {
    fs.writeFile(userData.tokenPath, '', () => {});
    await session.defaultSession.clearStorageData();
    app.relaunch();
    app.quit();
  });

  ipcMain.handle('movingWindowStarted', async () => {
    const win = mainWindow.get();
    if (!locked && win) {
      const { width, height } = win.getBounds();
      sendToRenderer('unlockWindow');
      win.setBounds({ width: width + 500, height: height + 500 });
      locked = true;
    }
  });

  // Сдвигает окно на dx/dy (в CSS-пикселях страницы).
  ipcMain.handle('moveWindowBy', async (event, data) => {
    const win = mainWindow.get();
    if (!win) return;

    const zoom = userData.settingsData.zoom || 1;
    const [x, y] = win.getPosition();
    win.setPosition(Math.round(x + data.dx * zoom), Math.round(y + data.dy * zoom));
  });

  ipcMain.handle('saveWindowState', async (event, data) => {
    const { settingsData } = userData;
    const windowKeys = {
      main: 'mainWindow',
      playlist: 'playlistWindow',
      equalizer: 'equalizerWindow',
      milkdrop: 'milkdropWindow',
      nowplaying: 'nowPlayingWindow',
    };

    const settingsKey = windowKeys[data.windowId];
    if (!settingsKey) {
      return false;
    }

    if (!settingsData.windows[settingsKey]) {
      settingsData.windows[settingsKey] = { x: 0, y: 0, visible: true };
    }

    const entry = settingsData.windows[settingsKey];
    if (data.visible !== undefined) entry.visible = data.visible;
    if (data.x !== undefined) entry.x = data.x;
    if (data.y !== undefined) entry.y = data.y;
    if (data.size !== undefined) entry.size = data.size;

    userData.saveSettings();
    return true;
  });

  ipcMain.handle('movingWindowEnded', async (event, data) => {
    if (data) {
      const { windows } = data;
      const { settingsData } = userData;

      windows.forEach((window) => {
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
        } else if (window.key == 'nowplaying') {
          if (!settingsData.windows.nowPlayingWindow) {
            settingsData.windows.nowPlayingWindow = { x: 275, y: 128, size: [4, 6], visible: false };
          }
          settingsData.windows.nowPlayingWindow.x = window.x;
          settingsData.windows.nowPlayingWindow.y = window.y;
        }
      });

      userData.saveSettings((error) => {
        if (error) {
          console.error('Error writing to settings file:', error);
        }
        sendToRenderer('lockWindow');
      });
    } else {
      sendToRenderer('lockWindow');
    }

    locked = false;
  });

  ipcMain.handle('movingWindowEndedWithoutSave', async () => {
    sendToRenderer('lockWindowWithoutSave');
    locked = false;
  });

  ipcMain.handle('setRatio', async (event, data) => {
    userData.settingsData.zoom = data.value;
    userData.saveSettings();

    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 3000);
  });

  ipcMain.handle('getSettings', async () => {
    const { settingsData } = userData;

    if (!settingsData.windows.milkdropWindow) {
      settingsData.windows.milkdropWindow = {
        x: 275,
        y: 12,
        size: [7, 8],
        visible: true,
      };
    }

    if (!settingsData.windows.nowPlayingWindow) {
      settingsData.windows.nowPlayingWindow = {
        x: 275,
        y: 128,
        size: [4, 6],
        visible: false,
      };
    }

    if (!settingsData.api) {
      settingsData.api = { enabled: false, port: 8080 };
    }

    return JSON.stringify(settingsData);
  });

  ipcMain.handle('setApiSettings', async (event, data) => {
    const { settingsData } = userData;

    if (!settingsData.api) {
      settingsData.api = { enabled: false, port: 8080 };
    }

    const wasEnabled = settingsData.api.enabled;

    if (data.enabled !== undefined) {
      settingsData.api.enabled = data.enabled;
    }
    if (data.port !== undefined) {
      settingsData.api.port = parseInt(data.port) || 8080;
    }

    userData.saveSettings((error) => {
      if (error) {
        console.error('Error writing to settings file:', error);
      }
    });

    const win = mainWindow.get();
    if (win && !win.isDestroyed()) {
      stopApiServer();
      if (settingsData.api.enabled) {
        createApiServer(settingsData.api.port || 8080, win);
      } else if (wasEnabled) {
        sendToRenderer('showMessage', 'API сервер остановлен');
      }
    }

    return true;
  });

  ipcMain.handle('setSize', async (event, data) => {
    const { settingsData } = userData;

    if (data.id == 'playlist-resize-target') {
      settingsData.windows.playlistWindow.size = data.size;
    } else if (data.id == 'gen-resize-target') {
      settingsData.windows.milkdropWindow.size = data.size;
    } else if (data.id == 'now-playing-resize-target') {
      if (!settingsData.windows.nowPlayingWindow) {
        settingsData.windows.nowPlayingWindow = { x: 275, y: 128, size: [4, 6], visible: false };
      }
      settingsData.windows.nowPlayingWindow.size = data.size;
    }

    userData.saveSettings((error) => {
      console.log(error);
    });
  });

  ipcMain.handle('setEQ', async (event, data) => {
    fs.writeFile(userData.eqPath, data.link, () => {});
    console.log(data.link);
    sendToRenderer('showMessage', 'EQ сохранён');
    return true;
  });

  ipcMain.handle('getEq', async () => {
    await userData.getEQFromFile();
    return userData.eqData;
  });

  ipcMain.handle('resetSettings', async () => {
    fs.writeFile(userData.settingsPath, JSON.stringify(userData.resetSettings), (error) => {
      console.log(error);
    });
    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 3000);
  });

  ipcMain.handle('toggle-milkdrop-fullscreen', async (event, status) => {
    const win = mainWindow.get();
    if (!win) return;

    if (status) {
      mainWindow.setCurrentBounds(win.getBounds());
      win.maximize();
      sendToRenderer('setFullscreen', status);
    } else {
      sendToRenderer('setFullscreen', status);
      win.restore();
      win.setBounds(mainWindow.getCurrentBounds());
    }
  });

  ipcMain.handle('isPlay', async (event, data) => {
    if (data) {
      play.icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAQ9JREFUOE/FlbESwUAQhnfzLswo6YxOoTBDyzsoeQQlHaWSjoKhVJ4uoRGqoFFKR3dmw0oGiRM345rM3F2+/78/uxccToUEzcN2HBh0e4AEzxez2vDz2QL6oyFshOXDTcv+WcA9ukCuhRBwWG3+BG+3ut5J6o2a8onIuWmZYK1t2C0jnBO8VC7DZDxWFgnCI2NhONtWEfna+XMmUSKxnauIaINXKwVPL1jCQfh+tQ0vxefM2fk7KK/Fdh4FfQ9XcK4C/RqeSadeMv3UTaGZ04WjY3CHPj4oQenCObsnHXyv/Q9ULc1OX5La5XzRAmaI5zyZyEkABDTQhyMC8i8Eb/PIT+B9/n7j/q6ktfs0SgOutQw52vzOQLoAAAAASUVORK5CYII=');
    } else {
      play.icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAASCAYAAACw50UTAAAAAXNSR0IArs4c6QAAAPZJREFUOE9jXLv12H8GKoPr9+8zrJmzjIERZLiTlyXVjN+37TjD0nVrGe6duYkw/Nz56xRb8OH5BwaQq48dO8bw/PqjATC8t2cqii+KS7LhfHxyIJefO3+O4fy16wzPrj7E7nKQAb5+fmADI8LdGJCDDJ8csuE4g2VkGz4a5vBkSr/UcgNHDjUy1ETJRMjpHJ8cTpeDChxqAFgOfX79MSSHggwFFTjfP7ynhvng7A/OoS1Tlv4H2fbj+w+qGAwz5AXI5To6rv8ZGBgZGBkZEYYzMjIwwqoQEJuRkeH///9gGgRh4D8jAwMjiGBgYGBkQoiD1IC0AwDEdnVTCfcsTgAAAABJRU5ErkJggg==');
    }
  });

  ipcMain.handle('nowPlaying', async (event, data) => {
    trackinfo.label = data;
  });

  ipcMain.handle('setVolume', async (event, volume) => {
    const win = mainWindow.get();
    if (win && !win.isDestroyed()) {
      sendToRenderer('setVolume', volume);
    }
    return true;
  });

  ipcMain.handle('getVolume', async () => 50);
}

module.exports = { registerAppHandlers };
