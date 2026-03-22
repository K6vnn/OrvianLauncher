import { useState, useEffect } from "react";

export default function HomeScreen({ user, onLogout }) {
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  const [logs, setLogs] = useState([]);
  const [phase, setPhase] = useState("idle"); // "idle" | "installing" | "launching" | "playing"

  // ─── Cargar estado inicial ───────────────────────────────────
  useEffect(() => {
    async function load() {
      const s = await window.electron.launcher.getStatus();
      setStatus(s);
    }
    load();

    // Escuchar progreso de instalación / launch
    window.electron.onProgress((data) => {
      setProgress(data);
      if (data.done) {
        setPhase("idle");
        load(); // recargar estado
      }
    });

    window.electron.onLaunchLog((msg) => {
      setLogs((prev) => [...prev.slice(-49), msg]); // máximo 50 líneas
    });

    return () => {
      window.electron.removeAllListeners("install-progress");
      window.electron.removeAllListeners("launch-log");
    };
  }, []);

  // ─── Instalar modpack ────────────────────────────────────────
  async function handleInstall() {
    setPhase("installing");
    setProgress({ stage: "Iniciando...", percent: 0 });
    const result = await window.electron.launcher.install();
    if (!result.ok) {
      alert("Error: " + result.error);
      setPhase("idle");
    }
  }

  // ─── Lanzar Minecraft ────────────────────────────────────────
  async function handleLaunch() {
    setPhase("launching");
    const result = await window.electron.launcher.launch();
    if (!result.ok) {
      alert("Error al lanzar: " + result.error);
      setPhase("idle");
    } else {
      setPhase("playing");
    }
  }

  const isInstalled = status?.installed;
  const isLoggedIn = status?.loggedIn;

  return (
    <div className="screen home-screen">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="user-card">
          <div className="user-avatar">
            {user?.discord?.avatar
              ? <img
                  src={`https://cdn.discordapp.com/avatars/${user.discord.id}/${user.discord.avatar}.png`}
                  alt="avatar"
                />
              : <span>👤</span>}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.mc?.username || "Jugador"}</p>
            <p className="user-discord">@{user?.discord?.username || "discord"}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">🏠 Inicio</button>
          <button className="nav-item">⚙️ Ajustes</button>
          <button className="nav-item" onClick={onLogout}>🚪 Cerrar sesión</button>
        </nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Banner */}
        <div className="banner">
          <h2>Modpack Zyren</h2>
          <p>
            {status?.manifest
              ? `MC ${status.manifest.mcVersion} · ${status.manifest.mods?.length || 0} mods`
              : "No instalado"}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="action-area">
          {!isInstalled && phase === "idle" && (
            <button className="btn btn-primary btn-large" onClick={handleInstall}>
              ⬇️ Instalar modpack
            </button>
          )}

          {isInstalled && phase === "idle" && (
            <button className="btn btn-play btn-large" onClick={handleLaunch}>
              ▶ JUGAR
            </button>
          )}

          {phase === "installing" && (
            <button className="btn btn-primary btn-large" disabled>
              Instalando...
            </button>
          )}

          {phase === "launching" && (
            <button className="btn btn-play btn-large" disabled>
              Lanzando...
            </button>
          )}

          {phase === "playing" && (
            <button className="btn btn-green btn-large" disabled>
              🎮 Jugando
            </button>
          )}
        </div>

        {/* Barra de progreso */}
        {progress && phase !== "idle" && (
          <div className="progress-area">
            <p className="progress-label">{progress.stage}</p>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="progress-percent">{progress.percent}%</span>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="log-box">
            {logs.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
