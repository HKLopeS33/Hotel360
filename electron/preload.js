const { contextBridge, ipcRenderer } = require('electron')

// Expõe apenas o necessário para o renderer (Next.js)
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,

  getVersion: () => ipcRenderer.invoke('app:get-version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('app:quit-and-install'),

  onUpdateStatus: (callback) => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('update-status', listener)
    return () => ipcRenderer.removeListener('update-status', listener)
  },
})
