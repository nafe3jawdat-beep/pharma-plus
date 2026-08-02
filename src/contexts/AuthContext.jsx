import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role") || "pharmacist");
  const [pendingTwoFactor, setPendingTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("role", role);
    } else {
      localStorage.removeItem("role");
    }
  }, [role]);

  const login = useCallback((userData, authToken, userRole) => {
    setUser(userData);
    setToken(authToken);
    setRole(userRole || "pharmacist");
    setPendingTwoFactor(false);
    setTwoFactorToken(null);
    setPendingRole(null);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
    localStorage.setItem("role", userRole || "pharmacist");
  }, []);

  const requireTwoFactor = useCallback((tfaToken, userRole) => {
    setPendingTwoFactor(true);
    setTwoFactorToken(tfaToken);
    setPendingRole(userRole);
  }, []);

  const completeTwoFactor = useCallback(async (code) => {
    const res = await api("POST", `/api/v1/${pendingRole}/two-factor/verify`, {
      body: { two_factor_token: twoFactorToken, code },
    });
    const authToken = res.data.token;
    let userData = res.data.user || res.data.doctor || res.data.company;
    if (!userData) {
      login({ role: pendingRole }, authToken, pendingRole);
      return res;
    }
    login(userData, authToken, pendingRole);
    return res;
  }, [pendingRole, twoFactorToken, login]);

  const clearPendingTwoFactor = useCallback(() => {
    setPendingTwoFactor(false);
    setTwoFactorToken(null);
    setPendingRole(null);
  }, []);

  const logout = useCallback(async () => {
    const endpoint = role === "company" ? "/api/v1/company/logout" : role === "admin" ? "/api/v1/admin/logout" : "/api/v1/pharmacist/logout";
    try { await api("POST", endpoint); } catch { /* ignore */ }
    setUser(null);
    setToken(null);
    setRole("pharmacist");
    setPendingTwoFactor(false);
    setTwoFactorToken(null);
    setPendingRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
  }, [role]);

  const contextValue = useMemo(() => ({
    user, token, role, login, logout, isAuthenticated: !!token,
    pendingTwoFactor, twoFactorToken, pendingRole,
    requireTwoFactor, completeTwoFactor, clearPendingTwoFactor,
  }), [user, token, role, pendingTwoFactor, twoFactorToken, pendingRole,
       login, logout, requireTwoFactor, completeTwoFactor, clearPendingTwoFactor]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
