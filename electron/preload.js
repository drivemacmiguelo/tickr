const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  minimize:        () => ipcRenderer.send('window-minimize'),
  maximize:        () => ipcRenderer.send('window-maximize'),
  close:           () => ipcRenderer.send('window-close'),
  toggleFullscreen:() => ipcRenderer.send('window-fullscreen'),
  onFullscreenChange: (cb) => {
    ipcRenderer.on('fullscreen-changed', (_, isFullscreen) => cb(isFullscreen))
    return () => ipcRenderer.removeAllListeners('fullscreen-changed')
  },
  isElectron: true,
})
