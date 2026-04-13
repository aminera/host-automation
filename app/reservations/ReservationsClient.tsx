"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  draft:  { label: "Draft",  bg: "var(--app-surface-2)", color: "var(--app-text-3)"  },
  signed: { label: "Signed", bg: "var(--app-green-bg)",  color: "var(--app-green-text)" },
  sent:   { label: "Sent",   bg: "var(--app-blue-bg)",   color: "var(--app-blue-text)"  },
};

const PILLS = [
  { value: "",               label: "All"                },
  { value: "pending",        label: "Pending"            },
  { value: "guest_submitted",label: "Guest submitted"    },
  { value: "_awaiting",      label: "Awaiting signature" },
];

type SortCol = "property" | "guest" | "checkIn" | "checkOut";
const PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, bg: "var(--app-surface-2)", color: "var(--app-text-2)" };
  return (
    <span
      className="inline-flex items-center px-[9px] py-[3px] rounded-[8px] text-[11px] font-medium whitespace-nowrap"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function ContractCell({ contracts }: { contracts: { id: string; status: string }[] }) {
  if (!contracts.length) return <span style={{ color: "var(--app-text-3)" }}>—</span>;
  const m = CONTRACT_META[contracts[0].status] ?? { label: contracts[0].status, bg: "var(--app-surface-2)", color: "var(--app-text-3)" };
  return (
    <span
      className="inline-flex items-center px-[9px] py-[3px] rounded-[8px] text-[11px] font-medium whitespace-nowrap"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function ReservationsClient({ reservations }: { reservations: ReservationRow[] }) {
  const router = useRouter();
  const now    = useMemo(() => new Date(), []);

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState("");
  const [propFilter,setPropFilter]= useState("");
  const [srcFilter, setSrcFilter] = useState("");
  const [pill,      setPill]      = useState("");

  // ── Sort state ─────────────────────────────────────────────────────────────
  const [sortCol, setSortCol] = useState<SortCol>("checkIn");
  const [sortAsc, setSortAsc] = useState(false);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);

  // ── Derived dropdown options ───────────────────────────────────────────────
  const propOptions = useMemo(
    () => [...new Set(reservations.map((r) => r.property.name))].sort(),
    [reservations]
  );
  const srcOptions = useMemo(
    () => [...new Set(reservations.map((r) => r.source))].sort(),
    [reservations]
  );

  // ── Stats ──────────────────────────────────────────────────────────────────
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

  // ── Pill counts (always from full list) ────────────────────────────────────
  const pillCounts = useMemo(() => ({
    "":               reservations.length,
    pending:          reservations.filter((r) => r.status === "pending").length,
    guest_submitted:  reservations.filter((r) => r.status === "guest_submitted").length,
    _awaiting:        reservations.filter(
      (r) => r.contracts.length > 0 && r.contracts[0].status !== "signed"
    ).length,
  }), [reservations]);

  // ── Filtered + sorted data ─────────────────────────────────────────────────
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

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleSort(col: SortCol) {
    if (sortCol === col) setSortAsc((a) => !a);
    else { setSortCol(col); setSortAsc(true); }
    setPage(1);
  }

  function applyFilter(fn: () => void) { fn(); setPage(1); }

  function resetFilters() {
    setSearch(""); setPropFilter(""); setSrcFilter(""); setPill(""); setPage(1);
  }

  // ── Sort arrow ─────────────────────────────────────────────────────────────
  function Arrow({ col }: { col: SortCol }) {
    if (sortCol !== col) return <span style={{ marginLeft: 3, opacity: 0.3 }}>↓</span>;
    return <span style={{ marginLeft: 3, color: "var(--app-blue)" }}>{sortAsc ? "↑" : "↓"}</span>;
  }

  // ── Shared input style ─────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    background: "var(--app-surface-2)",
    border:     "0.5px solid var(--app-border-md)",
    color:      "var(--app-text-1)",
    borderRadius: 8,
    fontSize:   13,
    padding:    "7px 10px",
    outline:    "none",
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const emptyState = (
    <div className="py-12 text-center px-5">
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center mx-auto mb-4"
        style={{ background: "var(--app-surface-2)" }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ color: "var(--app-text-3)" }}>
          <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" opacity="0.4"/>
          <path d="M7 11h8M7 7.5h5M7 14.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/>
        </svg>
      </div>
      <p className="text-[14px] font-medium mb-1.5" style={{ color: "var(--app-text-1)" }}>No reservations found</p>
      <p className="text-[13px] mb-4"              style={{ color: "var(--app-text-2)" }}>Try adjusting your search or filters</p>
      <button
        onClick={resetFilters}
        className="px-[14px] py-[7px] rounded-[8px] text-[13px] transition"
        style={{ background: "var(--app-surface)", border: "0.5px solid var(--app-border-md)", color: "var(--app-text-1)" }}
      >
        Clear filters
      </button>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-7">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-[20px] font-medium" style={{ color: "var(--app-text-1)" }}>Reservations</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--app-text-3)" }}>
            All properties · {now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
          </p>
        </div>
        <Link
          href="/reservations/new"
          className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition"
          style={{ background: "var(--app-blue)", color: "#ffffff" }}
        >
          + New reservation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total",
            value: stats.total,
            sub: "All time",
            valueColor: undefined,
          },
          {
            label: "This month",
            value: stats.thisMonth,
            sub: now.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
            valueColor: undefined,
          },
          {
            label: "Awaiting signature",
            value: stats.awaitingSignature,
            sub: "Contract pending",
            valueColor: stats.awaitingSignature > 0 ? "var(--app-amber-text)" : undefined,
          },
          {
            label: "Pending submission",
            value: stats.pendingSubmission,
            sub: "Form not filled",
            valueColor: stats.pendingSubmission > 0 ? "var(--app-red-text)" : undefined,
          },
        ].map(({ label, value, sub, valueColor }) => (
          <div
            key={label}
            className="rounded-[8px] px-4 py-3.5"
            style={{ background: "var(--app-surface-2)" }}
          >
            <p className="text-[11px] mb-1.5" style={{ color: "var(--app-text-2)" }}>{label}</p>
            <p
              className="text-[20px] font-medium leading-none mb-1"
              style={{ color: valueColor ?? "var(--app-text-1)" }}
            >
              {value}
            </p>
            <p className="text-[11px]" style={{ color: "var(--app-text-3)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Main section */}
      <div
        className="rounded-[12px] overflow-hidden"
        style={{ background: "var(--app-surface)", border: "0.5px solid var(--app-border)" }}
      >

        {/* Toolbar */}
        <div
          className="flex items-center gap-2.5 px-5 py-3.5 flex-wrap"
          style={{ borderBottom: "0.5px solid var(--app-border)" }}
        >
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 160 }}>
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true"
              style={{ color: "var(--app-text-3)" }}
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => applyFilter(() => setSearch(e.target.value))}
              placeholder="Search guest or property…"
              aria-label="Search"
              className="w-full"
              style={{ ...inp, padding: "7px 10px 7px 30px" }}
            />
          </div>

          {/* Property dropdown */}
          <select
            value={propFilter}
            onChange={(e) => applyFilter(() => setPropFilter(e.target.value))}
            aria-label="Property"
            style={inp}
          >
            <option value="">All properties</option>
            {propOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Source dropdown */}
          <select
            value={srcFilter}
            onChange={(e) => applyFilter(() => setSrcFilter(e.target.value))}
            aria-label="Source"
            style={inp}
          >
            <option value="">All sources</option>
            {srcOptions.map((s) => (
              <option key={s} value={s}>{SOURCE_LABEL[s] ?? s}</option>
            ))}
          </select>
        </div>

        {/* Filter pills */}
        <div
          className="flex items-center gap-1.5 px-5 py-3 flex-wrap"
          style={{ borderBottom: "0.5px solid var(--app-border)" }}
        >
          {PILLS.map(({ value, label }) => {
            const isActive = pill === value;
            const count    = pillCounts[value as keyof typeof pillCounts] ?? 0;
            return (
              <button
                key={value}
                onClick={() => applyFilter(() => setPill(value))}
                className="px-3 py-1 rounded-full text-[12px] transition whitespace-nowrap"
                style={{
                  background:  isActive ? "var(--app-blue)"      : "var(--app-surface)",
                  color:       isActive ? "#ffffff"               : "var(--app-text-2)",
                  border:      isActive ? "0.5px solid var(--app-blue)" : "0.5px solid var(--app-border-md)",
                }}
              >
                {label}
                <span style={{ fontSize: 10, opacity: 0.75, marginLeft: 3 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden sm:block overflow-x-auto">
          {paginated.length === 0 ? emptyState : (
            <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 600 }}>
              <thead>
                <tr style={{ background: "var(--app-surface-2)", borderBottom: "0.5px solid var(--app-border)" }}>
                  <Th w="16%" sort onClick={() => handleSort("guest")}>
                    Guest <Arrow col="guest" />
                  </Th>
                  <Th w="22%" sort onClick={() => handleSort("property")}>
                    Property <Arrow col="property" />
                  </Th>
                  <Th w="12%" sort onClick={() => handleSort("checkIn")}>
                    Check-in <Arrow col="checkIn" />
                  </Th>
                  <Th w="12%" sort className="max-[960px]:hidden" onClick={() => handleSort("checkOut")}>
                    Check-out <Arrow col="checkOut" />
                  </Th>
                  <Th w="11%" className="max-[800px]:hidden">Source</Th>
                  <Th w="16%">Status</Th>
                  <Th w="9%">Contract</Th>
                  <Th w="8%" right> </Th>
                </tr>
              </thead>
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
            </table>
          )}
        </div>

        {/* ── Mobile cards ── */}
        <div className="block sm:hidden">
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
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-2"
            style={{ borderTop: "0.5px solid var(--app-border)" }}
          >
            <span className="text-[12px]" style={{ color: "var(--app-text-3)" }}>
              Showing {paginated.length} of {filtered.length} reservation{filtered.length !== 1 ? "s" : ""}
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <PageBtn
                  aria-label="Previous"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </PageBtn>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>
                    {p}
                  </PageBtn>
                ))}
                <PageBtn
                  aria-label="Next"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </PageBtn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Table sub-components ─────────────────────────────────────────────────────

function Th({
  children, w, sort, right, className = "", onClick,
}: {
  children: React.ReactNode;
  w?: string;
  sort?: boolean;
  right?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className={`px-2.5 py-2.5 text-[11px] font-medium uppercase tracking-[.04em] ${right ? "text-right" : "text-left"} ${sort ? "cursor-pointer select-none hover:opacity-75" : ""} ${className}`}
      style={{ color: "var(--app-text-2)", width: w }}
    >
      {children}
    </th>
  );
}

function TableRow({
  r, isLast, onClick,
}: {
  r: {
    id: string; status: string; source: string;
    checkInDate: string; checkOutDate: string;
    property: { name: string };
    guests: { fullName: string }[];
    contracts: { id: string; status: string }[];
  };
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className="res-table-row cursor-pointer transition"
      style={{ borderBottom: isLast ? "none" : "0.5px solid var(--app-border)" }}
    >
      <td className="px-2.5 py-3">
        <span
          className="block text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: "var(--app-text-1)" }}
        >
          {r.guests[0]?.fullName ?? "—"}
        </span>
        {r.guests.length > 1 && (
          <span className="block text-[11px]" style={{ color: "var(--app-text-3)" }}>
            +{r.guests.length - 1} more
          </span>
        )}
      </td>
      <td
        className="px-2.5 py-3 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ color: "var(--app-text-1)" }}
      >
        {r.property.name}
      </td>

      <td
        className="px-2.5 py-3 text-[13px] whitespace-nowrap"
        style={{ color: "var(--app-text-1)" }}
      >
        {fmtDate(r.checkInDate)}
      </td>

      <td
        className="max-[960px]:hidden px-2.5 py-3 text-[13px] whitespace-nowrap"
        style={{ color: "var(--app-text-1)" }}
      >
        {fmtDate(r.checkOutDate)}
      </td>

      <td
        className="max-[800px]:hidden px-2.5 py-3 text-[13px]"
        style={{ color: "var(--app-text-2)" }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle flex-shrink-0"
          style={{ background: "var(--app-blue)" }}
        />
        {SOURCE_LABEL[r.source] ?? r.source}
      </td>

      <td className="px-2.5 py-3">
        <StatusBadge status={r.status} />
      </td>

      <td className="px-2.5 py-3">
        <ContractCell contracts={r.contracts} />
      </td>

      <td className="px-2.5 py-3 text-right">
        <Link
          href={`/reservations/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] font-medium hover:underline whitespace-nowrap"
          style={{ color: "var(--app-blue)" }}
        >
          Manage →
        </Link>
      </td>
    </tr>
  );
}

function MobileCard({
  r, isLast, onClick,
}: {
  r: {
    id: string; status: string; source: string;
    checkInDate: string; checkOutDate: string;
    property: { name: string };
    guests: { fullName: string }[];
    contracts: { id: string; status: string }[];
  };
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="res-mobile-card px-5 py-4 cursor-pointer transition"
      style={{ borderBottom: isLast ? "none" : "0.5px solid var(--app-border)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p
            className="text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: "var(--app-text-1)" }}
          >
            {r.property.name}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--app-text-2)" }}>
            {r.guests[0]?.fullName ?? "—"}
            {r.guests.length > 1 ? ` · +${r.guests.length - 1} more` : ""}
          </p>
        </div>
        <Link
          href={`/reservations/${r.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] font-medium whitespace-nowrap hover:underline flex-shrink-0"
          style={{ color: "var(--app-blue)" }}
        >
          Manage →
        </Link>
      </div>

      <div className="flex gap-1.5 flex-wrap mb-2">
        <StatusBadge status={r.status} />
        <ContractCell contracts={r.contracts} />
      </div>

      <div className="flex items-center justify-between text-[12px]" style={{ color: "var(--app-text-3)" }}>
        <span>{fmtDate(r.checkInDate)} → {fmtDate(r.checkOutDate)}</span>
        <span>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
            style={{ background: "var(--app-blue)" }}
          />
          {SOURCE_LABEL[r.source] ?? r.source}
        </span>
      </div>
    </div>
  );
}

function PageBtn({
  children, active, disabled, onClick, ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  [key: string]: unknown;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[12px] transition disabled:opacity-30"
      style={{
        background:  active ? "var(--app-blue)"       : "var(--app-surface)",
        color:       active ? "#ffffff"                : "var(--app-text-2)",
        border:      active ? "0.5px solid var(--app-blue)" : "0.5px solid var(--app-border-md)",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
