import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, login, register, logout } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const u = await getCurrentUser();
    setUser(u);
    setLoading(false);
    return u;
  }

  useEffect(() => {
    refresh();
  }, []);

  const value = {
    user,
    loading,
    async signIn(email, password) {
      await login(email, password);
      return refresh();
    },
    async signUp(email, password, name) {
      await register(email, password, name);
      return refresh();
    },
    async signOut() {
      await logout();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
