const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  search: (request) => ipcRenderer.invoke('search', request),
});
