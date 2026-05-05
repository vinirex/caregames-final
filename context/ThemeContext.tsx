import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme } from "./theme";
import { useAuth } from "./AuthContext";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof lightTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userEmail } = useAuth();
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const key = userEmail ? `@theme_${userEmail}` : '@theme_default';
        const storedTheme = await AsyncStorage.getItem(key);
        if (storedTheme === "light" || storedTheme === "dark") {
          setTheme(storedTheme);
        } else {
          setTheme("light");
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    };
    loadTheme();
  }, [userEmail]);

  const toggleTheme = useCallback(async () => {
    try {
      setTheme((prev) => {
        const newTheme = prev === "light" ? "dark" : "light";
        const key = userEmail ? `@theme_${userEmail}` : '@theme_default';
        AsyncStorage.setItem(key, newTheme).catch((error) =>
          console.error("Failed to save theme:", error)
        );
        return newTheme;
      });
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    }
  }, [userEmail]);

  const colors = useMemo(
    () => (theme === "dark" ? darkTheme : lightTheme),
    [theme]
  );

  const value = useMemo(
    () => ({ theme, colors, toggleTheme }),
    [theme, colors, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
