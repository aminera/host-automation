"use client";

import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { TEMPLATE_VARIABLES } from "@/lib/utils/contract-template";

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  templateId:       string | null;
  initialName:      string;
  initialHtml:      string;
  initialIsDefault: boolean;
};

type Tab = "html" | "preview" | "upload";

// ── Sample data for the live preview ─────────────────────────────────────────

const SAMPLE: Record<string, string> = {
  contract_number:     "CTR-PREVIEW-001",
  generated_at:        new Date().toLocaleDateString("en-GB"),
  host_name:           "John Host",
  property_name:       "Beach Villa",
  property_address:    "12 Ocean Drive, Marbella, Spain",
  check_in:            "22 Apr 2026",
  check_out:           "29 Apr 2026",
  guest_name:          "Jane Guest",
  guest_email:         "jane.guest@example.com",
  guest_phone_row:     `<div class="row"><span class="label">Phone:</span><span class="value">+34 600 123 456</span></div>`,
  document_type_row:   `<div class="row"><span class="label">Document Type:</span><span class="value">Passport</span></div>`,
  document_number_row: `<div class="row"><span class="label">Document Number:</span><span class="value">AB123456</span></div>`,
  signature_block:     `<div class="sig-line"></div>`,
};

function quickRender(html: string): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k: string) => SAMPLE[k] ?? `{{${k}}}`);
}

// ── Styled components ─────────────────────────────────────────────────────────

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const PageWrap = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 32px;
`;

const BreadNav = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 24px;
  color: var(--app-text-3);
`;

const BreadLink = styled(Link)`
  color: var(--app-text-2);
  &:hover { text-decoration: underline; }
`;

const ErrorBanner = styled.div`
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--app-red-bg);
  color: var(--app-red-text);
  border: 0.5px solid var(--app-red-text);
`;

const ErrorDismiss = styled.button`
  margin-left: 12px;
  font-size: 12px;
  text-decoration: underline;
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 270px;
  gap: 24px;
  align-items: start;
`;

const LeftCol = styled.div`
  min-width: 0;
  overflow: hidden;
`;

const NameInput = styled.input`
  width: 100%;
  font-size: 18px;
  font-weight: 500;
  background: transparent;
  outline: none;
  border: none;
  border-bottom: 0.5px solid var(--app-border-md);
  padding-bottom: 8px;
  margin-bottom: 20px;
  color: var(--app-text-1);
  &::placeholder { color: var(--app-text-3); }
`;

const TabBar = styled.div`
  border-radius: 12px 12px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 0;
  background: var(--app-surface-2);
  border-top: 0.5px solid var(--app-border);
  border-left: 0.5px solid var(--app-border);
  border-right: 0.5px solid var(--app-border);
`;

const TabBtn = styled.button<{ $active: boolean }>`
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px 6px 0 0;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  text-transform: capitalize;
  background: ${(p) => p.$active ? "var(--app-surface)" : "transparent"};
  color: ${(p) => p.$active ? "var(--app-text-1)" : "var(--app-text-3)"};
  border-bottom: ${(p) => p.$active ? "2px solid var(--app-blue)" : "2px solid transparent"};
`;

const TabCharCount = styled.span`
  margin-left: auto;
  font-size: 11px;
  padding-right: 4px;
  color: var(--app-text-3);
`;

const TabPanel = styled.div`
  border: 0.5px solid var(--app-border);
  border-top: none;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
`;

const HtmlTextarea = styled.textarea`
  display: block;
  resize: none;
  padding: 16px;
  font-size: 12px;
  line-height: 1.625;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  min-height: 560px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--app-surface);
  color: var(--app-text-1);
  tab-size: 2;
  border: none;
`;

const PreviewInfoBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 11px;
  background: var(--app-surface-2);
  border-bottom: 0.5px solid var(--app-border);
  color: var(--app-text-3);
`;

const UploadBody = styled.div`
  padding: 24px;
  background: var(--app-surface);
`;

const DropZone = styled.div<{ $dragging: boolean }>`
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  border: 1.5px dashed ${(p) => p.$dragging ? "var(--app-blue)" : "var(--app-border-md)"};
  background: ${(p) => p.$dragging ? "var(--app-blue-bg)" : "var(--app-surface-2)"};
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const DropIconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border-md);
`;

const SpinIcon = styled.svg`
  animation: ${spin} 0.8s linear infinite;
  color: var(--app-blue);
`;

const DropTitle = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const DropHint = styled.p`
  font-size: 12px;
  margin-top: 4px;
  color: var(--app-text-3);
`;

const ImportErrorMsg = styled.div`
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 13px;
  background: var(--app-red-bg);
  color: var(--app-red-text);
`;

const ImportHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const ImportHeaderTitle = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const ImportCancelBtn = styled.button`
  font-size: 12px;
  color: var(--app-text-3);
  background: none;
  border: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const ImportPreviewWrap = styled.div`
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  border: 0.5px solid var(--app-border);
`;

const ImportPreviewBar = styled.div`
  padding: 6px 12px;
  font-size: 11px;
  background: var(--app-surface-2);
  border-bottom: 0.5px solid var(--app-border);
  color: var(--app-text-3);
`;

const ImportWarning = styled.div`
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 12px;
  background: var(--app-amber-bg);
  color: var(--app-amber-text);
`;

const ImportActions = styled.div`
  display: flex;
  gap: 8px;
`;

const UseContentBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-blue);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
`;

const DiscardBtn = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-surface-2);
  color: var(--app-text-1);
  border: 0.5px solid var(--app-border-md);
  cursor: pointer;
`;

const FormatGrid = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const FormatCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 8px;
  padding: 14px;
  background: var(--app-surface-2);
  border: 0.5px solid var(--app-border);
`;

const FormatIcon = styled.span<{ $ok: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
  background: ${(p) => p.$ok ? "var(--app-blue-bg)" : "var(--app-surface-2)"};
  color: ${(p) => p.$ok ? "var(--app-blue-text)" : "var(--app-text-3)"};
`;

const FormatTitle = styled.p`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const FormatNote = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

// Sidebar
const Sidebar = styled.div`
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SidebarCard = styled.div`
  padding: 16px;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
`;

const SidebarSectionLabel = styled.p`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  color: var(--app-text-3);
`;

const SidebarSubLabel = styled.p`
  font-size: 11px;
  margin-bottom: 12px;
  color: var(--app-text-2);
`;

const DefaultCheckLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
`;

const DefaultCheckbox = styled.input`
  margin-top: 2px;
  cursor: pointer;
  accent-color: var(--app-blue);
`;

const DefaultCheckTitle = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const DefaultCheckNote = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const VarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const VarBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  background: var(--app-surface-2);
  border: 0.5px solid var(--app-border);
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
`;

const VarKey = styled.span`
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  flex-shrink: 0;
  color: var(--app-blue);
`;

const VarLabel = styled.span`
  font-size: 10px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text-3);
`;

const ActionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SaveBtn = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-blue);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const PreviewPdfBtn = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-surface);
  color: var(--app-text-1);
  border: 0.5px solid var(--app-border-md);
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const DeleteTemplateBtn = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
  background: var(--app-red-bg);
  color: var(--app-red-text);
  border: 0.5px solid var(--app-red-text);
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function TemplateEditor({
  templateId,
  initialName,
  initialHtml,
  initialIsDefault,
}: Props) {
  const router  = useRouter();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name,       setName]       = useState(initialName);
  const [html,       setHtml]       = useState(initialHtml);
  const [isDefault,  setIsDefault]  = useState(initialIsDefault);
  const [tab,        setTab]        = useState<Tab>("html");
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [importHtml,  setImportHtml]  = useState<string | null>(null);
  const [importing,   setImporting]   = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragging,    setDragging]    = useState(false);

  const previewSrcDoc = useMemo(() => quickRender(html), [html]);

  function insertVariable(key: string) {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end   = area.selectionEnd;
    const token = `{{${key}}}`;
    setHtml(html.slice(0, start) + token + html.slice(end));
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSave() {
    if (!name.trim()) { setError("Template name is required."); return; }
    setError(null);
    setSaving(true);
    try {
      const isNew = templateId === null;
      const res   = await fetch(
        isNew ? "/api/templates" : `/api/templates/${templateId}`,
        {
          method:  isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ name, html, isDefault }),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const saved = await res.json();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
      if (isNew) router.replace(`/templates/${saved.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreviewPdf() {
    setPreviewing(true);
    try {
      const id  = templateId ?? "new";
      const res = await fetch(`/api/templates/${id}/preview`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ html }),
      });
      if (!res.ok) throw new Error("Preview generation failed");
      window.open(URL.createObjectURL(await res.blob()), "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleDelete() {
    if (!templateId || !confirm("Delete this template? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      router.push("/contracts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  async function handleImportFile(file: File) {
    setImportError(null);
    setImportHtml(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "docx") {
      setImportError("Only .docx files are supported. Please export your contract to Word format first.");
      return;
    }

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const mammoth     = (await import("mammoth")).default;
      const result      = await mammoth.convertToHtml({ arrayBuffer });
      setImportHtml(result.value);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function applyImport() {
    if (!importHtml) return;
    setHtml(importHtml);
    setImportHtml(null);
    setTab("html");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
  }

  return (
    <PageWrap>

      {/* Breadcrumb */}
      <BreadNav>
        <BreadLink href="/contracts">Contracts</BreadLink>
        <span>/</span>
        <span style={{ color: "var(--app-text-1)" }}>
          {templateId ? "Edit template" : "New template"}
        </span>
      </BreadNav>

      {/* Error banner */}
      {error && (
        <ErrorBanner>
          {error}
          <ErrorDismiss onClick={() => setError(null)}>Dismiss</ErrorDismiss>
        </ErrorBanner>
      )}

      <TwoColGrid>

        {/* ── Left: editor ─────────────────────────────────────────────── */}
        <LeftCol>

          {/* Template name */}
          <NameInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
          />

          {/* Tab bar */}
          <TabBar>
            {(["html", "preview", "upload"] as Tab[]).map((t) => (
              <TabBtn key={t} $active={tab === t} onClick={() => setTab(t)}>
                {t === "html" ? "HTML" : t === "preview" ? "Live preview" : "Import file"}
              </TabBtn>
            ))}
            <TabCharCount>{html.length.toLocaleString()} chars</TabCharCount>
          </TabBar>

          {/* ── HTML tab ── */}
          {tab === "html" && (
            <TabPanel>
              <HtmlTextarea
                ref={areaRef}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                spellCheck={false}
              />
            </TabPanel>
          )}

          {/* ── Preview tab ── */}
          {tab === "preview" && (
            <TabPanel>
              <PreviewInfoBar>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M6 5.5v3M6 4h.01" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
                Rendered with sample data — switch to HTML tab to edit
              </PreviewInfoBar>
              <iframe
                srcDoc={previewSrcDoc}
                sandbox="allow-same-origin"
                style={{ height: 560, border: "none", background: "#fff", width: "100%", display: "block" }}
                title="Template preview"
              />
            </TabPanel>
          )}

          {/* ── Upload / Import tab ── */}
          {tab === "upload" && (
            <TabPanel>
              <UploadBody>

                {/* Drop zone */}
                {!importHtml && (
                  <DropZone
                    $dragging={dragging}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                  >
                    <HiddenFileInput
                      ref={fileRef}
                      type="file"
                      accept=".docx"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportFile(f); }}
                    />
                    <DropIconBox>
                      {importing ? (
                        <SpinIcon width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="10"/>
                        </SpinIcon>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: "var(--app-text-2)" }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </DropIconBox>
                    <div>
                      <DropTitle>{importing ? "Processing…" : "Drop your .docx file here"}</DropTitle>
                      <DropHint>or click to browse · Word documents (.docx)</DropHint>
                    </div>
                  </DropZone>
                )}

                {/* Import error */}
                {importError && <ImportErrorMsg>{importError}</ImportErrorMsg>}

                {/* Extracted HTML preview */}
                {importHtml && (
                  <div>
                    <ImportHeaderRow>
                      <ImportHeaderTitle>Document imported — review below</ImportHeaderTitle>
                      <ImportCancelBtn onClick={() => { setImportHtml(null); setImportError(null); }}>
                        Cancel
                      </ImportCancelBtn>
                    </ImportHeaderRow>

                    <ImportPreviewWrap>
                      <ImportPreviewBar>Extracted HTML preview</ImportPreviewBar>
                      <iframe
                        srcDoc={importHtml}
                        sandbox="allow-same-origin"
                        style={{ height: 300, border: "none", background: "#fff", width: "100%", display: "block" }}
                        title="Imported content preview"
                      />
                    </ImportPreviewWrap>

                    <ImportWarning>
                      This will replace your current template HTML. You can then add{" "}
                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{"{{variable}}"}</span>{" "}
                      tokens from the sidebar to make it dynamic.
                    </ImportWarning>

                    <ImportActions>
                      <UseContentBtn onClick={applyImport}>Use this content</UseContentBtn>
                      <DiscardBtn onClick={() => { setImportHtml(null); setImportError(null); }}>Discard</DiscardBtn>
                    </ImportActions>
                  </div>
                )}

                {/* Format note */}
                {!importHtml && !importing && (
                  <FormatGrid>
                    {[
                      { icon: "W", label: ".docx", note: "Supported — converted to HTML automatically", ok: true },
                      { icon: "P", label: ".pdf",  note: "Not supported — export to .docx first", ok: false },
                    ].map(({ icon, label, note, ok }) => (
                      <FormatCard key={label}>
                        <FormatIcon $ok={ok}>{icon}</FormatIcon>
                        <div>
                          <FormatTitle>{label}</FormatTitle>
                          <FormatNote>{note}</FormatNote>
                        </div>
                      </FormatCard>
                    ))}
                  </FormatGrid>
                )}
              </UploadBody>
            </TabPanel>
          )}
        </LeftCol>

        {/* ── Right: sidebar ───────────────────────────────────────────── */}
        <Sidebar>

          {/* Settings */}
          <SidebarCard>
            <SidebarSectionLabel>Settings</SidebarSectionLabel>
            <DefaultCheckLabel>
              <DefaultCheckbox
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <div>
                <DefaultCheckTitle>Set as default</DefaultCheckTitle>
                <DefaultCheckNote>Used when generating new contracts</DefaultCheckNote>
              </div>
            </DefaultCheckLabel>
          </SidebarCard>

          {/* Variables reference */}
          <SidebarCard>
            <SidebarSectionLabel>Available variables</SidebarSectionLabel>
            <SidebarSubLabel>Click to insert at cursor in HTML tab</SidebarSubLabel>
            <VarList>
              {TEMPLATE_VARIABLES.map(({ key, label }) => (
                <VarBtn
                  key={key}
                  onClick={() => { setTab("html"); insertVariable(key); }}
                  title={label}
                >
                  <VarKey>{`{{${key}}}`}</VarKey>
                  <VarLabel>{label}</VarLabel>
                </VarBtn>
              ))}
            </VarList>
          </SidebarCard>

          {/* Actions */}
          <ActionList>
            <SaveBtn onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : savedFlash ? "Saved ✓" : "Save changes"}
            </SaveBtn>

            <PreviewPdfBtn onClick={handlePreviewPdf} disabled={previewing}>
              {previewing ? "Generating…" : "Export preview PDF"}
            </PreviewPdfBtn>

            {templateId && !initialIsDefault && (
              <DeleteTemplateBtn onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete template"}
              </DeleteTemplateBtn>
            )}
          </ActionList>
        </Sidebar>
      </TwoColGrid>
    </PageWrap>
  );
}
