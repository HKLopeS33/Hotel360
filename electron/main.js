const { app, BrowserWindow, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')

let mainWindow = null
let nextServer = null
const PORT = 3000

// ─── Inicia o servidor Next.js standalone ────────────────────────────────────
function startNextServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js')

    nextServer = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: '127.0.0.1',
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
    })

    nextServer.stdout.on('data', (data) => {
      const msg = data.toString()
      console.log('[Next]', msg)
      if (msg.includes('Ready') || msg.includes('started server')) resolve()
    })

    nextServer.stderr.on('data', (data) => console.error('[Next ERR]', data.toString()))
    nextServer.on('error', reject)

    // fallback: aguarda até 10s para o servidor responder
    const deadline = Date.now() + 10000
    const poll = setInterval(() => {
      http.get(`http://127.0.0.1:${PORT}`, () => {
        clearInterval(poll)
        resolve()
      }).on('error', () => {
        if (Date.now() > deadline) {
          clearInterval(poll)
          reject(new Error('Next.js server timeout'))
        }
      })
    }, 300)
  })
}

// ─── Cria a janela principal ──────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Hotel360',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`)
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Auto-updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Atualização disponível',
      message: 'Uma nova versão do Hotel360 está sendo baixada.',
    })
  })

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Reiniciar agora', 'Depois'],
      title: 'Atualização pronta',
      message: 'Nova versão baixada. Reinicie para aplicar a atualização.',
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
  })
}

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startNextServer()
  } catch (err) {
    console.error('Falha ao iniciar servidor Next.js:', err)
  }

  createWindow()

  if (app.isPackaged) {
    setupAutoUpdater()
  }
})

app.on('window-all-closed', () => {
  if (nextServer) nextServer.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
