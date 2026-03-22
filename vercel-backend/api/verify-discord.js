// api/verify-discord.js
// Verifica que el usuario está en tu servidor de Discord
// y tiene el rol necesario para jugar

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") return res.status(405).end();

  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ ok: false, error: "No token" });

  try {
    // 1. Obtener info del usuario
    const userRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await userRes.json();

    // 2. Comprobar que está en tu servidor
    const GUILD_ID = process.env.DISCORD_GUILD_ID; // ID de tu servidor Discord
    const memberRes = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${GUILD_ID}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!memberRes.ok) {
      return res.status(403).json({
        ok: false,
        error: "No estás en el servidor de Discord.",
      });
    }

    const member = await memberRes.json();

    // 3. Opcional: verificar un rol específico
    const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;
    if (REQUIRED_ROLE_ID && !member.roles.includes(REQUIRED_ROLE_ID)) {
      return res.status(403).json({
        ok: false,
        error: "No tienes el rol necesario para acceder.",
      });
    }

    return res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        discriminator: user.discriminator,
      },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Error del servidor" });
  }
}
