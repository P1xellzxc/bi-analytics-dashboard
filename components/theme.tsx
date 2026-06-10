"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline script in layout.tsx applies the saved class before hydration;
  // lazy state initialization reads it back without a post-mount setState.
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.classList.contains("light") ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("light", next === "light");
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Recharts needs concrete color values (SVG attributes can't resolve CSS vars
// reliably), so chart palettes are provided per theme here.
const CHART_PALETTES = {
  dark: {
    primary: "#00c389", // Pantone 3395 C
    secondary: "#418fde", // Pantone 279 C
    tertiary: "#ffb81c", // Pantone 1235 C
    grid: "#333f48",
    axis: "#97999b",
    reference: "#75787b",
    cursorFill: "#ffffff0a",
    tooltip: {
      backgroundColor: "#1d252d",
      border: "1px solid #333f48",
      borderRadius: "8px",
      fontSize: "12px",
      color: "#d9d9d6",
    },
  },
  light: {
    primary: "#007a53", // Pantone 341 C
    secondary: "#0057b8", // Pantone 2935 C
    tertiary: "#ad841f", // Pantone 1255 C
    grid: "#dcdcda",
    axis: "#63666a",
    reference: "#9a9da0",
    cursorFill: "#00000010",
    tooltip: {
      backgroundColor: "#ffffff",
      border: "1px solid #bbbcbc",
      borderRadius: "8px",
      fontSize: "12px",
      color: "#101820",
    },
  },
} as const;

export function useChartColors() {
  const { theme } = useTheme();
  return CHART_PALETTES[theme];
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="px-3 py-1.5 text-sm rounded-lg border border-edge text-ink-muted hover:text-ink hover:border-ink-muted transition-colors cursor-pointer"
      suppressHydrationWarning
    >
      {theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
