// Temporary switch to custom webamp build
// import Webamp from 'webamp'
import Webamp from './webamp/webamp.bundle.js'
import {
  DEFAULT_WINDOW_LAYOUT,
  applySavedWindows,
  normalizeWindowPositions,
} from './yaamp-layout';

const { ipcRenderer } = window.require('electron');

const DEFAULT_DOCUMENT_TITLE = document.title;

let trackList: { metaData: { artist: string; title: any; }; url: string; duration: number; }[] = [];

const webamp = new Webamp({
  initialTracks: trackList,
  availableSkins: [
    { url: './skins/base-2.91.wsz', name: 'Base v2.91' },
    { url: './skins/Green-Dimension-V2.wsz', name: 'Green Dimension V2' },
    { url: './skins/MacOSXAqua1-5.wsz', name: 'Mac OSX v1.5 (Aqua)' },
    { url: './skins/Skinner_Atlas.wsz', name: 'Skinner Atlas' },
    { url: './skins/TopazAmp1-2.wsz', name: 'TopazAmp v1.2' },
    { url: './skins/Vizor1-01.wsz', name: 'Vizor v1.01' },
    { url: './skins/XMMS-Turquoise.wsz', name: 'XMMS Turquoise' },
    { url: './skins/ZaxonRemake1-0.wsz', name: 'Zaxon Remake v1.0' },
  ],
  enableHotkeys: true,
  // Prevents stackWindows(); only resizable windows include size.
  __initialWindowLayout: DEFAULT_WINDOW_LAYOUT,
});

const unsubscribeOnMinimize = webamp.onMinimize(() => {
  window.minimizeElectronWindow();
});

const unsubscribeOnClose = webamp.onClose(() => {
  window.closeElectronWindow();
  unsubscribeOnMinimize();
  unsubscribeOnClose();
});

webamp.onTrackDidChange((track: any) => {
  window.webampOnTrackDidChange(track);

  if (track && 'metaData' in track && track.metaData.title && track.metaData.artist) {
    document.title = `${track.metaData.title} - ${track.metaData.artist}`;
  } else if (track && 'defaultName' in track) {
    document.title = track.defaultName;
  } else {
    document.title = DEFAULT_DOCUMENT_TITLE;
  }

  ipcRenderer.invoke('nowPlaying', document.title);
});

async function restoreSavedLayout() {
  try {
    const settingsRaw = await ipcRenderer.invoke('getSettings');
    const settings = JSON.parse(settingsRaw);
    applySavedWindows(webamp.store, settings.windows);

    await ipcRenderer.invoke('movingWindowStarted');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await ipcRenderer.invoke('movingWindowEndedWithoutSave');
  } catch (error) {
    console.error('Failed to restore window layout', error);
  }
}

// После перетаскивания возвращает окна из-за верхнего/левого края и сохраняет
// текущие позиции окон.
ipcRenderer.on('lockWindow', () => {
  const genWindows = webamp.store.getState().windows.genWindows;
  const { positions, shift } = normalizeWindowPositions(
    Object.fromEntries(
      Object.entries(genWindows).map(([windowId, w]: [string, any]) => [windowId, w.position])
    ),
    (windowId) => !!genWindows[windowId]?.open
  );

  if (shift.x || shift.y) {
    webamp.store.dispatch({ type: 'UPDATE_WINDOW_POSITIONS', positions, absolute: false });
    ipcRenderer.invoke('moveWindowBy', { dx: -shift.x, dy: -shift.y });
  }

  for (const [windowId, position] of Object.entries(positions)) {
    ipcRenderer.invoke('saveWindowState', { windowId, x: position.x, y: position.y });
  }
});

webamp.renderWhenReady(document.getElementById('app')).then(() => {
  window.webampRendered();
  restoreSavedLayout();
});

window.webampPlay = function () {
  webamp.play();
};

window.webampPause = function () {
  webamp.pause();
};

window.webampNext = function () {
  webamp.nextTrack();
};

window.webampPrevious = function () {
  webamp.previousTrack();
};

window.centerWindowsInView = function () {
  webamp.centerWindowsInView();
};

window.webampSetVolume = function (volume: number) {
  if (webamp.store) {
    webamp.store.dispatch({ type: 'SET_VOLUME', volume: Math.max(0, Math.min(100, volume)) });
  }
};

window.webampPlayFirstTrack = function () {
  if (webamp.store) {
    const state = webamp.store.getState();
    const trackOrder = state.playlist.trackOrder;
    if (trackOrder && trackOrder.length > 0) {
      const firstTrackId = trackOrder[0];
      webamp.store.dispatch({ type: 'PLAY_TRACK', id: firstTrackId });
    }
  }
};

ipcRenderer.invoke('getSkin').then((rs: any) => {
  if (rs) {
    webamp.setSkinFromClient(rs);
  }
});

ipcRenderer.invoke('getEq').then((rs: any) => {
  if (rs) {
    webamp.setEqFromClient(rs);
  }
});

ipcRenderer.invoke('getLikedTracks').then((rs: any) => {
  rs.result.forEach((element: any) => {
    let artist: any[] = [];

    if (element) {
      element.artists.forEach((a: any) => {
        artist.push(a.name);
      });

      if (element.durationMs) {
        webamp.appendTracks([{ metaData: {artist: artist.join(', '), title: element.title}, url: element.id, duration: Math.floor(element.durationMs / 1000) }]);
      }
    }
  });

  webamp.appendTracks(trackList);
});

ipcRenderer.on("setTracks", (event:any, data: any) => {
  webamp.setTracksToPlay([]);

  let tracksIds: string[] = [];

  data.forEach((element: any) => {
    let artist: any[] = [];

    if (element) {
      element.artists.forEach((a: any) => {
        artist.push(a.name);
      });

      if (element.durationMs) {
        if (!tracksIds.includes(element.id)) {
          webamp.appendTracks([{ metaData: {artist: artist.join(', '), title: element.title}, url: element.id, duration: Math.floor(element.durationMs / 1000) }]);
          tracksIds.push(element.id);
        }
      }
    }
  });
});

ipcRenderer.on("setLoader", (event:any) => {
  const el = document.createElement('div');
  el.classList.add('spinner');
  const box = document.getElementById('playlist-window');
  box?.appendChild(el);
});

ipcRenderer.on("hideLoader", (event:any) => {
  document.querySelector(".spinner")?.remove();
});

ipcRenderer.on("showMessage", (event:any, data: any) => {
  const el = document.createElement('div');
  el.classList.add('message');
  el.innerHTML = data;
  const box = document.getElementById('playlist-window');
  box?.appendChild(el);

  setTimeout(() => document.querySelector(".message")?.remove(), 1000);
});

ipcRenderer.on("playPause", (event:any) => {
  const status = webamp.getMediaStatus();
  if (status === "PLAYING") {
    webamp.pause();
    ipcRenderer.invoke('isPlay', 0);
  } else if (status === "PAUSED") {
    webamp.play();
    ipcRenderer.invoke('isPlay', 1);
  } else if (status === "STOPPED") {
    const state = webamp.store.getState();
    const trackOrder = state.playlist.trackOrder;
    const currentTrack = state.playlist.currentTrack;

    if (currentTrack !== null && currentTrack !== undefined) {
      webamp.play();
      ipcRenderer.invoke('isPlay', 1);
    } else if (trackOrder && trackOrder.length > 0) {
      const firstTrackId = trackOrder[0];
      webamp.store.dispatch({ type: 'PLAY_TRACK', id: firstTrackId });
      ipcRenderer.invoke('isPlay', 1);
    }
  }
});

setInterval(() => {
  if (webamp.getMediaStatus() === "PLAYING") {
    ipcRenderer.invoke('isPlay', 0);
  } else {
    ipcRenderer.invoke('isPlay', 1);
  }
}, 2000);

ipcRenderer.on("prevTrack", (event:any) => {
  webamp.previousTrack();
});

ipcRenderer.on("nextTrack", (event:any) => {
  webamp.nextTrack();
});

ipcRenderer.on("setVolume", (event:any, volume: number) => {
  window.webampSetVolume(volume);
});
