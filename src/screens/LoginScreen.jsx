import { useState } from "react";

// ─── Pasos del login ───────────────────────────────────────────
// 1. Login con Discord (verifica que está en tu servidor)
// 2. Login con Microsoft/Minecraft

export default function LoginScreen({ onLogin }) {
  const [step, setStep] = useState("discord"); // "discord" | "minecraft"
  const [discordUser, setDiscordUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── Discord OAuth ───────────────────────────────────────────
  async function handleDiscordLogin() {
    setLoading(true);
    setError("");
    try {
      // Abre el navegador con la URL de Discord OAuth
      // El resultado llega via deep link o un servidor local
      // Por simplicidad aquí simulamos el flujo, en producción
      // necesitas un servidor local que capture el callback
      window.electron.openExternal(
        `https://discord.com/api/oauth2/authorize?client_id=TU_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A4839%2Fdiscord%2Fcallback&response_type=code&scope=identify`
      );
      // TODO: escuchar el deep link / servidor local con el code
      // Ejemplo simplificado:
      alert("Inicia sesión en el navegador y vuelve aquí.");
      // En prod: usar un servidor HTTP local que capture ?code=...
    } catch (e) {
      setError("Error al conectar con Discord: " + e.message);
    }
    setLoading(false);
  }

  // ─── Microsoft / Minecraft ───────────────────────────────────
  async function handleMinecraftLogin() {
    setLoading(true);
    setError("");
    try {
      // Llama al proceso principal que usa msmc
      // (esto se añadiría como ipcMain.handle en main.js)
      alert("Función de login con Microsoft - conecta con msmc en main.js");
      // Ejemplo de lo que guardarías:
      // await window.electron.store.set("minecraft_auth", authData);
      // onLogin({ discord: discordUser, mc: authData });
    } catch (e) {
      setError("Error al iniciar sesión con Microsoft: " + e.message);
    }
    setLoading(false);
  }

  return (
    <div className="screen login-screen">
      <div className="login-card">
        <div className="login-logo">⚡</div>
        <h1>Zyren Launcher</h1>
        <p className="login-subtitle">Inicia sesión para jugar</p>

        {step === "discord" && (
          <>
            <p className="step-label">Paso 1: Conecta tu Discord</p>
            <button
              className="btn btn-discord"
              onClick={handleDiscordLogin}
              disabled={loading}
            >
              {loading ? "Conectando..." : "🎮 Iniciar sesión con Discord"}
            </button>

            {/* Botón para simular en dev */}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDiscordUser({ username: "TestUser", id: "123" });
                setStep("minecraft");
              }}
            >
              [DEV] Saltar Discord
            </button>
          </>
        )}

        {step === "minecraft" && (
          <>
            <p className="step-label">
              ✅ Discord conectado como{" "}
              <strong>{discordUser?.username}</strong>
            </p>
            <p className="step-label">Paso 2: Conecta tu cuenta de Minecraft</p>
            <button
              className="btn btn-minecraft"
              onClick={handleMinecraftLogin}
              disabled={loading}
            >
              {loading ? "Conectando..." : "⛏️ Iniciar sesión con Microsoft"}
            </button>

            {/* Botón para simular en dev */}
            <button
              className="btn btn-secondary"
              onClick={() => {
                const fakeMc = { username: "Steve", uuid: "abc-123" };
                window.electron.store.set("discord_user", discordUser);
                window.electron.store.set("minecraft_auth", fakeMc);
                onLogin({ discord: discordUser, mc: fakeMc });
              }}
            >
              [DEV] Saltar Minecraft
            </button>
          </>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
