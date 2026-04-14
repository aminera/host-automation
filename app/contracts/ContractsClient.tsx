"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";

// ── Types ────────────────────────────────────────────────────────────────────

export type ContractRow = {
  reservationId:  string;
  propertyName:   string;
  guestName:      string;
  checkInDate:    string;
  checkOutDate:   string;
  contractId:     string | null;
  contractNumber: string | null;
  status:         "signed" | "sent" | "draft" | "none";
  pdfUrl:         string | null;
  generatedAt:    string | null;
  signedAt:       string | null;
};

export type TemplateRow = {
  id:        string;
  name:      string;
  html:      string;
  isDefault: boolean;
  updatedAt: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
  signed: { label: "Signed",             bg: "var(--app-green-bg)",  color: "var(--app-green-text)" },
  sent:   { label: "Awaiting signature", bg: "var(--app-blue-bg)",   color: "var(--app-blue-text)"  },
  draft:  { label: "Draft",              bg: "var(--app-surface-2)", color: "var(--app-text-3)"     },
  none:   { label: "Not generated",      bg: "var(--app-surface-2)", color: "var(--app-text-3)"     },
};

const PAGE_SIZE = 20;
type PillKey = "" | "signed" | "sent" | "none";
const PILLS: { value: PillKey; label: string }[] = [
  { value: "",       label: "All"                },
  { value: "signed", label: "Signed"             },
  { value: "sent",   label: "Awaiting signature" },
  { value: "none",   label: "Not generated"      },
];

// ── Styled components ────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.75rem 2rem;
`;

const PageHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const PageSubtitle = styled.p`
  font-size: 12px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const PrimaryLink = styled(Link)`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-blue);
  color: #ffffff;
  text-decoration: none;
  white-space: nowrap;
  &:hover { opacity: 0.9; }
`;

const AlertStrip = styled.div`
  background: var(--app-amber-bg);
  border: 0.5px solid #FAC775;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`;

const AlertHeaderRow = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--app-amber-text);
`;

const AlertDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--app-amber-text);
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 8px;
  padding: 10px 14px;
  flex-wrap: wrap;
  background: var(--app-surface);
  border: 0.5px solid #FAC775;
`;

const AlertLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const AlertTag = styled.span<{ $urgent?: boolean }>`
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ $urgent }) => $urgent ? "var(--app-red-bg)"   : "var(--app-amber-bg)"};
  color:      ${({ $urgent }) => $urgent ? "var(--app-red-text)" : "var(--app-amber-text)"};
`;

const AlertInfo = styled.div`
  min-width: 0;
`;

const AlertName = styled.p`
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text-1);
`;

const AlertSub = styled.p`
  font-size: 11px;
  color: var(--app-text-2);
`;

const AlertAction = styled(Link)`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  color: var(--app-blue);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  @media (max-width: 640px) { grid-template-columns: repeat(2, 1fr); }
`;

const StatCard = styled.div`
  background: var(--app-surface-2);
  border-radius: 8px;
  padding: 14px 16px;
`;

const StatLabel = styled.p`
  font-size: 11px;
  margin-bottom: 6px;
  color: var(--app-text-2);
`;

const StatValue = styled.p<{ $green?: boolean; $amber?: boolean; $red?: boolean }>`
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 4px;
  color: ${({ $green, $amber, $red }) =>
    $green ? "var(--app-green-text)" :
    $amber  ? "var(--app-amber-text)" :
    $red    ? "var(--app-red-text)"   :
              "var(--app-text-1)"};
`;

const StatSub = styled.p`
  font-size: 11px;
  color: var(--app-text-3);
`;

const SectionCard = styled.div<{ $mb?: boolean }>`
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  ${({ $mb }) => $mb && "margin-bottom: 1.25rem;"}
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 0.5px solid var(--app-border);
`;

const SectionTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const SectionCount = styled.span`
  font-size: 12px;
  color: var(--app-text-3);
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  flex-wrap: wrap;
  border-bottom: 0.5px solid var(--app-border);
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 160px;
`;

const SearchIconSvg = styled.svg`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--app-text-3);
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: var(--app-surface-2);
  border: 0.5px solid var(--app-border-md);
  color: var(--app-text-1);
  border-radius: 8px;
  font-size: 13px;
  padding: 7px 10px 7px 30px;
  outline: none;
`;

const FilterSelect = styled.select`
  background: var(--app-surface-2);
  border: 0.5px solid var(--app-border-md);
  color: var(--app-text-1);
  border-radius: 8px;
  font-size: 13px;
  padding: 7px 10px;
  outline: none;
`;

const PillRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  flex-wrap: wrap;
  border-bottom: 0.5px solid var(--app-border);
`;

const Pill = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  background: ${({ $active }) => $active ? "var(--app-blue)"  : "var(--app-surface)"};
  color:      ${({ $active }) => $active ? "#ffffff"          : "var(--app-text-2)"};
  border:     0.5px solid ${({ $active }) => $active ? "var(--app-blue)" : "var(--app-border-md)"};
`;

const PillCount = styled.span`
  font-size: 10px;
  opacity: 0.75;
  margin-left: 3px;
`;

const DesktopSection = styled.div`
  display: none;
  overflow-x: auto;
  @media (min-width: 640px) { display: block; }
`;

const MobileSection = styled.div`
  display: block;
  @media (min-width: 640px) { display: none; }
`;

const TableEl = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 560px;
`;

const THeadEl = styled.thead`
  background: var(--app-surface-2);
  border-bottom: 0.5px solid var(--app-border);
`;

const ThEl = styled.th<{ $w?: string; $hideBelow?: number }>`
  padding: 10px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: var(--app-text-2);
  width: ${({ $w }) => $w ?? "auto"};
  ${({ $hideBelow }) => $hideBelow && css`@media (max-width: ${$hideBelow}px) { display: none; }`}
`;

const TdEl = styled.td<{ $hideBelow?: number; $right?: boolean }>`
  padding: 12px;
  font-size: 13px;
  color: var(--app-text-1);
  text-align: ${({ $right }) => $right ? "right" : "left"};
  ${({ $hideBelow }) => $hideBelow && css`@media (max-width: ${$hideBelow}px) { display: none; }`}
`;

const BadgeSpan = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

const TplBadge = styled.span<{ $default?: boolean }>`
  padding: 3px 9px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ $default }) => $default ? "var(--app-blue-bg)"   : "var(--app-surface-2)"};
  color:      ${({ $default }) => $default ? "var(--app-blue-text)" : "var(--app-text-2)"};
`;

const MobileCardWrap = styled.div<{ $last: boolean }>`
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: ${({ $last }) => $last ? "none" : "0.5px solid var(--app-border)"};
  &:hover { background: var(--app-surface-2); }
`;

const MobileCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const MobileCardInfo = styled.div`
  min-width: 0;
`;

const MobileCardName = styled.p`
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text-1);
`;

const MobileCardGuest = styled.p`
  font-size: 12px;
  margin-top: 2px;
  color: var(--app-text-2);
`;

const MobileCardBadges = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
`;

const MobileCardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--app-text-3);
`;

const SectionFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-top: 0.5px solid var(--app-border);
`;

const FooterCount = styled.span`
  font-size: 12px;
  color: var(--app-text-3);
`;

const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageBtnEl = styled.button<{ $active?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  background: ${({ $active }) => $active ? "var(--app-blue)"  : "var(--app-surface)"};
  color:      ${({ $active }) => $active ? "#ffffff"          : "var(--app-text-2)"};
  border:     0.5px solid ${({ $active }) => $active ? "var(--app-blue)" : "var(--app-border-md)"};
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const EmptyWrap = styled.div`
  padding: 3rem 1.25rem;
  text-align: center;
`;

const EmptyIconBox = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  background: var(--app-surface-2);
  color: var(--app-text-3);
`;

const EmptyTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--app-text-1);
`;

const EmptySubtitle = styled.p`
  font-size: 13px;
  margin-bottom: 1rem;
  color: var(--app-text-2);
`;

const ClearFiltersBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border-md);
  color: var(--app-text-1);
  cursor: pointer;
  &:hover { background: var(--app-surface-2); }
`;

const ManageLink = styled(Link)`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--app-blue);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border-bottom: 0.5px solid var(--app-border);
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const TemplateCard = styled.div<{ $rightBorder?: boolean; $bottomBorder?: boolean }>`
  padding: 1rem 1.25rem;
  border-right:  ${({ $rightBorder })  => $rightBorder  ? "0.5px solid var(--app-border)" : "none"};
  border-bottom: ${({ $bottomBorder }) => $bottomBorder ? "0.5px solid var(--app-border)" : "none"};
`;

const TplCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 4px;
`;

const TplName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const TplMeta = styled.p`
  font-size: 11px;
  margin-bottom: 12px;
  color: var(--app-text-3);
`;

const TplVarsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
`;

const VarChip = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  background: var(--app-surface-2);
  color: var(--app-text-2);
`;

const TplActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditLinkEl = styled(Link)<{ $primary?: boolean }>`
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s;
  ${({ $primary }) => $primary
    ? css`background: var(--app-blue); color: #ffffff;`
    : css`background: var(--app-surface); color: var(--app-text-1); border: 0.5px solid var(--app-border-md);`}
`;

const PreviewBtnEl = styled.button`
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  background: var(--app-surface);
  color: var(--app-text-1);
  border: 0.5px solid var(--app-border-md);
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const AddTemplateLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 1rem 1.25rem;
  text-decoration: none;
  transition: background 0.15s;
  &:hover { background: var(--app-surface-2); }
`;

const AddIconBox = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  border: 0.5px dashed var(--app-border-md);
  color: var(--app-text-3);
`;

const AddText = styled.span`
  font-size: 13px;
  color: var(--app-text-2);
`;

const ActionA = styled.a`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--app-blue);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ContractRow["status"] }) {
  const m = STATUS_META[status];
  return <BadgeSpan $bg={m.bg} $color={m.color}>{m.label}</BadgeSpan>;
}

function TemplatePreviewBtn({ templateId, html }: { templateId: string; html: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/preview`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ html }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } finally {
      setLoading(false);
    }
  }
  return (
    <PreviewBtnEl onClick={handleClick} disabled={loading}>
      {loading ? "…" : "Preview"}
    </PreviewBtnEl>
  );
}

function ActionLink({ row }: { row: ContractRow }) {
  if (row.status === "signed" && row.pdfUrl) {
    return <ActionA href={row.pdfUrl} target="_blank" rel="noreferrer">Download</ActionA>;
  }
  if (row.status === "sent") {
    return <ManageLink href={`/reservations/${row.reservationId}`}>Resend</ManageLink>;
  }
  if (row.status === "none") {
    return <ManageLink href={`/reservations/${row.reservationId}`}>Generate</ManageLink>;
  }
  return <ManageLink href={`/reservations/${row.reservationId}`}>View</ManageLink>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ContractsClient({
  rows,
  templates,
}: {
  rows:      ContractRow[];
  templates: TemplateRow[];
}) {
  const router = useRouter();
  const now    = useMemo(() => new Date(), []);

  const [search,     setSearch]     = useState("");
  const [propFilter, setPropFilter] = useState("");
  const [pill,       setPill]       = useState<PillKey>("");
  const [page,       setPage]       = useState(1);

  const propOptions = useMemo(
    () => [...new Set(rows.map((r) => r.propertyName))].sort(),
    [rows]
  );

  const stats = useMemo(() => {
    const contracts = rows.filter((r) => r.status !== "none");
    return {
      total:    contracts.length,
      signed:   contracts.filter((r) => r.status === "signed").length,
      awaiting: contracts.filter((r) => r.status === "sent").length,
      missing:  rows.filter((r) => r.status === "none").length,
    };
  }, [rows]);

  const pillCounts = useMemo(() => ({
    "":     rows.length,
    signed: rows.filter((r) => r.status === "signed").length,
    sent:   rows.filter((r) => r.status === "sent").length,
    none:   rows.filter((r) => r.status === "none").length,
  }), [rows]);

  const alerts = useMemo(() => {
    const urgent = rows
      .filter((r) => r.status === "sent" && daysUntil(r.checkInDate) <= 3)
      .map((r) => ({
        type:   "urgent" as const,
        label:  daysUntil(r.checkInDate) <= 1 ? "Check-in tomorrow" : `Check-in in ${daysUntil(r.checkInDate)} days`,
        name:   `${r.guestName} · ${r.propertyName}`,
        sub:    `Contract sent but not signed · Check-in ${fmtShort(r.checkInDate)}`,
        action: "Resend link →",
        href:   `/reservations/${r.reservationId}`,
      }));
    const missing = rows
      .filter((r) => r.status === "none")
      .map((r) => ({
        type:   "missing" as const,
        label:  "Not generated",
        name:   `${r.guestName} · ${r.propertyName}`,
        sub:    `Guest form submitted · No contract yet`,
        action: "Generate →",
        href:   `/reservations/${r.reservationId}`,
      }));
    return [...urgent, ...missing].slice(0, 5);
  }, [rows]);

  const filtered = useMemo(() => {
    let data = rows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) => r.guestName.toLowerCase().includes(q) || r.propertyName.toLowerCase().includes(q)
      );
    }
    if (propFilter) data = data.filter((r) => r.propertyName === propFilter);
    if (pill)       data = data.filter((r) => r.status === pill);
    return data;
  }, [rows, search, propFilter, pill]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyFilter(fn: () => void) { fn(); setPage(1); }
  function resetFilters() { setSearch(""); setPropFilter(""); setPill(""); setPage(1); }

  const emptyState = (
    <EmptyWrap>
      <EmptyIconBox>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" opacity="0.4"/>
          <path d="M7 11h8M7 7.5h5M7 14.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
        </svg>
      </EmptyIconBox>
      <EmptyTitle>No contracts found</EmptyTitle>
      <EmptySubtitle>Try adjusting your search or filters</EmptySubtitle>
      <ClearFiltersBtn onClick={resetFilters}>Clear filters</ClearFiltersBtn>
    </EmptyWrap>
  );

  return (
    <PageWrap>

      {/* Page header */}
      <PageHeaderRow>
        <div>
          <PageTitle>Contracts</PageTitle>
          <PageSubtitle>
            All properties · {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </PageSubtitle>
        </div>
        <PrimaryLink href="/reservations">+ New contract</PrimaryLink>
      </PageHeaderRow>

      {/* Alert strip */}
      {alerts.length > 0 && (
        <AlertStrip>
          <AlertHeaderRow>
            <AlertDot />
            {alerts.length} contract{alerts.length > 1 ? "s" : ""} need your attention
          </AlertHeaderRow>
          <AlertList>
            {alerts.map((a, i) => (
              <AlertItem key={i}>
                <AlertLeft>
                  <AlertTag $urgent={a.type === "urgent"}>{a.label}</AlertTag>
                  <AlertInfo>
                    <AlertName>{a.name}</AlertName>
                    <AlertSub>{a.sub}</AlertSub>
                  </AlertInfo>
                </AlertLeft>
                <AlertAction href={a.href}>{a.action}</AlertAction>
              </AlertItem>
            ))}
          </AlertList>
        </AlertStrip>
      )}

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <StatLabel>Total contracts</StatLabel>
          <StatValue>{stats.total}</StatValue>
          <StatSub>All time</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Signed</StatLabel>
          <StatValue $green={stats.signed > 0}>{stats.signed}</StatValue>
          <StatSub>{stats.total > 0 ? Math.round(stats.signed / stats.total * 100) : 0}% completion</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Awaiting signature</StatLabel>
          <StatValue $amber={stats.awaiting > 0}>{stats.awaiting}</StatValue>
          <StatSub>Sent, not signed</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Not generated</StatLabel>
          <StatValue $red={stats.missing > 0}>{stats.missing}</StatValue>
          <StatSub>Action required</StatSub>
        </StatCard>
      </StatsGrid>

      {/* Contracts table */}
      <SectionCard $mb>

        <Toolbar>
          <SearchWrap>
            <SearchIconSvg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </SearchIconSvg>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => applyFilter(() => setSearch(e.target.value))}
              placeholder="Search guest or property…"
              aria-label="Search"
            />
          </SearchWrap>
          <FilterSelect
            value={propFilter}
            onChange={(e) => applyFilter(() => setPropFilter(e.target.value))}
            aria-label="Property"
          >
            <option value="">All properties</option>

            {propOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </FilterSelect>
        </Toolbar>

        <PillRow>
          {PILLS.map(({ value, label }) => {
            const isActive = pill === value;
            const count    = pillCounts[value];
            return (
              <Pill key={value} $active={isActive} onClick={() => applyFilter(() => setPill(value))}>
                {label}<PillCount>{count}</PillCount>
              </Pill>
            );
          })}
        </PillRow>

        <DesktopSection>
          {paginated.length === 0 ? emptyState : (
            <TableEl>
              <THeadEl>
                <tr>
                  <ThEl $w="21%">Property</ThEl>
                  <ThEl $w="14%">Guest</ThEl>
                  <ThEl $w="17%">Stay dates</ThEl>
                  <ThEl $w="13%" $hideBelow={900}>Generated</ThEl>
                  <ThEl $w="17%">Status</ThEl>
                  <ThEl $w="13%" $hideBelow={720}>Signed on</ThEl>
                  <ThEl $w="9%"> </ThEl>
                </tr>
              </THeadEl>
              <tbody>
                {paginated.map((r, idx) => (
                  <tr
                    key={r.contractId ?? r.reservationId}
                    className="res-table-row"
                    style={{
                      cursor: "pointer",
                      borderBottom: idx < paginated.length - 1 ? "0.5px solid var(--app-border)" : "none",
                    }}
                    onClick={() => router.push(`/reservations/${r.reservationId}`)}
                  >
                    <TdEl style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {r.propertyName}
                    </TdEl>
                    <TdEl style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.guestName}
                    </TdEl>
                    <TdEl style={{ whiteSpace: "nowrap", color: "var(--app-text-2)" }}>
                      {fmtShort(r.checkInDate)} – {fmtShort(r.checkOutDate)}
                    </TdEl>
                    <TdEl $hideBelow={900} style={{ whiteSpace: "nowrap", color: "var(--app-text-3)", fontSize: 12 }}>
                      {r.generatedAt ? fmtShort(r.generatedAt) : "—"}
                    </TdEl>
                    <TdEl><StatusBadge status={r.status} /></TdEl>
                    <TdEl $hideBelow={720} style={{ whiteSpace: "nowrap", color: "var(--app-text-3)", fontSize: 12 }}>
                      {r.signedAt ? fmtDateTime(r.signedAt) : "—"}
                    </TdEl>
                    <TdEl $right onClick={(e) => e.stopPropagation()}>
                      <ActionLink row={r} />
                    </TdEl>
                  </tr>
                ))}
              </tbody>
            </TableEl>
          )}
        </DesktopSection>

        <MobileSection>
          {paginated.length === 0 ? emptyState : (
            paginated.map((r, idx) => (
              <MobileCardWrap
                key={r.contractId ?? r.reservationId}
                $last={idx === paginated.length - 1}
                className="res-mobile-card"
                onClick={() => router.push(`/reservations/${r.reservationId}`)}
              >
                <MobileCardTop>
                  <MobileCardInfo>
                    <MobileCardName>{r.propertyName}</MobileCardName>
                    <MobileCardGuest>{r.guestName}</MobileCardGuest>
                  </MobileCardInfo>
                  <span onClick={(e) => e.stopPropagation()}>
                    <ActionLink row={r} />
                  </span>
                </MobileCardTop>
                <MobileCardBadges>
                  <StatusBadge status={r.status} />
                </MobileCardBadges>
                <MobileCardFooter>
                  <span>{fmtShort(r.checkInDate)} – {fmtShort(r.checkOutDate)}</span>
                  <span>{r.signedAt ? `Signed ${fmtShort(r.signedAt)}` : "Not signed"}</span>
                </MobileCardFooter>
              </MobileCardWrap>
            ))
          )}
        </MobileSection>

        {filtered.length > 0 && (
          <SectionFooter>
            <FooterCount>
              Showing {paginated.length} of {filtered.length} contract{filtered.length !== 1 ? "s" : ""}
            </FooterCount>
            {totalPages > 1 && (
              <PaginationRow>
                <PageBtnEl disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous">‹</PageBtnEl>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PageBtnEl key={p} $active={p === page} onClick={() => setPage(p)}>{p}</PageBtnEl>
                ))}
                <PageBtnEl disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Next">›</PageBtnEl>
              </PaginationRow>
            )}
          </SectionFooter>
        )}
      </SectionCard>

      {/* Templates section */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>Contract templates</SectionTitle>
          <SectionCount>{templates.length} template{templates.length !== 1 ? "s" : ""}</SectionCount>
        </SectionHeader>

        {templates.length > 0 && (
          <TemplatesGrid>
            {templates.map((tpl, i) => {
              const vars = [...new Set(
                [...tpl.html.matchAll(/\{\{(\w+)\}\}/g)].map((m) => `{{${m[1]}}}`)
              )];
              return (
                <TemplateCard
                  key={tpl.id}
                  $rightBorder={i % 2 === 0 && i < templates.length - 1}
                  $bottomBorder={i < templates.length - 2}
                >
                  <TplCardHeader>
                    <TplName>{tpl.name}</TplName>
                    <TplBadge $default={tpl.isDefault}>{tpl.isDefault ? "Default" : "Custom"}</TplBadge>
                  </TplCardHeader>
                  <TplMeta>Last edited {fmtShort(tpl.updatedAt)}</TplMeta>
                  <TplVarsRow>
                    {vars.slice(0, 6).map((v) => <VarChip key={v}>{v}</VarChip>)}
                    {vars.length > 6 && (
                      <VarChip style={{ color: "var(--app-text-3)" }}>+{vars.length - 6} more</VarChip>
                    )}
                  </TplVarsRow>
                  <TplActions>
                    <EditLinkEl href={`/templates/${tpl.id}/edit`} $primary={tpl.isDefault}>
                      Edit template
                    </EditLinkEl>
                    <TemplatePreviewBtn templateId={tpl.id} html={tpl.html} />
                  </TplActions>
                </TemplateCard>
              );
            })}
          </TemplatesGrid>
        )}

        <AddTemplateLink href="/templates/new/edit">
          <AddIconBox>+</AddIconBox>
          <AddText>Add new template</AddText>
        </AddTemplateLink>
      </SectionCard>

    </PageWrap>
  );
}

