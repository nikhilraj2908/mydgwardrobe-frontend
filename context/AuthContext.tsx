import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;
  authInProgress: boolean;
  profileCompleted: boolean | null;
  login: (
    token: string,
    refreshToken: string,
    profileCompleted: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
  setAuthInProgress: (v: boolean) => void;
  updateProfileCompleted: (completed: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
        const storedProfileCompleted = await AsyncStorage.getItem("profileCompleted");

        if (storedToken) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);
          setProfileCompleted(storedProfileCompleted === "true");
        } else {
          setToken(null);
          setRefreshToken(null);
          setProfileCompleted(null);
        }
      } catch (error) {
        console.error("Error loading auth data:", error);
      } finally {
        setHydrated(true);
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (
    jwt: string,
    newRefreshToken: string,
    completed: boolean
  ) => {
    await AsyncStorage.setItem("token", jwt);
    await AsyncStorage.setItem("refreshToken", newRefreshToken);
    await AsyncStorage.setItem("profileCompleted", completed ? "true" : "false");

    setToken(jwt);
    setRefreshToken(newRefreshToken);
    setProfileCompleted(completed);
    setAuthInProgress(false);
  };

  const updateProfileCompleted = async (completed: boolean) => {
    await AsyncStorage.setItem("profileCompleted", completed ? "true" : "false");
    setProfileCompleted(completed);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("profileCompleted");

    setToken(null);
    setRefreshToken(null);
    setProfileCompleted(null);

    router.replace("/(auth)/welcome");
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("refreshToken");
    await AsyncStorage.removeItem("profileCompleted");

    setToken(null);
    setRefreshToken(null);
    setProfileCompleted(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        isAuthenticated: !!token,
        isLoading,
        hydrated,
        authInProgress,
        profileCompleted,
        login,
        logout,
        clearAuth,
        setAuthInProgress,
        updateProfileCompleted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};