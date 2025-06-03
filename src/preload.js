const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // File operations
  saveFile: (filePath, data) => ipcRenderer.invoke('save-file', filePath, data),
  loadFile: (filePath) => ipcRenderer.invoke('load-file', filePath),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
  
  // Project operations
  exportReport: (data) => ipcRenderer.invoke('export-report', data),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
});