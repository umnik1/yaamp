const { remote, webFrame } = require('electron')
const { debounce } = require('./utilities')

function handleThumbnail() {
  // Currently only supported on Windows
  // TODO: Add support for other platforms?
  if (process.platform !== 'win32') {
    return
  }

  const mainWindow = remote.getCurrentWindow()
  const mainWebampWindow = document.querySelector('#main-window')

  // Область превью задаётся в пикселях окна (с учётом масштаба страницы),
  // целыми неотрицательными числами, иначе setThumbnailClip бросает ошибку.
  const setClip = () => {
    const boundingRect = mainWebampWindow.getBoundingClientRect()
    const zoom = webFrame.getZoomFactor() || 1
    const x = Math.max(0, Math.round(boundingRect.x * zoom))
    const y = Math.max(0, Math.round(boundingRect.y * zoom))
    const width = Math.round(boundingRect.right * zoom) - x
    const height = Math.round(boundingRect.bottom * zoom) - y
    if (width <= 0 || height <= 0) return

    try {
      mainWindow.setThumbnailClip({ x, y, width, height })
    } catch (error) {
      console.error('Failed to set thumbnail clip', error)
    }
  }

  const observer = new MutationObserver(debounce(setClip))
  observer.observe(
    mainWebampWindow.parentElement,
    { attributes: true }
  )
  setClip()
}

module.exports = handleThumbnail
