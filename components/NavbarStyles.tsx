"use client";

import styled from "styled-components";
import Link from "next/link";

export const NavHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  height: 52px;
  background: var(--app-surface);
  border-bottom: 0.5px solid var(--app-border);
`;

export const NavInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

export const NavBrand = styled(Link)`
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-1);
  text-decoration: none;
`;

export const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;
