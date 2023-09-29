const { remote } = require('electron')
const handleTransparency = require('./transparency.js')
const handleThumbnail = require('./thumbnail.js')
const handleThumbar = require('./thumbar.js')

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
    handleTransparency()
    handleThumbnail()
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

    handleThumbar(
        state,
        window.webampPlay,
        window.webampPause,
        window.webampPrevious,
        window.webampNext,
    )
}
