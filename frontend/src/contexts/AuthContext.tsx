import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiService, removeToken } from "../services/api";

export type UserProfile = {
  id?: number;
  name: string;
  phone: string;
  email: string;
  registeredAt: string;
};

type AuthState = {
  user: UserProfile | null;
  login: (user: UserProfile, token?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isBackendConnected: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_KEY = "chap-roshan-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // لود اولیه پروفایل از بک‌اند در صورت وجود توکن
  useEffect(() => {
    async function initializeAuth() {
      const savedToken = localStorage.getItem("chap-roshan-token");
      
      if (savedToken) {
        try {
          // تلاش برای دریافت پروفایل واقعی از بک‌اند جنگو
          const backendProfile = await apiService.getProfile();
          setUser({
            id: backendProfile.id,
            name: backendProfile.name,
            phone: backendProfile.phone,
            email: backendProfile.email,
            registeredAt: backendProfile.registeredAt,
          });
          setIsBackendConnected(true);
        } catch (error: any) {
          console.warn("Django backend offline or token invalid. Falling back to local storage.", error.message);
          
          // اگر خطای شبکه بود یا سرور خاموش بود، از بک‌آپ لوکال استفاده کن
          fallbackToLocalStorage();
        }
      } else {
        fallbackToLocalStorage();
      }
      setLoading(false);
    }

    function fallbackToLocalStorage() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved) as UserProfile);
        }
      } catch {
        setUser(null);
      }
      setIsBackendConnected(false);
    }

    initializeAuth();
  }, []);

  // ذخیره اطلاعات در لوکال استوریج فقط به عنوان نسخه پشتیبان محلی
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (profile: UserProfile, token?: string) => {
    setUser(profile);
    if (token) {
      localStorage.setItem("chap-roshan-token", token);
      setIsBackendConnected(true);
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    setIsBackendConnected(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: user !== null, isBackendConnected }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
