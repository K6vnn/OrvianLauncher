import { useState, useEffect } from "react";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import "./App.css";

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function checkSession() {
      const discordUser = await window.electron.store.get("discord_user");
      const mcAuth = await window.electron.store.get("minecraft_auth");

      if (discordUser && mcAuth) {
        setUser({ discord: discordUser, mc: mcAuth });
        setScreen("home");
      } else {
        setScreen("login");
      }
    }
    checkSession();
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    setScreen("home");
  }

  async function handleLogout() {
    await window.electron.store.delete("discord_user");
    await window.electron.store.delete("minecraft_auth");
    setUser(null);
    setScreen("login");
  }

  return (
    <div className="app">
      {/* Barra de título custom */}
      <TitleBar />

      {screen === "loading" && <LoadingScreen />}
      {screen === "login" && <LoginScreen onLogin={handleLogin} />}
      {screen === "home" && <HomeScreen user={user} onLogout={handleLogout} />}
    </div>
  );
}

function TitleBar() {
  return (
    <div className="titlebar">
      <span className="titlebar-title">⚡ Zyren Launcher</span>
      <div className="titlebar-buttons">
        <button onClick={() => window.electron.minimize()}>─</button>
        <button onClick={() => window.electron.close()}>✕</button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="screen center">
      <div className="spinner" />
      <p>Cargando...</p>
    </div>
  );
}
