"use client";

import { useState } from "react";
import { Extension } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Placeholder from "@tiptap/extension-placeholder";
import styled, { createGlobalStyle } from "styled-components";
import { VariableNode } from "./VariableNode";
import { TEMPLATE_VARIABLES } from "@/lib/utils/contract-template";

// ── FontSize extension ────────────────────────────────────────────────────────

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize:   (size: string) => ReturnType;
      unsetFontSize: ()             => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types as string[],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
          renderHTML: (attrs) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize:   (size: string) => ({ chain }) => chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize: ()             => ({ chain }) => chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ── TabIndent extension ─────────────────────────────────────────────────────
// Priority 98 → runs after StarterKit (100). If StarterKit already handled Tab
// (e.g. inside a list item) it returns true and our handler is never reached.
// Otherwise we insert 4 non-breaking spaces, which never collapse in HTML.

const TabIndent = Extension.create({
  name: "tabIndent",
  priority: 98,
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        this.editor.commands.insertContent("\u00a0\u00a0\u00a0\u00a0");
        return true;
      },
    };
  },
});

// ── Global editor prose styles ────────────────────────────────────────────────

const EditorGlobal = createGlobalStyle`
  .ProseMirror {
    outline: none;
    min-height: 520px;
    padding: 24px 28px;
    font-size: 14px;
    line-height: 1.7;
    color: var(--app-text-1);

    h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center; }
    h2 { font-size: 17px; font-weight: 600; margin: 20px 0 6px; }
    h3 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    p  { margin: 0 0 10px; }
    ul, ol { padding-left: 22px; margin: 0 0 10px; }
    li { margin-bottom: 4px; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    u  { text-decoration: underline; }

    p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      float: left;
      color: var(--app-text-3);
      pointer-events: none;
      height: 0;
    }
  }
`;

// ── Styled components ─────────────────────────────────────────────────────────

const Wrap = styled.div`
  border: 0.5px solid var(--app-border);
  border-radius: 0 0 12px 12px;
  background: var(--app-surface);
  overflow: hidden;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px 10px;
  border-bottom: 0.5px solid var(--app-border);
  background: var(--app-surface-2);
`;

const ToolBtn = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  background: ${(p) => p.$active ? "var(--app-blue-bg)" : "transparent"};
  color: ${(p) => p.$active ? "var(--app-blue-text)" : "var(--app-text-2)"};
  transition: background 0.12s, color 0.12s;
  &:hover { background: var(--app-surface); color: var(--app-text-1); }
`;

const ToolSelect = styled.select`
  height: 28px;
  padding: 0 6px;
  border-radius: 6px;
  border: 0.5px solid var(--app-border-md);
  background: var(--app-surface);
  color: var(--app-text-1);
  font-size: 12px;
  cursor: pointer;
  outline: none;
`;

const ToolDivider = styled.div`
  width: 1px;
  height: 20px;
  background: var(--app-border);
  margin: 0 4px;
  flex-shrink: 0;
`;

const VarDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const VarMenuBtn = styled.button`
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  border: 0.5px solid var(--app-blue);
  background: var(--app-blue-bg);
  color: var(--app-blue-text);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
`;

const VarMenu = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border-md);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 6px;
  min-width: 260px;
  max-height: 320px;
  overflow-y: auto;
`;

const VarMenuItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: transparent;
  text-align: left;
  &:hover { background: var(--app-surface-2); }
`;

const VarMenuKey = styled.span`
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 500;
  color: var(--app-blue);
  white-space: nowrap;
`;

const VarMenuLabel = styled.span`
  font-size: 11px;
  color: var(--app-text-3);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  content: string; // TipTap-compatible HTML (chips already converted)
  onChange: (html: string) => void;
}

export default function RichEditor({ content, onChange }: Props) {
  const [varMenuOpen, setVarMenuOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Underline,
      TextStyle,
      FontSize,
      TabIndent,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your contract here…" }),
      VariableNode,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  function insertVariable(key: string, label: string) {
    editor?.chain().focus().insertContent({ type: "variable", attrs: { key, label } }).run();
    setVarMenuOpen(false);
  }

  if (!editor) return null;

  return (
    <>
      <EditorGlobal />
      <Wrap>
        <Toolbar>
          {/* Heading select */}
          <ToolSelect
            value={
              editor.isActive("heading", { level: 1 }) ? "h1"
              : editor.isActive("heading", { level: 2 }) ? "h2"
              : editor.isActive("heading", { level: 3 }) ? "h3"
              : "p"
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "p") editor.chain().focus().setParagraph().run();
              else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1|2|3 }).run();
            }}
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </ToolSelect>

          {/* Font size select */}
          <ToolSelect
            value={editor.getAttributes("textStyle").fontSize ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetFontSize().run();
              else editor.chain().focus().setFontSize(v).run();
            }}
            style={{ minWidth: 62 }}
          >
            <option value="">Size</option>
            {[9,10,11,12,13,14,15,16,18,20,22,24,28,32,36].map((s) => (
              <option key={s} value={`${s}px`}>{s}</option>
            ))}
          </ToolSelect>

          <ToolDivider />

          {/* Inline marks */}
          <ToolBtn title="Bold" $active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>B</ToolBtn>
          <ToolBtn title="Italic" $active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} style={{ fontStyle: "italic" }}>I</ToolBtn>
          <ToolBtn title="Underline" $active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} style={{ textDecoration: "underline" }}>U</ToolBtn>

          <ToolDivider />

          {/* Text align */}
          <ToolBtn title="Align left"   $active={editor.isActive({ textAlign: "left" })}    onClick={() => editor.chain().focus().setTextAlign("left").run()}>≡</ToolBtn>
          <ToolBtn title="Align center" $active={editor.isActive({ textAlign: "center" })}  onClick={() => editor.chain().focus().setTextAlign("center").run()}>≡</ToolBtn>
          <ToolBtn title="Align right"  $active={editor.isActive({ textAlign: "right" })}   onClick={() => editor.chain().focus().setTextAlign("right").run()}>≡</ToolBtn>

          <ToolDivider />

          {/* Lists */}
          <ToolBtn title="Bullet list"  $active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}>•—</ToolBtn>
          <ToolBtn title="Ordered list" $active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolBtn>

          <ToolDivider />

          {/* Undo / Redo */}
          <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>↩</ToolBtn>
          <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>↪</ToolBtn>

          <ToolDivider />

          {/* Variable inserter */}
          <VarDropdown>
            <VarMenuBtn onClick={() => setVarMenuOpen((o) => !o)}>
              + Insert variable
            </VarMenuBtn>
            {varMenuOpen && (
              <>
                {/* Backdrop */}
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setVarMenuOpen(false)} />
                <VarMenu>
                  {TEMPLATE_VARIABLES.map(({ key, label }) => (
                    <VarMenuItem key={key} onClick={() => insertVariable(key, label)}>
                      <VarMenuKey>{`{{${key}}}`}</VarMenuKey>
                      <VarMenuLabel>{label}</VarMenuLabel>
                    </VarMenuItem>
                  ))}
                </VarMenu>
              </>
            )}
          </VarDropdown>
        </Toolbar>

        <EditorContent editor={editor} />
      </Wrap>
    </>
  );
}
