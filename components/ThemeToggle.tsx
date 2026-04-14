"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import styled from "styled-components";

const Toggle = styled.button<{ $isDark: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 24px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: background-color 200ms;
  background: ${({ $isDark }) => $isDark ? "var(--app-blue)" : "rgba(0,0,0,0.2)"};
`;

const Knob = styled.span<{ $isDark: boolean }>`
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  transition: transform 200ms;
  transform: ${({ $isDark }) => $isDark ? "translateX(18px)" : "translateX(0)"};
`;

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: 42, height: 24 }} />;

  const isDark = theme === "dark";

  return (
    <Toggle onClick={toggle} aria-label="Toggle theme" $isDark={isDark}>
      <Knob $isDark={isDark} />
    </Toggle>
  );
}
