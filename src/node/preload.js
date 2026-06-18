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

function setTitleBarDragRegion(value) {
  const titleBar = document.getElementById('title-bar');
  if (titleBar) {
    titleBar.style.webkitAppRegion = value;
  }
}

ipcRenderer.on('unlockWindow', (event, store) => {
  windowLock = false;
  setTitleBarDragRegion('no-drag');
});

ipcRenderer.on('lockWindow', (event, store) => {
  windowLock = true;
  setTitleBarDragRegion('drag');
  updateElectronWindowBounds();
});

ipcRenderer.on('lockWindowWithoutSave', (event, store) => {
  windowLock = true;
  setTitleBarDragRegion('drag');
  updateElectronWindowBounds();
});

ipcRenderer.on('setFullscreen', (event, status) => {
  fullscreen = status;
});

function updateElectronWindowBounds() {
  if (fullscreen) return;

  zoom = zoom ? zoom : 1;
  const windows = [];

  const addWindowData = (containerId, windowId) => {
    const containerEl = document.getElementById(containerId);
    const windowEl = document.getElementById(windowId);
    if (containerEl && windowEl) {
      const rect = windowEl.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const translate = getTranslateXY(containerEl);
      windows.push({
        x: translate.translateX,
        y: translate.translateY,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  addWindowData('main', 'main-window');
  addWindowData('playlist', 'playlist-window');
  addWindowData('equalizer', 'equalizer-window');
  addWindowData('milkdrop', 'gen-window');
  addWindowData('nowplaying', 'now-playing-window');

  if (windows.length === 0) return;

  let maxRight = Math.max(...windows.map((win) => win.x + win.width));
  let minY = Math.min(...windows.map((win) => win.y));
  let maxBottom = Math.max(...windows.map((win) => win.y + win.height));

  const contextMenu = document.getElementById('webamp-context-menu');
  if (contextMenu) {
    const menuEl = contextMenu.querySelector('.context-menu');
    if (menuEl) {
      const menuRect = menuEl.getBoundingClientRect();
      if (menuRect.width > 0 && menuRect.height > 0) {
        maxRight = Math.max(maxRight, menuRect.right);
        maxBottom = Math.max(maxBottom, menuRect.bottom);
      }
    }

    const viewportWidth = document.documentElement.clientWidth;
    contextMenu.querySelectorAll(".context-menu li.parent").forEach((parentEl) => {
      const submenu = parentEl.querySelector(":scope > ul");
      if (!(submenu instanceof HTMLElement)) return;

      const parentRect = parentEl.getBoundingClientRect();
      const submenuRect = submenu.getBoundingClientRect();
      const submenuWidth =
        submenuRect.width > 0
          ? submenuRect.width
          : submenu.scrollWidth;

      if (submenuWidth > 0 && parentRect.right + submenuWidth > viewportWidth + 1) {
        parentEl.classList.add("submenu-left");
      } else {
        parentEl.classList.remove("submenu-left");
      }

      if (submenuRect.width > 0 && submenuRect.height > 0) {
        maxRight = Math.max(maxRight, submenuRect.right);
        maxBottom = Math.max(maxBottom, submenuRect.bottom);
      }
    });
  }

  let totalWidth = maxRight;
  let totalHeight = maxBottom - minY + 12;

  if (zoom) {
    totalWidth = Math.round(totalWidth * zoom);
    totalHeight = Math.round(totalHeight * zoom);
  }

  if (totalWidth && totalHeight) {
    remote.getCurrentWindow().setBounds({
      width: totalWidth,
      height: totalHeight,
    });
  }
}

window.updateElectronWindowBounds = updateElectronWindowBounds;

setInterval(() => {
  if (windowLock) {
    updateElectronWindowBounds();
  }
}, 100);