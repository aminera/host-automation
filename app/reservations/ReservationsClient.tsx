"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled, { css } from "styled-components";

// ── Types ────────────────────────────────────────────────────────────────────

type ReservationRow = {
  id:           string;
  status:       string;
  source:       string;
  checkInDate:  string;
  checkOutDate: string;
  createdAt:    string;
  property: { id: string; name: string };
  guests:   { id: string; fullName: string }[];
  contracts: { id: string; status: string }[];
};

// ── Constants ────────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<string, string> = {
  airbnb:  "Airbnb",
  booking: "Booking.com",
  direct:  "Direct",
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:         { label: "Pending",         bg: "var(--app-amber-bg)",  color: "var(--app-amber-text)" },
  confirmed:       { label: "Confirmed",       bg: "var(--app-green-bg)",  color: "var(--app-green-text)" },
  guest_submitted: { label: "Guest submitted", bg: "var(--app-blue-bg)",   color: "var(--app-blue-text)"  },
  completed:       { label: "Completed",       bg: "var(--app-surface-2)", color: "var(--app-text-2)"     },
  cancelled:       { label: "Cancelled",       bg: "var(--app-red-bg)",    color: "var(--app-red-text)"   },
};

const CONTRACT_META: Record<string, { label: string; bg: string; color: string }> = {
  draft:  { label: "Draft",  bg: "var(--app-surface-2)", color: "var(--app-text-3)"     },
  signed: { label: "Signed", bg: "var(--app-green-bg)",  color: "var(--app-green-text)" },
  sent:   { label: "Sent",   bg: "var(--app-blue-bg)",   color: "var(--app-blue-text)"  },
};

const PILLS = [
  { value: "",                label: "All"                },
  { value: "pending",         label: "Pending"            },
  { value: "guest_submitted", label: "Guest submitted"    },
  { value: "_awaiting",       label: "Awaiting signature" },
];

type SortCol = "property" | "guest" | "checkIn" | "checkOut";
const PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

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
  margin-top: 0.125rem;
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
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
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

const StatValue = styled.p<{ $amber?: boolean; $red?: boolean }>`
  font-size: 20px;
  font-weight: 500;
  line-height: 1;
  margin-bottom: 4px;
  color: ${({ $amber, $red }) => $amber ? "var(--app-amber-text)" : $red ? "var(--app-red-text)" : "var(--app-text-1)"};
`;

const StatSub = styled.p`
  font-size: 11px;
  color: var(--app-text-3);
`;

const SectionCard = styled.div`
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
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
  transition: background 0.15s, color 0.15s;
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
  min-width: 600px;
`;

const THeadEl = styled.thead`
  background: var(--app-surface-2);
  border-bottom: 0.5px solid var(--app-border);
`;

const ThEl = styled.th<{ $w?: string; $right?: boolean; $sort?: boolean; $hideBelow?: number }>`
  padding: 10px;
  text-align: ${({ $right }) => $right ? "right" : "left"};
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-2);
  width: ${({ $w }) => $w ?? "auto"};
  ${({ $sort }) => $sort && css`cursor: pointer; user-select: none; &:hover { opacity: 0.75; }`}
  ${({ $hideBelow }) => $hideBelow && css`@media (max-width: ${$hideBelow}px) { display: none; }`}
`;

const TdEl = styled.td<{ $hideBelow?: number }>`
  padding: 10px;
  font-size: 13px;
  color: var(--app-text-1);
  ${({ $hideBelow }) => $hideBelow && css`@media (max-width: ${$hideBelow}px) { display: none; }`}
`;

const CellPrimary = styled.span`
  display: block;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CellSub = styled.span`
  display: block;
  font-size: 11px;
  color: var(--app-text-3);
`;

const SourceDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  flex-shrink: 0;
  background: var(--app-blue);
`;

const ManageLink = styled(Link)`
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--app-blue);
  text-decoration: none;
  &:hover { text-decoration: underline; }
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
  transition: background 0.15s;
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
  transition: background 0.15s;
  &:hover { background: var(--app-surface-2); }
`;

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, bg: "var(--app-surface-2)", color: "var(--app-text-2)" };
  return <BadgeSpan $bg={m.bg} $color={m.color}>{m.label}</BadgeSpan>;
}

function ContractCell({ contracts }: { contracts: { id: string; status: string }[] }) {
  if (!contracts.length) return <span style={{ color: "var(--app-text-3)" }}>—</span>;
  const m = CONTRACT_META[contracts[0].status] ?? { label: contracts[0].status, bg: "var(--app-surface-2)", color: "var(--app-text-3)" };
  return <BadgeSpan $bg={m.bg} $color={m.color}>{m.label}</BadgeSpan>;
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ReservationsClient({ reservations }: { reservations: ReservationRow[] }) {
  const router = useRouter();
  const now    = useMemo(() => new Date(), []);

  const [search,     setSearch]     = useState("");
  const [propFilter, setPropFilter] = useState("");
  const [srcFilter,  setSrcFilter]  = useState("");
  const [pill,       setPill]       = useState("");
  const [sortCol,    setSortCol]    = useState<SortCol>("checkIn");
  const [sortAsc,    setSortAsc]    = useState(false);
  const [page,       setPage]       = useState(1);

  const propOptions = useMemo(
    () => [...new Set(reservations.map((r) => r.property.name))].sort(),
    [reservations]
  );
  const srcOptions = useMemo(
    () => [...new Set(reservations.map((r) => r.source))].sort(),
    [reservations]
  );

  const stats = useMemo(() => {
    const mon = now.getMonth(), yr = now.getFullYear();
    return {
      total:             reservations.length,
      thisMonth:         reservations.filter((r) => {
        const d = new Date(r.checkInDate);
        return d.getMonth() === mon && d.getFullYear() === yr;
      }).length,
      awaitingSignature: reservations.filter(
        (r) => r.contracts.length > 0 && r.contracts[0].status !== "signed"
      ).length,
      pendingSubmission: reservations.filter((r) => r.status === "pending").length,
    };
  }, [reservations, now]);

  const pillCounts = useMemo(() => ({
    "":              reservations.length,
    pending:         reservations.filter((r) => r.status === "pending").length,
    guest_submitted: reservations.filter((r) => r.status === "guest_submitted").length,
    _awaiting:       reservations.filter(
      (r) => r.contracts.length > 0 && r.contracts[0].status !== "signed"
    ).length,
  }), [reservations]);

  const filtered = useMemo(() => {
    let data = reservations;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.property.name.toLowerCase().includes(q) ||
          (r.guests[0]?.fullName ?? "").toLowerCase().includes(q)
      );
    }
    if (propFilter) data = data.filter((r) => r.property.name === propFilter);
    if (srcFilter)  data = data.filter((r) => r.source === srcFilter);
    if (pill === "_awaiting") {
      data = data.filter((r) => r.contracts.length > 0 && r.contracts[0].status !== "signed");
    } else if (pill) {
      data = data.filter((r) => r.status === pill);
    }
    return [...data].sort((a, b) => {
      let av = "", bv = "";
      if (sortCol === "property") { av = a.property.name;          bv = b.property.name; }
      if (sortCol === "guest")    { av = a.guests[0]?.fullName ?? ""; bv = b.guests[0]?.fullName ?? ""; }
      if (sortCol === "checkIn")  { av = a.checkInDate;             bv = b.checkInDate; }
      if (sortCol === "checkOut") { av = a.checkOutDate;            bv = b.checkOutDate; }
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [reservations, search, propFilter, srcFilter, pill, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortAsc((a) => !a);
    else { setSortCol(col); setSortAsc(true); }
    setPage(1);
  }

  function applyFilter(fn: () => void) { fn(); setPage(1); }

  function resetFilters() {
    setSearch(""); setPropFilter(""); setSrcFilter(""); setPill(""); setPage(1);
  }

  function Arrow({ col }: { col: SortCol }) {
    if (sortCol !== col) return <span style={{ marginLeft: 3, opacity: 0.3 }}>↓</span>;
    return <span style={{ marginLeft: 3, color: "var(--app-blue)" }}>{sortAsc ? "↑" : "↓"}</span>;
  }

  const emptyState = (
    <EmptyWrap>
      <EmptyIconBox>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" opacity="0.4"/>
          <path d="M7 11h8M7 7.5h5M7 14.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
        </svg>
      </EmptyIconBox>
      <EmptyTitle>No reservations found</EmptyTitle>
      <EmptySubtitle>Try adjusting your search or filters</EmptySubtitle>
      <ClearFiltersBtn onClick={resetFilters}>Clear filters</ClearFiltersBtn>
    </EmptyWrap>
  );

  return (
    <PageWrap>

      {/* Page header */}
      <PageHeaderRow>
        <div>
          <PageTitle>Reservations</PageTitle>
          <PageSubtitle>
            All properties · {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </PageSubtitle>
        </div>
        <PrimaryLink href="/reservations/new">+ New reservation</PrimaryLink>
      </PageHeaderRow>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <StatLabel>Total</StatLabel>
          <StatValue>{stats.total}</StatValue>
          <StatSub>All time</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>This month</StatLabel>
          <StatValue>{stats.thisMonth}</StatValue>
          <StatSub>{now.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Awaiting signature</StatLabel>
          <StatValue $amber={stats.awaitingSignature > 0}>{stats.awaitingSignature}</StatValue>
          <StatSub>Contract pending</StatSub>
        </StatCard>
        <StatCard>
          <StatLabel>Pending submission</StatLabel>
          <StatValue $red={stats.pendingSubmission > 0}>{stats.pendingSubmission}</StatValue>
          <StatSub>Form not filled</StatSub>
        </StatCard>
      </StatsGrid>

      {/* Main section */}
      <SectionCard>

        {/* Toolbar */}
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

          <FilterSelect
            value={srcFilter}
            onChange={(e) => applyFilter(() => setSrcFilter(e.target.value))}
            aria-label="Source"
          >
            <option value="">All sources</option>
            {srcOptions.map((s) => (
              <option key={s} value={s}>{SOURCE_LABEL[s] ?? s}</option>
            ))}
          </FilterSelect>
        </Toolbar>

        {/* Filter pills */}
        <PillRow>
          {PILLS.map(({ value, label }) => {
            const isActive = pill === value;
            const count    = pillCounts[value as keyof typeof pillCounts] ?? 0;
            return (
              <Pill key={value} $active={isActive} onClick={() => applyFilter(() => setPill(value))}>
                {label}<PillCount>{count}</PillCount>
              </Pill>
            );
          })}
        </PillRow>

        {/* Desktop table */}
        <DesktopSection>
          {paginated.length === 0 ? emptyState : (
            <TableEl>
              <THeadEl>
                <tr>
                  <ThEl $w="16%" $sort onClick={() => handleSort("guest")}>
                    Guest <Arrow col="guest" />
                  </ThEl>
                  <ThEl $w="22%" $sort onClick={() => handleSort("property")}>
                    Property <Arrow col="property" />
                  </ThEl>
                  <ThEl $w="12%" $sort onClick={() => handleSort("checkIn")}>
                    Check-in <Arrow col="checkIn" />
                  </ThEl>
                  <ThEl $w="12%" $sort $hideBelow={960} onClick={() => handleSort("checkOut")}>
                    Check-out <Arrow col="checkOut" />
                  </ThEl>
                  <ThEl $w="11%" $hideBelow={800}>Source</ThEl>
                  <ThEl $w="16%">Status</ThEl>
                  <ThEl $w="9%">Contract</ThEl>
                  <ThEl $w="8%" $right> </ThEl>
                </tr>
              </THeadEl>
              <tbody>
                {paginated.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    r={r}
                    isLast={idx === paginated.length - 1}
                    onClick={() => router.push(`/reservations/${r.id}`)}
                  />
                ))}
              </tbody>
            </TableEl>
          )}
        </DesktopSection>

        {/* Mobile cards */}
        <MobileSection>
          {paginated.length === 0 ? emptyState : (
            paginated.map((r, idx) => (
              <MobileCard
                key={r.id}
                r={r}
                isLast={idx === paginated.length - 1}
                onClick={() => router.push(`/reservations/${r.id}`)}
              />
            ))
          )}
        </MobileSection>

        {/* Footer */}
        {filtered.length > 0 && (
          <SectionFooter>
            <FooterCount>
              Showing {paginated.length} of {filtered.length} reservation{filtered.length !== 1 ? "s" : ""}
            </FooterCount>
            {totalPages > 1 && (
              <PaginationRow>
                <PageBtnEl aria-label="Previous" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</PageBtnEl>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PageBtnEl key={p} $active={p === page} onClick={() => setPage(p)}>{p}</PageBtnEl>
                ))}
                <PageBtnEl aria-label="Next" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</PageBtnEl>
              </PaginationRow>
            )}
          </SectionFooter>
        )}
      </SectionCard>
    </PageWrap>
  );
}

// ── Table sub-components ─────────────────────────────────────────────────────

function TableRow({
  r, isLast, onClick,
}: {
  r: ReservationRow;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className="res-table-row"
      style={{
        cursor: "pointer",
        borderBottom: isLast ? "none" : "0.5px solid var(--app-border)",
      }}
    >
      <TdEl>
        <CellPrimary>{r.guests[0]?.fullName ?? "—"}</CellPrimary>
        {r.guests.length > 1 && <CellSub>+{r.guests.length - 1} more</CellSub>}
      </TdEl>
      <TdEl style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
        {r.property.name}
      </TdEl>
      <TdEl style={{ whiteSpace: "nowrap" }}>{fmtDate(r.checkInDate)}</TdEl>
      <TdEl $hideBelow={960} style={{ whiteSpace: "nowrap" }}>{fmtDate(r.checkOutDate)}</TdEl>
      <TdEl $hideBelow={800} style={{ color: "var(--app-text-2)" }}>
        <SourceDot />{SOURCE_LABEL[r.source] ?? r.source}
      </TdEl>
      <TdEl><StatusBadge status={r.status} /></TdEl>
      <TdEl><ContractCell contracts={r.contracts} /></TdEl>
      <TdEl style={{ textAlign: "right" }}>
        <ManageLink href={`/reservations/${r.id}`} onClick={(e) => e.stopPropagation()}>
          Manage →
        </ManageLink>
      </TdEl>
    </tr>
  );
}

function MobileCard({
  r, isLast, onClick,
}: {
  r: ReservationRow;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <MobileCardWrap onClick={onClick} $last={isLast} className="res-mobile-card">
      <MobileCardTop>
        <MobileCardInfo>
          <MobileCardName>{r.property.name}</MobileCardName>
          <MobileCardGuest>
            {r.guests[0]?.fullName ?? "—"}
            {r.guests.length > 1 ? ` · +${r.guests.length - 1} more` : ""}
          </MobileCardGuest>
        </MobileCardInfo>
        <ManageLink href={`/reservations/${r.id}`} onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
          Manage →
        </ManageLink>
      </MobileCardTop>
      <MobileCardBadges>
        <StatusBadge status={r.status} />
        <ContractCell contracts={r.contracts} />
      </MobileCardBadges>
      <MobileCardFooter>
        <span>{fmtDate(r.checkInDate)} → {fmtDate(r.checkOutDate)}</span>
        <span><SourceDot />{SOURCE_LABEL[r.source] ?? r.source}</span>
      </MobileCardFooter>
    </MobileCardWrap>
  );
}


