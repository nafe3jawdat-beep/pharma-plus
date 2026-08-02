import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { createEcho, destroyEcho } from "../services/echo";

const EchoContext = createContext(null);

export function EchoProvider({ children }) {
  const { token } = useAuth();
  const [echo, setEcho] = useState(null);

  useEffect(() => {
    let instance = null;
    if (token) {
      instance = createEcho(token);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEcho(instance);
    return () => {
      if (instance) destroyEcho(instance);
    };
  }, [token]);

  return (
    <EchoContext.Provider value={{ echo, ready: !!echo }}>
      {children}
    </EchoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEcho() {
  const ctx = useContext(EchoContext);
  if (!ctx) throw new Error("useEcho must be used within EchoProvider");
  return ctx;
}
