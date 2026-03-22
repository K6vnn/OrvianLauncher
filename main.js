const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const Store = require("electron-store");
const { autoUpdater } = require("electron-updater");
const store = new Store();

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 620,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "src/electron/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: "#0f0f13",
  });

  const url = isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "build/index.html")}`;

  mainWindow.loadURL(url);
  if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
}

app.whenReady().then(() => {
  createWindow();

  // Auto-updater: busca nueva versión en GitHub Releases al arrancar
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on("update-available", () => {
      mainWindow.webContents.send("update-available");
    });

    autoUpdater.on("update-downloaded", () => {
      mainWindow.webContents.send("update-downloaded");
    });

    // El renderer puede pedir instalar la actualización
    ipcMain.on("install-update", () => autoUpdater.quitAndInstall());
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── IPC: Ventana ──────────────────────────────────────────────
ipcMain.on("window-minimize", () => mainWindow.minimize());
ipcMain.on("window-close", () => mainWindow.close());

// ─── IPC: Store (guardar/leer datos persistentes) ─────────────
ipcMain.handle("store-get", (_e, key) => store.get(key));
ipcMain.handle("store-set", (_e, key, value) => store.set(key, value));
ipcMain.handle("store-delete", (_e, key) => store.delete(key));

// ─── IPC: Abrir URL externa (para OAuth Discord) ───────────────
ipcMain.on("open-external", (_e, url) => shell.openExternal(url));

// ─── IPC: Launcher ─────────────────────────────────────────────
const launcher = require("./src/electron/launcher");
launcher.registerHandlers(ipcMain, mainWindow);
