"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[42px] h-[24px]" />;

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex-shrink-0 w-[42px] h-[24px] rounded-full transition-colors duration-200 focus:outline-none cursor-pointer"
      style={{ background: isDark ? "var(--app-blue)" : "rgba(0,0,0,0.2)" }}
    >
      <span
        className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full shadow transition-transform duration-200"
        style={{
          background: "#ffffff",
          transform: isDark ? "translateX(18px)" : "translateX(0)",
        }}
      />
    </button>
  );
}
