// Temporary switch to custom webamp build
// import Webamp from 'webamp'
import Webamp from './webamp/webamp.bundle.js'
const { ipcRenderer } = window.require('electron');

const DEFAULT_DOCUMENT_TITLE = document.title

let trackList: { metaData: { artist: string; title: any; }; url: string; duration: number; }[] = [];

const webamp = new Webamp({
  initialTracks: trackList,
  initialSkin: {
    url: './skins/base-2.91.wsz'
  },
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
})

const unsubscribeOnMinimize = webamp.onMinimize(() => {
  window.minimizeElectronWindow()
})

const unsubscribeOnClose = webamp.onClose(() => {
  window.closeElectronWindow()
  unsubscribeOnMinimize()
  unsubscribeOnClose()
})

webamp.onTrackDidChange((track: any) => {
    window.webampOnTrackDidChange(track)

    if (track && 'metaData' in track && track.metaData.title && track.metaData.artist) {
      document.title = `${track.metaData.title} - ${track.metaData.artist}`
    } else if (track && 'defaultName' in track) {
      document.title = track.defaultName
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE
    }
})

// Render after the skin has loaded.
webamp.renderWhenReady(document.getElementById('app')).then(
  () => window.webampRendered()
)

// Expose some webamp API on the window for the main process
window.webampPlay = function () {
  // @ts-ignore
  webamp.play()
}

window.webampPlay = function () {
  // @ts-ignore
  webamp.play()
}

window.webampPause = function () {
  // @ts-ignore
  webamp.pause()
}

window.webampNext = function () {
  // @ts-ignore
  webamp.nextTrack()
}

window.webampPrevious = function () {
  // @ts-ignore
  webamp.previousTrack()
}


ipcRenderer.invoke('getLikedTracks').then((rs: any) => {
  rs.result.forEach((element: any) => {
    let artist: any[] = [];

    element.artists.forEach((a: any) => {
      artist.push(a.name);
    });

    if (element.durationMs) {
      webamp.appendTracks([{ metaData: {artist: artist.join(', '), title: element.title}, url: element.id, duration: Math.floor(element.durationMs / 1000) }]);
    }
  });

  webamp.appendTracks(trackList);
})


ipcRenderer.on("setTracks", (event:any, data: any) => {
  webamp.setTracksToPlay([]);

  data.forEach((element: any) => {
    let artist: any[] = [];

    element.artists.forEach((a: any) => {
      artist.push(a.name);
    });

    if (element.durationMs) {
      webamp.appendTracks([{ metaData: {artist: artist.join(', '), title: element.title}, url: element.id, duration: Math.floor(element.durationMs / 1000) }]);
    }

  });
});