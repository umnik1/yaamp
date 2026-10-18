const fs = require('fs');
const { readFile } = require('fs/promises');
const { app } = require('electron');

// История прослушанных треков. Хранится отдельно от плейлистов и не
// сбрасывается при их переключении.
const MAX_ENTRIES = 500;
const historyPath = `${app.getPath('userData')}/history.json`;

let entries = [];

const loadHistory = async () => {
  try {
    const parsed = JSON.parse(await readFile(historyPath, 'utf8'));
    entries = Array.isArray(parsed) ? parsed : [];
  } catch {
    entries = [];
  }
};

const saveHistory = () => {
  try {
    const tmpPath = `${historyPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(entries));
    fs.renameSync(tmpPath, historyPath);
  } catch (e) {
    console.error('Error writing history file:', e);
  }
};

// Добавляет трек в начало истории. Повтор того же трека подряд не дублируется.
const addTrack = (track) => {
  if (!track?.id) return null;

  const entry = {
    id: String(track.id),
    title: track.title,
    artists: (track.artists || []).map((a) => a.name).join(', '),
    coverUri: track.coverUri,
    durationMs: track.durationMs,
    playedAt: Date.now(),
  };

  if (entries[0]?.id === entry.id) {
    entries[0] = entry;
  } else {
    entries.unshift(entry);
    entries.length = Math.min(entries.length, MAX_ENTRIES);
  }

  saveHistory();
  return entry;
};

const clearHistory = () => {
  entries = [];
  saveHistory();
};

module.exports = {
  loadHistory,
  addTrack,
  clearHistory,
  get entries() { return entries; },
};
