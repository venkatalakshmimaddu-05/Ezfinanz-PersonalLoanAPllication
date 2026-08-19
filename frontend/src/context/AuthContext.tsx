import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<void>;
  loginWithGoogleSimulated: (email: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const cachedUser = localStorage.getItem("user");
    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
      // Refresh from server in the background to catch stale role/verification flags.
      api
        .get("/auth/me")
        .then(({ data }) => {
          setUser(data);
          localStorage.setItem("user", JSON.stringify(data));
        })
        .catch(() => {
          /* token invalid; interceptor will handle redirect on next call */
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  function persistSession(data: { user: User; accessToken: string; refreshToken: string }) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data);
  }

  async function signup(name: string, email: string, phone: string, password: string) {
    const { data } = await api.post("/auth/signup", { name, email, phone, password });
    persistSession(data);
  }

  async function loginWithGoogleSimulated(email: string, name: string) {
    const { data } = await api.post("/auth/google", { email, name });
    persistSession(data);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogleSimulated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
