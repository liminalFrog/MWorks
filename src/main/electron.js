const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    frame: false, // Windowless
    titleBarStyle: 'hidden',
    backgroundColor: '#1f2937',
    show: false, // Don't show until ready
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  // Load the built HTML file
  const isDev = process.env.NODE_ENV === 'development';
  mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  console.log('Loading HTML file from:', path.join(__dirname, '../../dist/index.html'));
  
  // Always open dev tools for debugging
  mainWindow.webContents.openDevTools();

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    console.log('Main window is ready to show');
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
}

// IPC handlers for window controls
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// File operation handlers
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'MWorks Projects', extensions: ['mw'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const filePath = result.filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return {
        name: path.basename(filePath),
        content: fileContent,
        path: filePath
      };
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }
  return null;
});

ipcMain.handle('save-file', async (event, data) => {
  try {
    if (data.path) {
      // Save to existing file
      fs.writeFileSync(data.path, data.content, 'utf8');
      return { success: true, path: data.path };
    } else {
      // Save as new file
      const result = await dialog.showSaveDialog(mainWindow, {
        filters: [
          { name: 'MWorks Projects', extensions: ['mw'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: 'Untitled Project.mw'
      });
      
      if (!result.canceled) {
        fs.writeFileSync(result.filePath, data.content, 'utf8');
        return { success: true, path: result.filePath };
      }
    }
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
  return { success: false };
});

ipcMain.handle('export-report', async (event, data) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'Excel Files', extensions: ['xlsx'] },
        { name: 'CSV Files', extensions: ['csv'] }
      ],
      defaultPath: 'MWorks Report.pdf'
    });
    
    if (!result.canceled) {
      // Here you would implement the actual export logic
      // For now, just create a placeholder file
      const exportContent = `MWorks Report\nGenerated: ${new Date().toISOString()}\n\n${JSON.stringify(data, null, 2)}`;
      fs.writeFileSync(result.filePath, exportContent, 'utf8');
      return { success: true, path: result.filePath };
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return { success: false, error: error.message };
  }
  return { success: false };
});

app.whenReady().then(() => {
  console.log('Electron app is ready, creating window...');
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}