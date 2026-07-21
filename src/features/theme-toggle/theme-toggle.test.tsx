// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ThemeToggle from "./ThemeToggle";
import { themeQuery, themeStorageKey } from "./themeStorage";
import { ThemeProvider } from "./useTheme";

type ThemeController = {
  setSystemTheme: (theme: "light" | "dark") => void;
};

type MatchMediaListener = (event: MediaQueryListEvent) => void;

const reactActFlag = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActFlag.IS_REACT_ACT_ENVIRONMENT = true;

const installMatchMedia = (initialTheme: "light" | "dark" = "light"): ThemeController => {
  let matches = initialTheme === "dark";
  const listeners = new Set<MatchMediaListener>();

  const matchMedia = vi.fn((query: string) => {
    const mediaQueryList = {
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (event: string, listener: MatchMediaListener) => {
        if (event === "change") {
          listeners.add(listener);
        }
      },
      removeEventListener: (event: string, listener: MatchMediaListener) => {
        if (event === "change") {
          listeners.delete(listener);
        }
      },
      addListener: (listener: MatchMediaListener) => listeners.add(listener),
      removeListener: (listener: MatchMediaListener) => listeners.delete(listener),
      dispatchEvent: () => true,
    };

    return mediaQueryList as unknown as MediaQueryList;
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: matchMedia,
  });

  return {
    setSystemTheme: (theme) => {
      matches = theme === "dark";
      const event = { matches, media: themeQuery } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
};

const renderThemeToggle = async (element: ReactElement = <ThemeToggle />) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(<ThemeProvider>{element}</ThemeProvider>);
  });

  return {
    button: host.querySelector("button") as HTMLButtonElement,
    host,
    root,
  };
};

const cleanupRoot = async (root: Root, host: HTMLElement) => {
  await act(async () => {
    root.unmount();
  });
  host.remove();
};

describe("theme toggle", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme-preference");
    document.documentElement.removeAttribute("style");
    document.head.innerHTML = '<meta name="theme-color" content="#f4f7fb" />';
    document.body.innerHTML = "";
    window.localStorage.clear();
    installMatchMedia("light");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("uses the system theme when no preference is saved", async () => {
    installMatchMedia("dark");
    const { button, host, root } = await renderThemeToggle();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme-preference")).toBe("system");
    expect(button.getAttribute("aria-label")).toBe("Включить светлую тему");

    await cleanupRoot(root, host);
  });

  it("restores saved light and dark preferences", async () => {
    window.localStorage.setItem(themeStorageKey, "light");
    installMatchMedia("dark");
    let rendered = await renderThemeToggle();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(rendered.button.getAttribute("aria-label")).toBe("Включить тёмную тему");
    await cleanupRoot(rendered.root, rendered.host);

    window.localStorage.setItem(themeStorageKey, "dark");
    installMatchMedia("light");
    rendered = await renderThemeToggle();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(rendered.button.getAttribute("aria-label")).toBe("Включить светлую тему");
    await cleanupRoot(rendered.root, rendered.host);
  });

  it("switches the theme, stores the preference and updates aria-label", async () => {
    installMatchMedia("dark");
    const { button, host, root } = await renderThemeToggle();

    await act(async () => {
      button.click();
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(themeStorageKey)).toBe("light");
    expect(button.getAttribute("aria-label")).toBe("Включить тёмную тему");
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute("content")).toBe("#f4f7fb");
    expect(host.textContent).toContain("Включена светлая тема");

    await cleanupRoot(root, host);
  });

  it("follows system changes only while preference is system", async () => {
    const controller = installMatchMedia("dark");
    const { button, host, root } = await renderThemeToggle();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await act(async () => {
      controller.setSystemTheme("light");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await act(async () => {
      button.click();
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem(themeStorageKey)).toBe("dark");

    await act(async () => {
      controller.setSystemTheme("light");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    await cleanupRoot(root, host);
  });

  it("is a keyboard-focusable button with an accessible title", async () => {
    const { button, host, root } = await renderThemeToggle();

    button.focus();

    expect(document.activeElement).toBe(button);
    expect(button.type).toBe("button");
    expect(button.title).toBe("Включить тёмную тему");

    await cleanupRoot(root, host);
  });

  it("keeps the no-flash theme script before React rendering", () => {
    const indexHtml = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const scriptIndex = indexHtml.indexOf(themeStorageKey);
    const rootIndex = indexHtml.indexOf('<div id="root">');
    const reactEntryIndex = indexHtml.indexOf("/src/main.tsx");

    expect(scriptIndex).toBeGreaterThan(-1);
    expect(scriptIndex).toBeLessThan(rootIndex);
    expect(scriptIndex).toBeLessThan(reactEntryIndex);
    expect(indexHtml).toContain('root.setAttribute("data-theme", theme)');
    expect(indexHtml).toContain("prefers-color-scheme: dark");
  });

  it("keeps mobile and chat placements from overlapping the fixed controls", () => {
    const toggleCss = readFileSync(resolve(process.cwd(), "src/features/theme-toggle/ThemeToggle.css"), "utf8");
    const chatSource = readFileSync(resolve(process.cwd(), "src/components/ChatWidget/ChatWidget.tsx"), "utf8");
    const headerSource = readFileSync(resolve(process.cwd(), "src/components/Header/Header.tsx"), "utf8");

    expect(toggleCss).toContain("bottom: calc(112px + env(safe-area-inset-bottom))");
    expect(toggleCss).toContain("body.is-chat-open .theme-toggle-wrap--floating");
    expect(toggleCss).toContain("@media (max-width: 760px)");
    expect(toggleCss).toContain(".theme-toggle-wrap--floating");
    expect(toggleCss).toContain("display: none");
    expect(headerSource).toContain('<ThemeToggle variant="menu" />');
    expect(chatSource).toContain('<ThemeToggle variant="chat" />');
  });
});
