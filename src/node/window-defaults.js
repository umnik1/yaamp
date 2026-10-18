// Настройки окон по умолчанию. Единственный источник — window-defaults.json,
// который также используется в renderer (src/yaamp-layout.ts).
const WINDOW_DEFAULTS = require('./window-defaults.json');

// Значения по умолчанию в формате settings.json: { x, y, size?, visible }.
function defaultWindowSettings(windowId) {
  const { x, y, size, visible } = WINDOW_DEFAULTS[windowId];
  return size ? { x, y, size: [...size], visible } : { x, y, visible };
}

function defaultWindowsSettings() {
  return Object.fromEntries(
    Object.entries(WINDOW_DEFAULTS).map(([windowId, win]) => [
      win.settingsKey,
      defaultWindowSettings(windowId),
    ])
  );
}

function settingsKeyFor(windowId) {
  return WINDOW_DEFAULTS[windowId]?.settingsKey;
}

function windowIdForResizeTarget(resizeId) {
  return Object.keys(WINDOW_DEFAULTS).find(
    (windowId) => WINDOW_DEFAULTS[windowId].resizeId === resizeId
  );
}

// Возвращает запись окна из настроек, создавая её со значениями по умолчанию.
function ensureWindowSettings(windows, windowId) {
  const settingsKey = settingsKeyFor(windowId);
  if (!windows[settingsKey]) {
    windows[settingsKey] = defaultWindowSettings(windowId);
  }
  return windows[settingsKey];
}

module.exports = {
  WINDOW_DEFAULTS,
  defaultWindowsSettings,
  settingsKeyFor,
  windowIdForResizeTarget,
  ensureWindowSettings,
};
