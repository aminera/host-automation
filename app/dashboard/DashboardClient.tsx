"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import PropertiesPanel, { Property } from "./PropertiesPanel";

// ── Types ─────────────────────────────────────────────────────────────────

interface ReservationRow {
  id: string;
  status: string;
  source: string;
  checkInDate: string;
  checkOutDate: string;
  property: { id: string; name: string };
  guests: { fullName: string }[];
  contracts: { id: string; status: string }[];
}

interface Metrics {
  properties: number;
  reservationsThisMonth: number;
  contractsSigned: number;
  pendingActions: number;
}

interface Props {
  reservations: ReservationRow[];
  properties: Property[];
  metrics: Metrics;
}

const SOURCE_LABEL: Record<string, string> = {
  airbnb:  "Airbnb",
  booking: "Booking.com",
  direct:  "Direct",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type StatusFilter = "all" | "pending" | "guest_submitted" | "signed";

const filterLabels: { key: StatusFilter; label: string }[] = [
  { key: "all",             label: "All" },
  { key: "pending",         label: "Pending" },
  { key: "guest_submitted", label: "Guest submitted" },
  { key: "signed",          label: "Signed" },
];

// ── Styled components ─────────────────────────────────────────────────────

const PageWrap = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const PageHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.5rem;
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

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const OutlineBtn = styled.button<{ $active?: boolean }>`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  border: 0.5px solid var(--app-border-md);
  background: ${({ $active }) => $active ? "var(--app-surface-2)" : "var(--app-surface)"};
  color: var(--app-text-1);
`;

const PrimaryLink = styled(Link)`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-blue);
  color: #ffffff;
  text-decoration: none;
  transition: opacity 0.15s;
  &:hover { opacity: 0.9; }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;

  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
`;

const MetricCard = styled.div`
  background: var(--app-surface-2);
  border-radius: 8px;
  padding: 1rem;
`;

const MetricLabel = styled.p`
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--app-text-2);
`;

const MetricValue = styled.p<{ $amber?: boolean }>`
  font-size: 22px;
  font-weight: 500;
  color: ${({ $amber }) => $amber ? "var(--app-amber-text)" : "var(--app-text-1)"};
`;

const MetricSub = styled.p`
  font-size: 11px;
  margin-top: 0.25rem;
  color: var(--app-text-3);
`;

const SectionCard = styled.div`
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 0.5px solid var(--app-border);
`;

const SectionHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SectionTitle = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const SectionCount = styled.span`
  font-size: 12px;
  color: var(--app-text-3);
`;

const PropertyFilterTag = styled.button`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  border: none;
  background: var(--app-blue-bg);
  color: var(--app-blue-text);
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity: 0.8; }
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 0.5px solid var(--app-border);
`;

const FilterPill = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  border: 0.5px solid ${({ $active }) => $active ? "var(--app-blue)" : "var(--app-border-md)"};
  background: ${({ $active }) => $active ? "var(--app-blue)" : "var(--app-surface)"};
  color: ${({ $active }) => $active ? "#ffffff" : "var(--app-text-2)"};
`;

const EmptyMsg = styled.p`
  padding: 2.5rem 1.25rem;
  font-size: 13px;
  text-align: center;
  color: var(--app-text-3);
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 600px;
`;

const THead = styled.thead`
  background: var(--app-surface-2);
  border-bottom: 0.5px solid var(--app-border);
`;

const Th = styled.th<{ $w?: string; $hideBelow?: number }>`
  padding: 10px;
  text-align: left;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--app-text-2);
  width: ${({ $w }) => $w ?? "auto"};
  ${({ $hideBelow }) => $hideBelow ? `@media (max-width: ${$hideBelow}px) { display: none; }` : ""}
`;

const TRow = styled.tr<{ $last?: boolean }>`
  border-bottom: ${({ $last }) => $last ? "none" : "0.5px solid var(--app-border)"};
  cursor: pointer;
  transition: background 0.15s;
  &:hover td { background: var(--app-surface-2); }
`;

const Td = styled.td<{ $hideBelow?: number }>`
  padding: 10px;
  font-size: 13px;
  color: var(--app-text-1);
  ${({ $hideBelow }) => $hideBelow ? `@media (max-width: ${$hideBelow}px) { display: none; }` : ""}
`;

const CellPrimary = styled.span`
  display: block;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--app-text-1);
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

// ── Badge ──────────────────────────────────────────────────────────────────

const BadgeSpan = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
`;

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return <BadgeSpan $bg={bg} $color={color}>{children}</BadgeSpan>;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:         { label: "Pending",         bg: "var(--app-amber-bg)",  color: "var(--app-amber-text)" },
    guest_submitted: { label: "Guest submitted", bg: "var(--app-blue-bg)",   color: "var(--app-blue-text)"  },
    confirmed:       { label: "Confirmed",       bg: "var(--app-green-bg)",  color: "var(--app-green-text)" },
    completed:       { label: "Completed",       bg: "var(--app-surface-2)", color: "var(--app-text-2)"     },
    cancelled:       { label: "Cancelled",       bg: "var(--app-surface-2)", color: "var(--app-text-2)"     },
    signed:          { label: "Signed",          bg: "var(--app-green-bg)",  color: "var(--app-green-text)" },
    sent:            { label: "Sent",            bg: "var(--app-blue-bg)",   color: "var(--app-blue-text)"  },
    draft:           { label: "Draft",           bg: "var(--app-surface-2)", color: "var(--app-text-2)"     },
  };
  const { label, bg, color } = map[status] ?? { label: status, bg: "var(--app-surface-2)", color: "var(--app-text-2)" };
  return <Badge bg={bg} color={color}>{label}</Badge>;
}

function contractBadge(status: string) {
  if (status === "signed") return <Badge bg="var(--app-green-bg)"  color="var(--app-green-text)">Signed</Badge>;
  if (status === "sent")   return <Badge bg="var(--app-blue-bg)"   color="var(--app-blue-text)">Sent</Badge>;
  return                          <Badge bg="var(--app-surface-2)" color="var(--app-text-2)">{status}</Badge>;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function DashboardClient({ reservations, properties, metrics }: Props) {
  const router = useRouter();
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>("all");
  const [propertyFilter, setPropertyFilter]     = useState<string | null>(null);

  const today = useMemo(() =>
    new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }), []
  );

  const filterFns: Record<StatusFilter, (r: ReservationRow) => boolean> = {
    all: () => true,
    pending: (r) => r.status === "pending",
    guest_submitted: (r) => r.status === "guest_submitted",
    signed: (r) => r.contracts[0]?.status === "signed",
  };

  const filteredReservations = useMemo(() =>
    reservations.filter((r) => {
      if (propertyFilter && r.property.id !== propertyFilter) return false;
      return filterFns[statusFilter](r);
    }), [reservations, propertyFilter, statusFilter, filterFns]
  );

  return (
    <PageWrap>

      {/* Page header */}
      <PageHeaderRow>
        <div>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>{today}</PageSubtitle>
        </div>
        <HeaderActions>
          <OutlineBtn
            $active={propertyFormOpen}
            onClick={() => setPropertyFormOpen((v) => !v)}
          >
            {propertyFormOpen ? "Cancel" : "+ Add property"}
          </OutlineBtn>
          <PrimaryLink href="/reservations/new">+ New reservation</PrimaryLink>
        </HeaderActions>
      </PageHeaderRow>

      {/* Metrics */}
      <MetricsGrid>
        <MetricCard>
          <MetricLabel>Properties</MetricLabel>
          <MetricValue>{metrics.properties}</MetricValue>
          <MetricSub>Active listings</MetricSub>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Reservations</MetricLabel>
          <MetricValue>{metrics.reservationsThisMonth}</MetricValue>
          <MetricSub>This month</MetricSub>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Contracts signed</MetricLabel>
          <MetricValue>{metrics.contractsSigned}</MetricValue>
          <MetricSub>Total signed</MetricSub>
        </MetricCard>
        <MetricCard>
          <MetricLabel>Pending action</MetricLabel>
          <MetricValue $amber={metrics.pendingActions > 0}>{metrics.pendingActions}</MetricValue>
          <MetricSub>{metrics.pendingActions === 0 ? "All clear" : "Needs attention"}</MetricSub>
        </MetricCard>
      </MetricsGrid>

      {/* Properties section */}
      <SectionCard>
        <SectionHeader>
          <SectionTitle>Properties</SectionTitle>
          <SectionCount>{properties.length} total</SectionCount>
        </SectionHeader>
        <PropertiesPanel
          initial={properties}
          formOpen={propertyFormOpen}
          onFormClose={() => setPropertyFormOpen(false)}
          onViewReservations={(id) => {
            setPropertyFilter((cur) => (cur === id ? null : id));
            setStatusFilter("all");
            document.getElementById("reservations-section")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </SectionCard>

      {/* Reservations section */}
      <SectionCard id="reservations-section">
        <SectionHeader>
          <SectionHeaderLeft>
            <SectionTitle>Reservations</SectionTitle>
            {propertyFilter && (
              <PropertyFilterTag onClick={() => setPropertyFilter(null)}>
                {properties.find((p) => p.id === propertyFilter)?.name} ×
              </PropertyFilterTag>
            )}
          </SectionHeaderLeft>
          <SectionCount>{filteredReservations.length} total</SectionCount>
        </SectionHeader>

        {/* Filter pills */}
        <FilterRow>
          {filterLabels.map(({ key, label }) => (
            <FilterPill
              key={key}
              $active={statusFilter === key}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </FilterPill>
          ))}
        </FilterRow>

        {filteredReservations.length === 0 ? (
          <EmptyMsg>No reservations found.</EmptyMsg>
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <tr>
                  <Th $w="16%">Guest</Th>
                  <Th $w="22%">Property</Th>
                  <Th $w="12%">Check-in</Th>
                  <Th $w="12%" $hideBelow={960}>Check-out</Th>
                  <Th $w="11%" $hideBelow={800}>Source</Th>
                  <Th $w="16%">Status</Th>
                  <Th $w="9%">Contract</Th>
                  <Th $w="8%"></Th>
                </tr>
              </THead>
              <tbody>
                {filteredReservations.map((r, idx) => (
                  <TRow
                    key={r.id}
                    $last={idx === filteredReservations.length - 1}
                    onClick={() => router.push(`/reservations/${r.id}`)}
                  >
                    <Td>
                      <CellPrimary>{r.guests[0]?.fullName ?? "—"}</CellPrimary>
                      {r.guests.length > 1 && <CellSub>+{r.guests.length - 1} more</CellSub>}
                    </Td>
                    <Td style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {r.property.name}
                    </Td>
                    <Td style={{ whiteSpace: "nowrap" }}>{fmtDate(r.checkInDate)}</Td>
                    <Td $hideBelow={960} style={{ whiteSpace: "nowrap" }}>{fmtDate(r.checkOutDate)}</Td>
                    <Td $hideBelow={800} style={{ color: "var(--app-text-2)" }}>
                      <SourceDot />
                      {SOURCE_LABEL[r.source] ?? r.source}
                    </Td>
                    <Td>{statusBadge(r.status)}</Td>
                    <Td>
                      {r.contracts[0]
                        ? contractBadge(r.contracts[0].status)
                        : <span style={{ color: "var(--app-text-3)" }}>—</span>}
                    </Td>
                    <Td style={{ textAlign: "right" }}>
                      <ManageLink
                        href={`/reservations/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Manage →
                      </ManageLink>
                    </Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </SectionCard>
    </PageWrap>
  );
}

