// ─── auth.js ──────────────────────────────────────────────────
// Autenticación de Discord OAuth2 y Microsoft/Minecraft

const axios = require("axios");

// ─── DISCORD ──────────────────────────────────────────────────
// Necesitas crear una app en https://discord.com/developers/applications
// y configurar redirect_uri a http://localhost:4839/discord/callback
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "TU_CLIENT_ID";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "TU_CLIENT_SECRET";
const DISCORD_REDIRECT = "http://localhost:4839/discord/callback";

function getDiscordAuthUrl() {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT,
    response_type: "code",
    scope: "identify guilds.members.read",
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

async function exchangeDiscordCode(code) {
  const { data } = await axios.post(
    "https://discord.com/api/oauth2/token",
    new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: DISCORD_REDIRECT,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data; // { access_token, refresh_token, ... }
}

async function getDiscordUser(accessToken) {
  const { data } = await axios.get("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data; // { id, username, avatar, ... }
}

// ─── MICROSOFT / MINECRAFT ────────────────────────────────────
// Usamos la librería msmc para manejar el flujo completo:
// Microsoft OAuth → Xbox Live → XSTS → Minecraft
// Docs: https://github.com/Hanro50/MSMC

async function loginWithMicrosoft() {
  const { Auth } = require("msmc");
  const auth = new Auth("select_account");
  
  // Abre ventana de Microsoft para login
  const xboxManager = await auth.launch("electron");
  const token = await xboxManager.getMinecraft();
  
  return {
    access_token: token.mclc().access_token,
    username: token.profile.name,
    uuid: token.profile.id,
    user_properties: "{}",
    meta: { type: "msa" },
  };
}

module.exports = {
  getDiscordAuthUrl,
  exchangeDiscordCode,
  getDiscordUser,
  loginWithMicrosoft,
};
