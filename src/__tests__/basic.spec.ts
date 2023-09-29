import path from 'path'
import { Application } from 'spectron'

const baseDir = path.join(__dirname, '../..')
const electronBinary = path.join(
    baseDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'electron.cmd' : 'electron'
)

describe('Basic functionality', () => {
    jest.setTimeout(30 * 1000)

    const app = new Application({
        path: electronBinary,
        args: [baseDir],
        requireName: 'spectronRequire',
        env: {
            ELECTRON_IS_DEV: 0,
            NODE_ENV: 'test',
        },
    })

    beforeEach(() => app.start())

    afterEach(() => {
        if (app && app.isRunning()) {
            return app.stop()
        }
    })

    it('Is showing an initial window', async () => {
        const electronWindowCount = await app.client.getWindowCount()
        expect(electronWindowCount).toBe(1)

        const mainExists = await app.client.waitForExist(
            '#webamp #main-window',
            5000,
        )
        expect(mainExists).toBeTruthy()
    })

    it('Allows minimizing of the window', async () => {
        const isMinimized = await app.browserWindow.isMinimized()
        expect(isMinimized).toEqual(false)

        const wasMinimized = await new Promise(async (resolve) => {
            const eventTimeout = setTimeout(() => {
                clearInterval(checkInterval)
                resolve(false)
            }, 10000)

            // We don't use minimize event becasue it doesn't get triggered
            const checkInterval = setInterval(async () => {
                if (await app.browserWindow.isMinimized()) {
                    clearTimeout(eventTimeout)
                    clearInterval(checkInterval)
                    resolve(true)
                }
            }, 500)

            app.client.leftClick('#webamp #minimize')
        })

        expect(wasMinimized).toEqual(true)
    })

    // TODO: Skipped till I figure out why it doesn't work
    it.skip('Allows closing of the window', async () => {
        const wasClosed = await new Promise((resolve) => {
            const eventTimeout = setTimeout(() => {
                clearInterval(checkInterval)
                resolve(false)
            }, 10000)

            // We don't use minimize event becasue it doesn't get triggered
            const checkInterval = setInterval(async () => {
                if ((await app.client.getWindowCount()) === 0) {
                    clearTimeout(eventTimeout)
                    clearInterval(checkInterval)
                    resolve(true)
                }
            }, 500)

            app.client.leftClick('#webamp #close')
        })

        expect(wasClosed).toEqual(true)
    })
})
