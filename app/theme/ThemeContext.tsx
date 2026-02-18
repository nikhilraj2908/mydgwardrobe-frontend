import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme, darkTheme, blueTheme } from "./theme";

type ThemeType = typeof theme;

const THEME_MAP: Record<string, ThemeType> = {
  light: theme,
  dark: darkTheme,
  purple: theme,   // your default purple theme
  blue: blueTheme,
};

const ThemeContext = createContext({
  theme: theme,
  setThemeById: async (id: string) => {},
  currentId: "purple",
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeState, setThemeState] = useState(theme);
  const [currentId, setCurrentId] = useState("purple");

  // 🔹 Load saved theme on app start
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const saved = await AsyncStorage.getItem("APP_THEME");

    if (saved && THEME_MAP[saved]) {
      setThemeState(THEME_MAP[saved]);
      setCurrentId(saved);
    }
  };

  // 🔹 Change theme + persist it
  const setThemeById = async (id: string) => {
    const selected = THEME_MAP[id];
    if (!selected) return;

    setThemeState(selected);
    setCurrentId(id);
    await AsyncStorage.setItem("APP_THEME", id);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themeState,
        setThemeById,
        currentId,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
