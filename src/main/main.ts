import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import dotenv from 'dotenv';
import { databaseService } from '../database/database';
import { AuthService } from '../services/auth';
import { setupIPCHandlers } from './ipc-handlers';

// Load environment variables
dotenv.config();

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    height: 900,
    width: 1400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready-to-show
    title: 'Satirical Video Production Platform'
  });

  // Load the index.html of the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    // Open the DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Initialize application
async function initializeApp() {
  try {
    console.log('Initializing Satirical Video Production Platform...');
    
    // Initialize database
    await databaseService.initialize();
    console.log('Database initialized successfully');
    
    // Setup IPC handlers
    setupIPCHandlers();
    console.log('IPC handlers setup completed');
    
    // Create default admin user for development
    await AuthService.createDefaultAdmin();
    
    // Create main window
    createWindow();
    
    console.log('Application initialization completed');
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(initializeApp);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it's common for applications to stay active even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked new window creation to:', url);
    return { action: 'deny' };
  });
});

// Basic IPC handlers (additional handlers are in ipc-handlers.ts)
ipcMain.handle('app-version', () => {
  return app.getVersion();
});

ipcMain.handle('platform-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version
  };
});

// Cleanup on app quit
app.on('before-quit', () => {
  console.log('Application shutting down...');
  databaseService.close();
  console.log('Database connection closed');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});