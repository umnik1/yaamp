const { remote } = require('electron')
const { ipcRenderer } = window.require('electron');

// const handleTransparency = require('./transparency.js')
const handleThumbnail = require('./thumbnail.js')
const handleThumbar = require('./thumbar.js')

let windowLock = true;
let zoom = 1;
let fullscreen = false;

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
    // window.centerWindowsInView();
  }, 100)

});

ipcRenderer.on('lockWindow', (event, store) => {
  windowLock = true;
  document.getElementById('title-bar').style.webkitAppRegion = 'drag';
});

ipcRenderer.on('lockWindowWithoutSave', (event, store) => {
  windowLock = true;
  window.centerWindowsInView();
  document.getElementById('title-bar').style.webkitAppRegion = 'drag';
});

ipcRenderer.on('setFullscreen', (event, status) => {
  fullscreen = status;
});

setInterval(() => {
  if (windowLock) {
    zoom = zoom ? zoom : 1;
    const windows = [];

    // Helper function to collect window data
    const addWindowData = (containerId, windowId) => {
      const containerEl = document.getElementById(containerId);
      const windowEl = document.getElementById(windowId);
      if (containerEl && windowEl) {
        const rect = windowEl.getBoundingClientRect();
        const translate = getTranslateXY(containerEl);
        windows.push({
          x: translate.translateX,
          y: translate.translateY,
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Collect data for all windows
    addWindowData('main', 'main-window');
    addWindowData('playlist', 'playlist-window');
    addWindowData('equalizer', 'equalizer-window');
    addWindowData('milkdrop', 'gen-window');

    if (windows.length === 0) return;

    // Calculate min and max extents
    let minX = Math.min(...windows.map(win => win.x));
    let maxRight = Math.max(...windows.map(win => win.x + win.width));
    let minY = Math.min(...windows.map(win => win.y));
    let maxBottom = Math.max(...windows.map(win => win.y + win.height));

    let totalWidth = maxRight - minX;
    let totalHeight = maxBottom - minY;

    // Add additional padding if needed (e.g., 12px for height as in original code)
    totalHeight += 12;

    // Check for context menu
    const contextMenu = document.getElementById('webamp-context-menu');
    if (contextMenu) {
      totalWidth += contextMenu.scrollWidth;
      const menuDiv = contextMenu.querySelector('div');
      if (menuDiv) totalHeight += menuDiv.scrollHeight;
    }



    // Apply zoom
    if (zoom) {
      totalWidth = Math.round(totalWidth * zoom);
      totalHeight = Math.round(totalHeight * zoom);
    }


    if (totalWidth && totalHeight && !fullscreen) {
      remote.getCurrentWindow().setBounds({
        width: totalWidth,
        height: totalHeight
      });
    }

  }
}, 100); // Adjust interval as needed