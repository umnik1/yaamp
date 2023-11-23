const { remote } = require('electron')
// const handleTransparency = require('./transparency.js')
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

setInterval(() => {
    let height = 12;
    height += document.getElementById('main-window').getBoundingClientRect().height;
    height += document.getElementById('playlist-window').getBoundingClientRect().height;
    height += document.getElementById('equalizer-window').getBoundingClientRect().height;
    if (document.getElementById('webamp-context-menu')) {
        // menu height
        height += 400;
        // menu position
        height += document.querySelector('#webamp-context-menu div').getBoundingClientRect().top;
    }
    let width = document.getElementById('playlist-window').getBoundingClientRect().width;
    if (document.getElementById('webamp-context-menu')) {
        width += document.getElementById('webamp-context-menu').scrollWidth;
    }

    remote.getCurrentWindow().setBounds({
        width: width,
        height: height
    });
}, 100)