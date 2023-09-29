const { remote } = require('electron')

function handleTransparency() {
    const mainWindow = remote.getCurrentWindow()

    // Mac OS already handles it around the UI (windows and context menu) well.
    // TODO: Check if forward: true still doesn't work reliably
    // if the webamp windows is not in the foreground (no events triggered).
    // TODO: Check if skin transparency can be implemented without performance hit.

    // Windows
    // Ignoring mouse events around the UI (windows and context menu).
    // Works by using mousein and mouseout and forwarding when ignoring.
    if (process.platform === 'win32') {
        mainWindow.setIgnoreMouseEvents(true, { forward: true })
        let ignored = true

        const mouseenterHandler = () => {
            if (ignored) {
                mainWindow.setIgnoreMouseEvents(false)
                ignored = false
            }
        }
        const mouseleaveHandler = (e) => {
            if (!e.toElement
                || !e.toElement.offsetParent
                || e.toElement.offsetParent.id === 'webamp'
            ) {
                mainWindow.setIgnoreMouseEvents(true, { forward: true })
                ignored = true
            }
            // We want to schedule events again for context menu.
            // Context menu can "stick out" of windows.
            if (e.toElement.classList.contains('context-menu')) {
                e.toElement.addEventListener('mouseenter', mouseenterHandler)
                e.toElement.addEventListener('mouseleave', mouseleaveHandler)
                e.toElement.addEventListener('click', () => {
                    // Removing context menu means we have to trigger leave too
                    mainWindow.setIgnoreMouseEvents(true, { forward: true })
                    ignored = true
                })
            }
        }

        const rebindMouseEvents = () => {
            const webampWindows = document.querySelectorAll('#webamp .window')
            for (webampWindow of webampWindows) {
                webampWindow.removeEventListener('mouseenter', mouseenterHandler)
                webampWindow.removeEventListener('mouseleave', mouseleaveHandler)
                webampWindow.addEventListener('mouseenter', mouseenterHandler)
                webampWindow.addEventListener('mouseleave', mouseleaveHandler)
            }
        }

        const observer = new MutationObserver(() => {
            rebindMouseEvents()
        })
        observer.observe(
            document.querySelector('#main-window').parentElement.parentElement,
            { childList: true }
        )

        rebindMouseEvents()
    }

    // Linux
    // Ignoring mouse events around the UI (windows and context menu).
    // We'll track and save position of webamp windows and context menu
    // and poll mouse to see if it is within the saved bounds.
    // TODO: Check if we can use forward: true on this platform too.
    if (process.platform === 'linux') {
        /**
         * @type {[id: string]: {minX: number, maxX: number, minY: number, maxY: number} }
         */
        const elementPositions = {}
        let ignored = false
        let interval

        const setupWatchingElements = () => {
            const watchWindowAttributes = (webampWindowWrapper) => {
                // Removed from the DOM
                if (webampWindowWrapper.parentElement === null) {
                    delete elementPositions[webampWindowWrapper.children[0].id]
                    return
                }

                const recalculateElementPositions = (windowWrapper) => {
                    const recalcWindow = windowWrapper.children[0]
                    const boundingRect = recalcWindow.getBoundingClientRect()

                    elementPositions[recalcWindow.id] = {
                        minX: boundingRect.x,
                        minY: boundingRect.y,
                        maxX: boundingRect.x + boundingRect.width,
                        maxY: boundingRect.y + boundingRect.height,
                    }
                }

                const observer = new MutationObserver(
                    (mutationsList) => recalculateElementPositions(
                        mutationsList[0].target
                    )
                )
                observer.observe(
                    webampWindowWrapper,
                    { attributes: true }
                )
                recalculateElementPositions(webampWindowWrapper)
            }

            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    const changedNodes =
                        mutation.addedNodes.length > 0 ? mutation.addedNodes : mutation.removedNodes
                    for (const changedNode of changedNodes) {
                        watchWindowAttributes(changedNode)
                    }
                }
            })
            observer.observe(
                document.querySelector('#main-window').parentElement.parentElement,
                { childList: true }
            )

            for (const webampWindow of document.querySelectorAll('#webamp .window')) {
                watchWindowAttributes(webampWindow.parentElement)
            }

            // Context menu is watched just by observing adding and removing of the node.
            // When added, whole body is position of the contet menu.
            const contextMenuObserver = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.addedNodes.length > 0
                        && mutation.addedNodes[0].id === 'webamp-context-menu'
                    ) {
                        elementPositions['webamp-context-menu'] = {
                            minX: 0,
                            minY: 0,
                            maxX: 9999,
                            maxY: 9999,
                        }
                    }

                    if (mutation.removedNodes.length > 0
                        && mutation.removedNodes[0].id === 'webamp-context-menu'
                    ) {
                        delete elementPositions['webamp-context-menu']
                    }
                }
            })
            contextMenuObserver.observe(
                document.querySelector('body'),
                { childList: true }
            )
        }

        const enableTransparencyChecking = () => {
            clearInterval(interval)
            interval = setInterval(() => {
                const cursorPoint = remote.screen.getCursorScreenPoint()
                const windowBounds = mainWindow.getBounds()
    
                const cursorWithinBounds =
                    (cursorPoint.x >= windowBounds.x
                        && cursorPoint.x <= (windowBounds.x + windowBounds.width)
                    ) &&
                    (cursorPoint.y >= windowBounds.y
                        && cursorPoint.y <= (windowBounds.y + windowBounds.height)
                    )
                if (!cursorWithinBounds) {
                    return
                }

                const positionInWindow = {
                    x: cursorPoint.x - windowBounds.x,
                    y: cursorPoint.y - windowBounds.y,
                }

                for (const elementId of Object.keys(elementPositions)) {
                    const elementPosition = elementPositions[elementId]
    
                    const withinX = (positionInWindow.x > elementPosition.minX)
                        && (positionInWindow.x < elementPosition.maxX)
                    if (!withinX) {
                        continue
                    }
                    const withinY = (positionInWindow.y > elementPosition.minY)
                        && (positionInWindow.y < elementPosition.maxY)
                    const within = withinX && withinY
    
                    if (within) {
                        if (ignored) {
                            mainWindow.setIgnoreMouseEvents(false)
                            ignored = false
                        }
                        return
                    }
                }
    
                if (!ignored) {
                    mainWindow.setIgnoreMouseEvents(true)
                    ignored = true
                }
            }, 200)
        }

        const disableTransparencyChecking = () => {
            clearInterval(interval)
        }

        mainWindow.on('restore', () => {
            enableTransparencyChecking()
        })
        mainWindow.on('minimize', () => {
            disableTransparencyChecking()
        })
        mainWindow.on('closed', () => {
            disableTransparencyChecking()
        })

        setupWatchingElements()
        enableTransparencyChecking()
    }
}

module.exports = handleTransparency
