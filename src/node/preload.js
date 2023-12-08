const { remote } = require('electron')
const { ipcRenderer } = window.require('electron');

// const handleTransparency = require('./transparency.js')
const handleThumbnail = require('./thumbnail.js')
const handleThumbar = require('./thumbar.js')

let windowLock = true;
let zoom = 1;

// We want to completely disable the eval() for security reasons
// ESLint will warn about any use of eval(), even this one
// eslint-disable-next-line
window.eval = global.eval = function () {
    throw new Error(`Sorry, this app does not support window.eval().`)
}

// Add require for e2e spectron tests
if (process.env.NODE_ENV === 'test') {
    window.spectronRequire = require
}

/**
 * Electron API wrappers passed to the renderer
 *
 * Only implementation of the selected APIs is available
 * to greatly reduce the attack surface
 * See https://github.com/electron/electron/blob/master/docs/tutorial/security.md#2-disable-nodejs-integration-for-remote-content
 */

window.minimizeElectronWindow = function () {
    return remote.getCurrentWindow().minimize()
}

window.closeElectronWindow = function () {
    return remote.getCurrentWindow().close()
}

window.webampRendered = function () {
    // handleTransparency()
    handleThumbnail()
    var ms = navigator.mediaSession;
    ms.setActionHandler('nexttrack', window.webampNext);
    ms.setActionHandler('previoustrack', window.webampPrevious);
    handleThumbar(
        'stopped',
        window.webampPlay,
        window.webampPause,
        window.webampPrevious,
        window.webampNext,
    )

    ipcRenderer.invoke('getSettings').then((rs) => {
      const settingsData = JSON.parse(rs);
      zoom = settingsData.zoom;
    })

}

window.webampOnTrackDidChange = function(track) {
    let state

    if (!track) {
        state = 'paused'
    } else if (track) {
        state = 'playing'
    }

    var ms = navigator.mediaSession;
    ms.setActionHandler('nexttrack', window.webampNext);
    ms.setActionHandler('previoustrack', window.webampPrevious);

    handleThumbar(
        state,
        window.webampPlay,
        window.webampPause,
        window.webampPrevious,
        window.webampNext,
    )
}

function getTranslateXY(element) {
  const style = window.getComputedStyle(element)
  const matrix = new DOMMatrixReadOnly(style.transform)
  return {
      translateX: matrix.m41,
      translateY: matrix.m42
  }
}

ipcRenderer.on('unlockWindow', (event, store) => {
  windowLock = false;
  document.getElementById('title-bar').style.webkitAppRegion = 'no-drag';
  setTimeout(() => {
    window.centerWindowsInView();
  }, 100)

});

ipcRenderer.on('lockWindow', (event, store) => {
  windowLock = true;
  document.getElementById('title-bar').style.webkitAppRegion = 'drag';

  const posData = {
    mainWindow: {
      x: 0,
      y: 0,
      visible: true,
    },
    playlistWindow: {
      x: 0,
      y: 0,
      size: [0, 0],
      visible: true,
    },
    equalizerWindow: {
      x: 0,
      y: 0,
      visible: true,
    },
  }

  if (document.querySelector('#main')) {
    posData.mainWindow.x = getTranslateXY(document.getElementById('main')).translateX;
    posData.mainWindow.y = getTranslateXY(document.getElementById('main')).translateY;
  } else {
    posData.mainWindow.visible = false;
  }

  if (document.querySelector('#playlist')) {
    posData.playlistWindow.x = getTranslateXY(document.getElementById('playlist')).translateX;
    posData.playlistWindow.y = getTranslateXY(document.getElementById('playlist')).translateY;
  } else {
    posData.playlistWindow.visible = false;
  }

  if (document.querySelector('#equalizer')) {
    posData.equalizerWindow.x = getTranslateXY(document.getElementById('equalizer')).translateX;
    posData.equalizerWindow.y = getTranslateXY(document.getElementById('equalizer')).translateY;
  } else {
    posData.equalizerWindow.visible = false;
  }

  ipcRenderer.send('setWinodwsPositions', JSON.stringify(posData));
});

ipcRenderer.on('lockWindowWithoutSave', (event, store) => {
  windowLock = true;
  window.centerWindowsInView();
  document.getElementById('title-bar').style.webkitAppRegion = 'drag';
});

setInterval(() => {
  if (windowLock) {
    let height = 12;
    zoom = zoom ? zoom : 1;

    height += document.getElementById('main-window').getBoundingClientRect().height;
    height += document.getElementById('playlist-window') ? document.getElementById('playlist-window').getBoundingClientRect().height : 0;
    height += document.getElementById('equalizer-window') ? document.getElementById('equalizer-window').getBoundingClientRect().height : 0;

    let width = document.getElementById('playlist-window') ? (document.getElementById('playlist-window').getBoundingClientRect().width) : 400;
    const mainXY = document.getElementById('main') ? getTranslateXY(document.getElementById('main')) : {translateX: 0, translateY: 0};
    const playlistXY = document.getElementById('playlist') ? getTranslateXY(document.getElementById('playlist')) : {translateX: 0, translateY: 0};
    const equalizerXY = document.getElementById('equalizer') ? getTranslateXY(document.getElementById('equalizer')) : {translateX: 0, translateY: 0};
    
    if (mainXY.translateX !== playlistXY.translateX ) {
      width = (document.getElementById('playlist-window') ? document.getElementById('playlist-window').getBoundingClientRect().width : 0) + (document.getElementById('main-window') ? document.getElementById('main-window').getBoundingClientRect().width : 0);
    }

    if (mainXY.translateX !== equalizerXY.translateX ) {
      width = (document.getElementById('equalizer-window') ? document.getElementById('equalizer-window').getBoundingClientRect().width : 0) + (document.getElementById('main-window') ? document.getElementById('main-window').getBoundingClientRect().width : 0);
    }

    if (mainXY.translateX !== equalizerXY.translateX && mainXY.translateX !== playlistXY.translateX ) {
      width = (document.getElementById('equalizer-window') ? document.getElementById('equalizer-window').getBoundingClientRect().width : 0) + 
      (document.getElementById('main-window') ? document.getElementById('main-window').getBoundingClientRect().width : 0) +
      (document.getElementById('playlist-window') ? document.getElementById('playlist-window').getBoundingClientRect().width : 0);
    }
    
    if (mainXY.translateY !== playlistXY.translateY ) {
      height = (document.getElementById('playlist-window') ? document.getElementById('playlist-window').getBoundingClientRect().height : 0) + (document.getElementById('main-window') ? document.getElementById('main-window').getBoundingClientRect().height : 0);
    }

    if (mainXY.translateY !== equalizerXY.translateY ) {
      height = (document.getElementById('equalizer-window') ? document.getElementById('equalizer-window').getBoundingClientRect().height : 0) + (document.getElementById('main-window') ? document.getElementById('main-window').getBoundingClientRect().height : 0);
    }

    if (mainXY.translateY !== equalizerXY.translateY && mainXY.translateY !== playlistXY.translateY ) {
      height = (document.getElementById('equalizer-window') ? document.getElementById('equalizer-window').getBoundingClientRect().height : 0) + 
      (document.getElementById('main-window') ? document.getElementById('main-window').getBoundingClientRect().height : 0) +
      (document.getElementById('playlist-window') ? document.getElementById('playlist-window').getBoundingClientRect().height : 0);
    }

    if (mainXY.translateY == equalizerXY.translateY && mainXY.translateY == playlistXY.translateY ) {
      height = document.getElementById('main-window').getBoundingClientRect().height
    }

    if (document.getElementById('webamp-context-menu')) {
        width += document.getElementById('webamp-context-menu').scrollWidth;
        height += document.querySelector('#webamp-context-menu div').scrollHeight;
    }

    width = Math.round(width * zoom);
    height = Math.round(height * zoom);

    remote.getCurrentWindow().setBounds({
        width: width,
        height: height
    });
  }
}, 100)