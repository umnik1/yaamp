const fs = require('fs');
const { readFile } = require('fs/promises');
const { app } = require('electron');

const DEFAULT_SETTINGS = {
  windows: {
    mainWindow: { x: 0, y: 12, visible: true },
    playlistWindow: { x: 0, y: 244, size: [0, 0], visible: true },
    equalizerWindow: { x: 0, y: 128, visible: true },
    milkdropWindow: { x: 275, y: 12, size: [7, 8], visible: true },
    nowPlayingWindow: { x: 275, y: 128, size: [4, 6], visible: false },
  },
  zoom: 1,
  api: { enabled: false, port: 8080 },
  wheelSeeds: ['user:onyourwave'],
};

const userDataPath = app.getPath('userData');
const tokenPath = `${userDataPath}/token.json`;
const skinPath = `${userDataPath}/skin.json`;
const eqPath = `${userDataPath}/eq.json`;
const settingsPath = `${userDataPath}/settings.json`;

let settingsData = { ...DEFAULT_SETTINGS, windows: { ...DEFAULT_SETTINGS.windows } };
let resetSettings = { ...DEFAULT_SETTINGS, windows: { ...DEFAULT_SETTINGS.windows } };
let yaAuthToken = '';
let skinData = '';
let eqData = '';

const getTokenFromFile = async () => {
  try {
    yaAuthToken = await readFile(tokenPath, 'binary');
  } catch {
    fs.writeFile(tokenPath, '', () => {});
  }
};

const getSkinFromFile = async () => {
  try {
    skinData = await readFile(skinPath, 'binary');
  } catch {
    fs.writeFile(skinPath, '', () => {});
  }
};

const getEQFromFile = async () => {
  try {
    eqData = await readFile(eqPath, 'binary');
  } catch {
    fs.writeFile(eqPath, '', () => {});
  }
};

const getSettingsFromFile = async () => {
  try {
    const result = await readFile(settingsPath, 'binary');
    const parsed = JSON.parse(result);
    settingsData = {
      ...settingsData,
      ...parsed,
      windows: {
        ...settingsData.windows,
        ...(parsed.windows || {}),
      },
      api: {
        enabled: parsed.api?.enabled !== undefined ? parsed.api.enabled : false,
        port: parsed.api?.port || 8080,
      },
    };
  } catch {
    fs.writeFile(settingsPath, JSON.stringify(settingsData), () => {});
  }
};

// Атомарная запись настроек через временный файл.
const saveSettings = (callback) => {
  let error = null;
  try {
    const tmpPath = `${settingsPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(settingsData));
    fs.renameSync(tmpPath, settingsPath);
  } catch (e) {
    error = e;
  }
  if (callback) {
    setImmediate(callback, error);
  }
};

module.exports = {
  tokenPath,
  skinPath,
  eqPath,
  settingsPath,
  DEFAULT_SETTINGS,
  get settingsData() { return settingsData; },
  set settingsData(value) { settingsData = value; },
  get resetSettings() { return resetSettings; },
  get yaAuthToken() { return yaAuthToken; },
  get skinData() { return skinData; },
  set skinData(value) { skinData = value; },
  get eqData() { return eqData; },
  getTokenFromFile,
  getSkinFromFile,
  getEQFromFile,
  getSettingsFromFile,
  saveSettings,
};
