const path = require('path')

const { remote } = require('electron')

function handleThumbar(state = 'stopped', onPlay, onPause, onPrevious, onNext) {
  // Only supported on Windows
  if (process.platform !== 'win32') {
    return
  }

  const mainWindow = remote.getCurrentWindow()

  mainWindow.setThumbarButtons([
    {
      icon: path.join(__dirname, '../../res/icons/previous.png'),
      click: onPrevious,
      tooltip: 'Previous',
      flag: [(state === 'stopped' ? 'disabled' : 'enabled')],
    },
    {
      icon: path.join(
        __dirname, 
        `../../res/icons/${(state === 'playing' ? 'pause' : 'play')}.png`,
      ),
      click: state === 'playing' ? onPause : onPlay,
      tooltip: 'Play',
      flag: [(state === 'stopped' ? 'disabled' : 'enabled')],
    },
    {
      icon: path.join(__dirname, '../../res/icons/next.png'),
      click: onNext,
      tooltip: 'Next',
      flag: [(state === 'stopped' ? 'disabled' : 'enabled')],
    },
  ])
}

module.exports = handleThumbar
