const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { Client } = require("minecraft-launcher-core");
const Store = require("electron-store");
const store = new Store();

// ─── Rutas ─────────────────────────────────────────────────────
const GAME_DIR = path.join(app.getPath("appData"), ".zyren-launcher");
const MODS_DIR = path.join(GAME_DIR, "mods");

// URL de tu servidor con el JSON del modpack (lo configuras tú)
const MODPACK_MANIFEST_URL =
  process.env.MODPACK_URL || "https://tu-servidor.com/modpack/manifest.json";

// ─── Helpers ───────────────────────────────────────────────────
function ensureDirs() {
  [GAME_DIR, MODS_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
}

async function downloadFile(url, dest, onProgress) {
  const res = await axios.get(url, { responseType: "stream" });
  const total = parseInt(res.headers["content-length"] || "0", 10);
  let downloaded = 0;

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    res.data.on("data", (chunk) => {
      downloaded += chunk.length;
      if (total) onProgress(Math.round((downloaded / total) * 100));
    });
    res.data.pipe(out);
    out.on("finish", resolve);
    out.on("error", reject);
  });
}

// ─── Instalación del modpack ───────────────────────────────────
// El manifest.json en tu servidor debe tener esta forma:
// {
//   "mcVersion": "1.20.1",
//   "forgeVersion": "47.2.0",
//   "mods": [
//     { "name": "mod-ejemplo.jar", "url": "https://...", "sha1": "abc123" }
//   ]
// }
async function installModpack(win) {
  ensureDirs();

  const send = (data) => win.webContents.send("install-progress", data);

  send({ stage: "Descargando manifest...", percent: 0 });
  const { data: manifest } = await axios.get(MODPACK_MANIFEST_URL);
  store.set("manifest", manifest);

  const mods = manifest.mods || [];

  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i];
    const dest = path.join(MODS_DIR, mod.name);

    // Si ya existe y el sha coincide, saltamos
    if (fs.existsSync(dest)) {
      send({ stage: `✓ ${mod.name} ya instalado`, percent: Math.round((i / mods.length) * 100) });
      continue;
    }

    send({ stage: `Descargando ${mod.name}...`, percent: Math.round((i / mods.length) * 100) });
    await downloadFile(mod.url, dest, (p) => {
      send({ stage: `Descargando ${mod.name}... ${p}%`, percent: Math.round((i / mods.length) * 100) });
    });
  }

  send({ stage: "¡Instalación completa!", percent: 100, done: true });
}

// ─── Lanzar Minecraft ──────────────────────────────────────────
async function launchMinecraft(win) {
  const auth = store.get("minecraft_auth");
  const manifest = store.get("manifest");

  if (!auth) throw new Error("No hay sesión de Minecraft guardada.");
  if (!manifest) throw new Error("Modpack no instalado.");

  const launcher = new Client();

  const opts = {
    authorization: auth,
    root: GAME_DIR,
    version: {
      number: manifest.mcVersion,
      type: "release",
    },
    // Si usas Forge, descomenta:
    // forge: path.join(GAME_DIR, `forge-${manifest.forgeVersion}-installer.jar`),
    memory: {
      max: store.get("ram_max", "4G"),
      min: store.get("ram_min", "2G"),
    },
    javaPath: store.get("java_path") || undefined,
    customArgs: [`--server`, process.env.SERVER_IP || "tu.servidor.net"],
  };

  launcher.on("debug", (e) => win.webContents.send("launch-log", e));
  launcher.on("data", (e) => win.webContents.send("launch-log", e));
  launcher.on("progress", (e) =>
    win.webContents.send("install-progress", {
      stage: `Preparando Minecraft: ${e.type}`,
      percent: Math.round((e.task / e.total) * 100),
    })
  );

  await launcher.launch(opts);
}

// ─── Registro de handlers IPC ──────────────────────────────────
function registerHandlers(ipcMain, win) {
  ipcMain.handle("launcher-install", async () => {
    try {
      await installModpack(win);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle("launcher-launch", async () => {
    try {
      await launchMinecraft(win);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle("launcher-status", () => {
    const manifest = store.get("manifest");
    const auth = store.get("minecraft_auth");
    return {
      installed: !!manifest,
      loggedIn: !!auth,
      manifest,
    };
  });
}

module.exports = { registerHandlers };
