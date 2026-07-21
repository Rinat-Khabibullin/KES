export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemePreference, "system">;

export const themeStorageKey = "elektrika-tuapse-theme-preference";
export const themeAttribute = "data-theme";
export const themePreferenceAttribute = "data-theme-preference";
export const themeQuery = "(prefers-color-scheme: dark)";

const themeColors: Record<ResolvedTheme, string> = {
  light: "#f4f7fb",
  dark: "#0b0f14",
};

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

const getBrowserStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
};

export const readThemePreference = (storage: Pick<Storage, "getItem"> | undefined = getBrowserStorage()) => {
  if (!storage) {
    return null;
  }

  try {
    const value = storage.getItem(themeStorageKey);
    return isThemePreference(value) ? value : null;
  } catch {
    return null;
  }
};

export const writeThemePreference = (
  preference: ThemePreference,
  storage: Pick<Storage, "setItem"> | undefined = getBrowserStorage(),
) => {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(themeStorageKey, preference);
  } catch {
    // Browsers can block storage in private modes. The applied theme still works for the session.
  }
};

export const getSystemTheme = (matcher?: Pick<MediaQueryList, "matches"> | null): ResolvedTheme => {
  if (matcher) {
    return matcher.matches ? "dark" : "light";
  }

  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }

  return window.matchMedia(themeQuery).matches ? "dark" : "light";
};

export const resolveTheme = (preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme =>
  preference === "system" ? systemTheme : preference;

export const getInitialThemeState = () => {
  const stored = typeof window === "undefined" ? null : readThemePreference();
  const preference: ThemePreference = stored ?? "system";
  const systemTheme = getSystemTheme();

  return {
    preference,
    resolvedTheme: resolveTheme(preference, systemTheme),
    systemTheme,
  };
};

export const updateThemeColorMeta = (theme: ResolvedTheme, documentRef: Document = document) => {
  const meta = documentRef.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (meta) {
    meta.content = themeColors[theme];
  }
};

export const applyThemeToDocument = (
  theme: ResolvedTheme,
  preference: ThemePreference,
  documentRef: Document = document,
) => {
  const root = documentRef.documentElement;
  root.setAttribute(themeAttribute, theme);
  root.setAttribute(themePreferenceAttribute, preference);
  root.style.colorScheme = theme;
  updateThemeColorMeta(theme, documentRef);
};
