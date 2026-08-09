import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

function bindConnectionLogs(echoInstance) {
  const conn = echoInstance?.connector?.pusher?.connection;
  if (!conn) return;
  conn.bind("connected", () => {
    console.log(`[WS] connected (socket: ${conn.socket_id ?? "unknown"})`);
  });
  conn.bind("disconnected", () => console.log("[WS] disconnected"));
  conn.bind("error", (e) => console.error("[WS] connection error", e));
}

export function createEcho(token) {
  try {
    const instance = new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT),
      wssPort: Number(import.meta.env.VITE_REVERB_PORT),
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: '/broadcasting/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    bindConnectionLogs(instance);
    return instance;
  } catch (err) {
    console.error("[WS] createEcho failed", err);
    const noopChannel = { listen: () => noopChannel, notification: () => noopChannel };
    return {
      private: () => noopChannel,
      leave: () => {},
      disconnect: () => {},
    };
  }
}

export function destroyEcho(echoInstance) {
  if (echoInstance && echoInstance.disconnect) {
    try { echoInstance.disconnect(); } catch { /* ignore */ }
  }
}
