import { Track } from './webamp/webamp.bundle'

declare global {
    interface Window {
        minimizeElectronWindow: () => void
        closeElectronWindow: () => void
        webampRendered: () => void
        centerWindowsInView: () => void
        webampOnTrackDidChange: (track: Track) => void
        webampPlay: () => void
        webampPause: () => void
        webampNext: () => void
        webampPrevious: () => void
    }
}
