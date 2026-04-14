"use client";

import { useTheme } from "./ThemeProvider";
import { useEffect, useState } from "react";
import styled from "styled-components";

const Toggle = styled.button<{ $isDark: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 26px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: background-color 200ms;
  background: ${({ $isDark }) => $isDark ? "#b4b4b4" : "#3d3d3d"};
`;

/* Static icons sit on each side of the track */
const TrackIcon = styled.span<{ $side: "left" | "right" }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ $side }) => $side === "left" ? "left: 6px;" : "right: 6px;"}
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
  user-select: none;
`;

const Knob = styled.span<{ $isDark: boolean }>`
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  transition: transform 200ms;
  transform: ${({ $isDark }) => $isDark ? "translateX(22px)" : "translateX(0)"};
`;

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ width: 48, height: 26 }} />;

  const isDark = theme === "dark";

  return (
    <Toggle onClick={toggle} aria-label="Toggle theme" $isDark={isDark} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      {/* Sun on left (visible in dark mode), Moon on right (visible in light mode) */}
      <TrackIcon $side="left">☀️</TrackIcon>
      <TrackIcon $side="right">🌙</TrackIcon>
      <Knob $isDark={isDark} />
    </Toggle>
  );
}
