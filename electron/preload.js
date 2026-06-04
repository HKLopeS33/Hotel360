const { contextBridge } = require('electron')

// Expõe apenas o necessário para o renderer
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
})
