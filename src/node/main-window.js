let mainWindow = null;
let currentBounds = null;

module.exports = {
  get: () => mainWindow,
  set: (win) => { mainWindow = win; },
  getCurrentBounds: () => currentBounds,
  setCurrentBounds: (bounds) => { currentBounds = bounds; },
};
