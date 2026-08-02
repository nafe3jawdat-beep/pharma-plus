import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

export function createEcho(token) {
  try {
    return new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY,
      wsHost: import.meta.env.VITE_REVERB_HOST,
      wsPort: Number(import.meta.env.VITE_REVERB_PORT),
      forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
      enabledTransports: ['ws'],
      authEndpoint: `${import.meta.env.VITE_API_URL}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
  } catch {
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
