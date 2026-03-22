const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  // Ventana
  minimize: () => ipcRenderer.send("window-minimize"),
  close: () => ipcRenderer.send("window-close"),

  // Store persistente
  store: {
    get: (key) => ipcRenderer.invoke("store-get", key),
    set: (key, value) => ipcRenderer.invoke("store-set", key, value),
    delete: (key) => ipcRenderer.invoke("store-delete", key),
  },

  // URLs externas
  openExternal: (url) => ipcRenderer.send("open-external", url),

  // Launcher
  launcher: {
    install: (modpackUrl) => ipcRenderer.invoke("launcher-install", modpackUrl),
    launch: () => ipcRenderer.invoke("launcher-launch"),
    getStatus: () => ipcRenderer.invoke("launcher-status"),
  },

  // Progreso de instalación (eventos)
  onProgress: (cb) => ipcRenderer.on("install-progress", (_e, data) => cb(data)),
  onLaunchLog: (cb) => ipcRenderer.on("launch-log", (_e, msg) => cb(msg)),
  removeAllListeners: (ch) => ipcRenderer.removeAllListeners(ch),
});
