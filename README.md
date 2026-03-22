# ⚡ Orvian Launcher

Launcher custom para Minecraft con Discord + auto-updater.

---

## 🗺️ Arquitectura

```
GitHub (código del launcher)
  └── GitHub Actions → compila el .exe → lo sube a Releases automáticamente

Vercel (backend)
  ├── /modpack/manifest.json  → lista de mods actualizable sin recompilar
  └── /api/verify-discord     → verifica que el usuario está en tu servidor

Tu amigo
  └── Descarga OrvianLauncher-Setup.exe desde GitHub Releases
      └── Lo instala → se conecta a Vercel → descarga mods → juega
```

---

## 🚀 Setup paso a paso

### 1. Discord Developer Portal
1. Ve a https://discord.com/developers/applications
2. New Application → ponle nombre
3. En OAuth2: Redirect URI → http://localhost:4839/discord/callback
4. Guarda el Client ID y Client Secret

### 2. Subir el backend a Vercel
```bash
cd vercel-backend
vercel
```
Añade en el dashboard de Vercel:
- DISCORD_CLIENT_ID
- DISCORD_CLIENT_SECRET
- DISCORD_GUILD_ID
- REQUIRED_ROLE_ID (opcional)

### 3. Configurar la URL de Vercel en el launcher
En launcher.js: MODPACK_MANIFEST_URL = "https://tu-proyecto.vercel.app/modpack/manifest.json"

### 4. Publicar primera versión
```bash
git tag v1.0.0
git push --tags
```
GitHub Actions compila el .exe y lo sube a Releases solo.

### 5. Enviarle el link a tu amigo
https://github.com/TU_USUARIO/zyren-launcher/releases/latest/download/ZyrenLauncher-Setup.exe

---

## 🔄 Actualizar mods (sin reenviar el .exe)
Edita vercel-backend/modpack/manifest.json y haz push. Listo.

## 🔄 Actualizar el launcher
```bash
git tag v1.0.1 && git push --tags
```
electron-updater avisa a todos los usuarios automáticamente.
