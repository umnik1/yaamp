const { remote } = require('electron')
const { debounce } = require('./utilities')

function handleThumbnail() {
  // Currently only supported on Windows
  // TODO: Add support for other platforms?
  if (process.platform !== 'win32') {
    return
  }

  const mainWindow = remote.getCurrentWindow()
  const mainWebampWindow = document.querySelector('#main-window')

  const setClip = () => {
    const boundingRect = mainWebampWindow.getBoundingClientRect()

    mainWindow.setThumbnailClip({
      x: boundingRect.x,
      y: boundingRect.y,
      width: boundingRect.width,
      height: boundingRect.height,
    })
  }

  const observer = new MutationObserver(debounce(setClip))
  observer.observe(
    mainWebampWindow.parentElement,
    { attributes: true }
  )
  setClip()
}

module.exports = handleThumbnail
