const { autoUpdater } = require('electron-updater')
const log = require('electron-log')
const electron = require('electron')
const isDev = require('electron-is-dev')
const htmlToText = require('html-to-text')

function checkForUpdatesAndNotify() {
  if (isDev) {
    console.warn('Updates are not checked in dev mode')
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.fullChangelog = true
  autoUpdater.logger = log

  autoUpdater.on('update-available', (info) => {
    log.info('Got info about update available', info)
    electron.dialog.showMessageBox({
      type: 'none',
      buttons: ['Open', 'Cancel'],
      title: 'New version available',
      message: [
        `There is a new version ${info.version}.`,
        ` Would you like to open the download page?`,
      ].join(''),
      detail: htmlToText.fromString(
        info.releaseNotes.reduce((acc, n) => acc + n.version + '<hr>' + n.note, ''),
        { singleNewLineParagraphs: true }
      ),
      noLink: true,
    }, (choice) => {
      if (choice === 0) {
        electron.shell.openExternal('https://desktop.webamp.org')
      }
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('Update check failed', err)
  })

  autoUpdater.checkForUpdates()
}

module.exports = checkForUpdatesAndNotify
