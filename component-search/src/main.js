const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { toSearchTerm } = require('./parser');
const distributors = require('./distributors');

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'));
} catch {
  // No .env yet - the Farnell module reports the missing key on search.
}

ipcMain.handle('search', async (_event, { query, distributors: selected, inStock, smallVolume }) => {
  const term = toSearchTerm(query || '');
  const ids = (selected || []).filter((id) => distributors[id]);

  const settled = await Promise.allSettled(
    ids.map((id) => distributors[id].search(term, { inStock, smallVolume }))
  );

  return {
    term,
    results: settled.map((r, i) => {
      const name = distributors[ids[i]].name;
      return r.status === 'fulfilled'
        ? { distributor: name, ...r.value }
        : { distributor: name, error: r.reason?.message || String(r.reason) };
    }),
  };
});

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'Component Search',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
