"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import styled, { css } from "styled-components";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
type Size = "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";

const variantStyles: Record<Variant, ReturnType<typeof css>> = {
  default: css`
    background: var(--primary, oklch(0.205 0 0));
    color: var(--primary-foreground, oklch(0.985 0 0));
  `,
  outline: css`
    border-color: var(--border, oklch(0.922 0 0));
    background: var(--background, #fff);
    &:hover { background: var(--muted, oklch(0.97 0 0)); color: var(--foreground, oklch(0.145 0 0)); }
  `,
  secondary: css`
    background: var(--secondary, oklch(0.97 0 0));
    color: var(--secondary-foreground, oklch(0.205 0 0));
    &:hover { background: oklch(0.92 0 0); }
  `,
  ghost: css`
    background: transparent;
    &:hover { background: var(--muted, oklch(0.97 0 0)); color: var(--foreground, oklch(0.145 0 0)); }
  `,
  destructive: css`
    background: oklch(0.577 0.245 27.325 / 10%);
    color: oklch(0.577 0.245 27.325);
    &:hover { background: oklch(0.577 0.245 27.325 / 20%); }
  `,
  link: css`
    color: var(--primary, oklch(0.205 0 0));
    text-decoration: underline;
    text-underline-offset: 4px;
    background: transparent;
  `,
};

const sizeStyles: Record<Size, ReturnType<typeof css>> = {
  default: css`height: 2rem; gap: 0.375rem; padding: 0 0.625rem;`,
  xs:      css`height: 1.5rem; gap: 0.25rem; border-radius: 10px; padding: 0 0.5rem; font-size: 0.75rem;`,
  sm:      css`height: 1.75rem; gap: 0.25rem; border-radius: 12px; padding: 0 0.625rem; font-size: 0.8rem;`,
  lg:      css`height: 2.25rem; gap: 0.375rem; padding: 0 0.625rem;`,
  icon:         css`width: 2rem; height: 2rem; padding: 0;`,
  "icon-xs":    css`width: 1.5rem; height: 1.5rem; border-radius: 10px; padding: 0;`,
  "icon-sm":    css`width: 1.75rem; height: 1.75rem; border-radius: 12px; padding: 0;`,
  "icon-lg":    css`width: 2.25rem; height: 2.25rem; padding: 0;`,
};

const StyledButton = styled(ButtonPrimitive)<{ $variant: Variant; $size: Size }>`
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, color 0.15s, opacity 0.15s;

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  svg {
    pointer-events: none;
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
  }

  ${({ $variant }) => variantStyles[$variant]}
  ${({ $size }) => sizeStyles[$size]}
`;

export interface ButtonProps extends ButtonPrimitive.Props {
  variant?: Variant;
  size?: Size;
}

function Button({ variant = "default", size = "default", ...props }: ButtonProps) {
  return (
    <StyledButton
      data-slot="button"
      $variant={variant}
      $size={size}
      {...props}
    />
  );
}

export { Button };

