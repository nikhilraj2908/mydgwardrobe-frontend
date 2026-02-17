import React, { createContext, useContext, useState } from "react";
import { theme as defaultTheme } from "./theme";

type ThemeType = typeof defaultTheme;

const ThemeContext = createContext({
  theme: defaultTheme,
  setTheme: (t: ThemeType) => {}
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState(defaultTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
