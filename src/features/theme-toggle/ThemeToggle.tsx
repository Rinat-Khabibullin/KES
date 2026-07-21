import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./useTheme";
import "./ThemeToggle.css";

type ThemeToggleProps = {
  variant?: "floating" | "menu" | "chat";
};

const themeNames = {
  light: "светлая",
  dark: "тёмная",
} as const;

function ThemeToggle({ variant = "floating" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [announcement, setAnnouncement] = useState("");
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const label = resolvedTheme === "dark" ? "Включить светлую тему" : "Включить тёмную тему";
  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  const handleClick = () => {
    toggleTheme();
    setAnnouncement(`Включена ${themeNames[nextTheme]} тема`);
  };

  return (
    <div className={`theme-toggle-wrap theme-toggle-wrap--${variant}`}>
      <button
        className={`theme-toggle theme-toggle--${variant}`}
        type="button"
        aria-label={label}
        aria-pressed={resolvedTheme === "dark"}
        title={label}
        onClick={handleClick}
      >
        <span className="theme-toggle__orb" aria-hidden="true">
          <Icon size={20} strokeWidth={2.2} />
        </span>
        {variant === "menu" ? <span className="theme-toggle__menu-text">{label}</span> : null}
        <span className="visually-hidden">{label}</span>
      </button>
      <span className="theme-toggle__status visually-hidden" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}

export default ThemeToggle;
