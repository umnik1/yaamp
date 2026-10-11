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

// Доступная для контекстного меню область экрана в пикселях страницы.
function getContextMenuArea() {
  const win = remote.getCurrentWindow();
  const bounds = win.getBounds();
  const { workArea } = remote.screen.getDisplayMatching(bounds);
  const scale = zoom || 1;
  return {
    left: Math.max(0, (workArea.x - bounds.x) / scale),
    top: Math.max(0, (workArea.y - bounds.y) / scale),
    right: (workArea.x + workArea.width - bounds.x) / scale,
    bottom: (workArea.y + workArea.height - bounds.y) / scale,
  };
}

window.getContextMenuArea = getContextMenuArea;

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

    const area = getContextMenuArea();
    contextMenu.querySelectorAll(".context-menu li.parent").forEach((parentEl) => {
      const submenu = parentEl.querySelector(":scope > ul");
      if (!(submenu instanceof HTMLElement)) return;

      const parentRect = parentEl.getBoundingClientRect();
      let submenuRect = submenu.getBoundingClientRect();
      if (submenuRect.width <= 0 || submenuRect.height <= 0) return;

      // Влево — только если справа не помещается, а слева помещается.
      const fitsRight = parentRect.right + submenuRect.width <= area.right + 1;
      const fitsLeft = parentRect.left - submenuRect.width >= area.left;
      parentEl.classList.toggle("submenu-left", !fitsRight && fitsLeft);

      // Сдвиг вверх, чтобы подменю не уходило за нижний край экрана.
      if (submenu.dataset.naturalTop === undefined) {
        submenu.style.top = "";
        submenuRect = submenu.getBoundingClientRect();
        submenu.dataset.naturalTop = String(submenuRect.top - parentRect.top);
      }
      const naturalTop = Number(submenu.dataset.naturalTop);
      const top = Math.max(
        area.top - parentRect.top,
        Math.min(naturalTop, area.bottom - submenuRect.height - parentRect.top)
      );
      submenu.style.top = `${top}px`;

      submenuRect = submenu.getBoundingClientRect();
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