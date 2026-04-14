import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";
import styled from "styled-components";

// ── Chip rendered inside the editor ──────────────────────────────────────────

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 500;
  cursor: default;
  user-select: none;
  background: var(--app-blue-bg);
  color: var(--app-blue-text);
  border: 1px solid color-mix(in srgb, var(--app-blue) 25%, transparent);
  white-space: nowrap;
`;

function VariableNodeView({ node }: { node: { attrs: { key: string; label: string } } }) {
  return (
    <NodeViewWrapper as="span" style={{ display: "inline" }}>
      <Chip contentEditable={false} title={node.attrs.label}>
        {node.attrs.key}
      </Chip>
    </NodeViewWrapper>
  );
}

// ── TipTap node definition ────────────────────────────────────────────────────

export const VariableNode = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      key:   { default: null },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-variable": HTMLAttributes.key })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableNodeView as React.ComponentType);
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert HTML with {{key}} tokens → TipTap-compatible HTML with <span data-variable> chips.
 * Used when loading saved HTML into the editor.
 */
export function htmlToTiptap(html: string): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return `<span data-variable="${key}" key="${key}" label=""></span>`;
  });
}

/**
 * Convert TipTap output HTML (with <span data-variable> chips) → {{key}} tokens.
 * Used when serialising the editor content back to storable HTML.
 */
export function tiptapToHtml(html: string): string {
  // Replace chip spans back to {{key}} tokens
  return html.replace(/<span[^>]*data-variable="([^"]+)"[^>]*><\/span>/g, (_, key: string) => {
    return `{{${key}}}`;
  });
}
