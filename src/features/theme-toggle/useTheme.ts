import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  applyThemeToDocument,
  getInitialThemeState,
  getSystemTheme,
  resolveTheme,
  themeQuery,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeStorage";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getInitialThemeState().preference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getInitialThemeState().systemTheme);
  const resolvedTheme = resolveTheme(preference, systemTheme);

  useLayoutEffect(() => {
    applyThemeToDocument(resolvedTheme, preference);
  }, [preference, resolvedTheme]);

  useEffect(() => {
    if (!window.matchMedia) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(themeQuery);
    const updateSystemTheme = () => setSystemTheme(getSystemTheme(mediaQuery));

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
    writeThemePreference(nextPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setPreference]);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
      toggleTheme,
    }),
    [preference, resolvedTheme, setPreference, toggleTheme],
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};
