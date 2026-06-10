const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const { spawn } = require('child_process')
const http = require('http')
const log = require('electron-log')

let mainWindow = null
let nextServer = null
const PORT = 3000

// ─── Logs do auto-updater (gravados em %APPDATA%/Hotel360/logs) ──────────────
log.transports.file.level = 'info'
autoUpdater.logger = log
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

// Intervalo de verificação automática de atualizações (4 horas)
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000

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
    icon: app.isPackaged
      ? path.join(process.resourcesPath, 'app', '.next', 'standalone', 'public', 'icon.png')
      : path.join(__dirname, '..', 'public', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`)
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Helper: envia status de atualização para o renderer ─────────────────────
function sendStatus(status, payload = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', { status, ...payload })
  }
}

// ─── Auto-updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    log.info('Verificando atualizações...')
    sendStatus('checking')
  })

  autoUpdater.on('update-available', (info) => {
    // Trava de segurança: nunca tentar baixar/instalar a MESMA versão já
    // instalada (evita loop infinito caso o feed de release esteja com a
    // versão errada/duplicada).
    if (info.version === app.getVersion()) {
      log.warn(`update-available reportou a mesma versão já instalada (${info.version}); ignorando.`)
      autoUpdater.autoDownload = false
      sendStatus('not-available', { version: info.version })
      return
    }
    log.info('Atualização disponível:', info.version)
    sendStatus('available', { version: info.version })
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Nenhuma atualização disponível. Versão atual:', info.version)
    sendStatus('not-available', { version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    sendStatus('downloading', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Atualização baixada:', info.version)
    sendStatus('downloaded', { version: info.version })

    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Reiniciar agora', 'Depois'],
      defaultId: 0,
      title: 'Atualização pronta',
      message: `Nova versão (${info.version}) baixada com sucesso.`,
      detail: 'Reinicie o aplicativo para aplicar a atualização.',
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall()
    })
  })

  autoUpdater.on('error', (err) => {
    log.error('Erro no auto-updater:', err)
    sendStatus('error', { message: err?.message ?? String(err) })
  })

  // Primeira verificação ao iniciar
  autoUpdater.checkForUpdates().catch((err) => log.error('checkForUpdates falhou:', err))

  // Verificações periódicas em segundo plano
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => log.error('checkForUpdates falhou:', err))
  }, UPDATE_CHECK_INTERVAL)
}

// ─── IPC: comunicação com a interface (renderer) ──────────────────────────────
ipcMain.handle('app:get-version', () => app.getVersion())

ipcMain.handle('app:check-for-updates', async () => {
  if (!app.isPackaged) {
    return { ok: false, reason: 'dev-mode' }
  }
  try {
    await autoUpdater.checkForUpdates()
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err?.message ?? String(err) }
  }
})

ipcMain.handle('app:quit-and-install', () => {
  autoUpdater.quitAndInstall()
})

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
