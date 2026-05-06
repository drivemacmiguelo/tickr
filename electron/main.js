const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const fs   = require('fs')
const url  = require('url')
const net  = require('net')
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// ── Find a free port ────────────────────────────────────────
function getFreePort() {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

// ── Mime types ──────────────────────────────────────────────
function getMime(ext) {
  const map = {
    '.html': 'text/html',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.json': 'application/json',
    '.png':  'image/png',
    '.ico':  'image/x-icon',
    '.svg':  'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2':'font/woff2',
    '.ttf':  'font/ttf',
    '.map':  'application/json',
    '.txt':  'text/plain',
    '.webp': 'image/webp',
  }
  return map[ext] || 'application/octet-stream'
}

// ── Static file server ──────────────────────────────────────
function startServer(outDir, port) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let filePath = url.parse(req.url).pathname
      if (filePath === '/' || filePath === '') filePath = '/index.html'

      let fullPath = path.join(outDir, filePath)

      // Try exact path → index.html in folder → root index.html
      if (!fs.existsSync(fullPath)) {
        const withIndex = path.join(outDir, filePath, 'index.html')
        fullPath = fs.existsSync(withIndex)
          ? withIndex
          : path.join(outDir, 'index.html')
      }

      try {
        const ext  = path.extname(fullPath)
        const data = fs.readFileSync(fullPath)
        res.writeHead(200, { 'Content-Type': getMime(ext) })
        res.end(data)
      } catch {
        try {
          const data = fs.readFileSync(path.join(outDir, 'index.html'))
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(data)
        } catch {
          res.writeHead(404)
          res.end('Not found')
        }
      }
    })

    server.on('error', reject)
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

// ── Window ──────────────────────────────────────────────────
async function createWindow() {
  const win = new BrowserWindow({
    width: 420, height: 820,
    minWidth: 360, minHeight: 600,
    frame: false, titleBarStyle: 'hidden',
    backgroundColor: '#08090f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/icon.ico'),
    show: false,
  })

  if (isDev) {
    await win.loadURL('http://localhost:3000')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    const outDir = path.join(__dirname, '../out')
    const port   = await getFreePort()          // always free
    await startServer(outDir, port)
    await win.loadURL(`http://127.0.0.1:${port}`)
  }

  win.once('ready-to-show', () => win.show())

  // Fallback: show after 3s no matter what
  setTimeout(() => { if (!win.isDestroyed()) win.show() }, 3000)

  win.webContents.setWindowOpenHandler(({ url: u }) => {
    shell.openExternal(u)
    return { action: 'deny' }
  })

  ipcMain.on('window-minimize',   () => win.minimize())
  ipcMain.on('window-maximize',   () => { win.isMaximized() ? win.unmaximize() : win.maximize() })
  ipcMain.on('window-close',      () => win.close())
  ipcMain.on('window-fullscreen', () => win.setFullScreen(!win.isFullScreen()))

  win.on('enter-full-screen', () => win.webContents.send('fullscreen-changed', true))
  win.on('leave-full-screen',  () => win.webContents.send('fullscreen-changed', false))

  win.webContents.on('before-input-event', (_, input) => {
    if (input.key === 'F11'    && input.type === 'keyDown') win.setFullScreen(!win.isFullScreen())
    if (input.key === 'Escape' && input.type === 'keyDown' && win.isFullScreen()) win.setFullScreen(false)
  })
}

Menu.setApplicationMenu(null)

// Fix cache permission issues when running from protected directories
app.commandLine.appendSwitch('--disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('--disable-background-timer-throttling')

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
