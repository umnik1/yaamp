const { remote, webFrame } = require('electron')
const { ipcRenderer } = window.require('electron');

// const handleTransparency = require('./transparency.js')
const handleThumbnail = require('./thumbnail.js')
const handleThumbar = require('./thumbar.js')

let windowLock = true;
let fullscreen = false;
// Последний размер, выставленный окну; сбрасывается, когда размер окна
// меняется в обход updateElectronWindowBounds.
let lastBounds = null;

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
  lastBounds = null;
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
  lastBounds = null;
});

// Текущий масштаб страницы. Main-процесс выставляет его в ready-to-show,
// поэтому читаем его каждый раз, а не берём из настроек один раз при старте.
function getZoom() {
  return webFrame.getZoomFactor() || 1;
}

// Доступная для контекстного меню область экрана в пикселях страницы.
function getContextMenuArea() {
  const win = remote.getCurrentWindow();
  const bounds = win.getBounds();
  const { workArea } = remote.screen.getDisplayMatching(bounds);
  const scale = getZoom();
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

  const zoom = getZoom();
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
  addWindowData('history', 'history-window');

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

  totalWidth = Math.round(totalWidth * zoom);
  totalHeight = Math.round(totalHeight * zoom);

  if (!totalWidth || !totalHeight) return;

  // Пока окно было меньше содержимого (например, до применения масштаба),
  // браузер мог прокрутить страницу; при overflow: hidden сама она не вернётся.
  const scroller = document.scrollingElement;
  if (scroller && (scroller.scrollTop || scroller.scrollLeft)) {
    scroller.scrollTop = 0;
    scroller.scrollLeft = 0;
  }

  if (lastBounds && lastBounds.width === totalWidth && lastBounds.height === totalHeight) {
    return;
  }

  remote.getCurrentWindow().setBounds({
    width: totalWidth,
    height: totalHeight,
  });
  lastBounds = { width: totalWidth, height: totalHeight };
}

window.updateElectronWindowBounds = updateElectronWindowBounds;

// Пересчитываем размер окна при изменениях DOM (перемещение, открытие и
// изменение размера окон webamp, контекстное меню), не чаще раза за кадр.
let boundsUpdateScheduled = false;
// Пока зажата левая кнопка, окно может начать перетаскиваться или менять
// размер: main-процесс расширяет окно (movingWindowStarted), а сообщение
// unlockWindow приходит позже. Пересчёт в этот момент сжал бы окно обратно,
// поэтому откладываем его до отпускания кнопки.
let mouseButtonDown = false;

function scheduleBoundsUpdate() {
  if (boundsUpdateScheduled) return;
  boundsUpdateScheduled = true;
  requestAnimationFrame(() => {
    boundsUpdateScheduled = false;
    if (windowLock && !mouseButtonDown) {
      updateElectronWindowBounds();
    }
  });
}

window.addEventListener('mousedown', (e) => {
  if (e.button === 0) mouseButtonDown = true;
}, true);

function releaseMouseButton() {
  if (!mouseButtonDown) return;
  mouseButtonDown = false;
  scheduleBoundsUpdate();
}

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) releaseMouseButton();
}, true);

// mouseup не приходит, если кнопку отпустили за пределами окна.
window.addEventListener('mousemove', (e) => {
  if ((e.buttons & 1) === 0) releaseMouseButton();
}, true);
window.addEventListener('blur', releaseMouseButton);

// Срабатывает и при смене масштаба страницы.
window.addEventListener('resize', scheduleBoundsUpdate);
window.addEventListener('scroll', scheduleBoundsUpdate);

window.addEventListener('DOMContentLoaded', () => {
  new MutationObserver(scheduleBoundsUpdate).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['style', 'class'],
  });
});

// Страховка на случай изменений, которые не видны через DOM.
setInterval(scheduleBoundsUpdate, 1000);