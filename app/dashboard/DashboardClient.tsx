"use client";

import { useState } from "react";
import Link from "next/link";
import PropertiesPanel, { Property } from "./PropertiesPanel";

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

function Badge({ children, bg, color }: { children: React.ReactNode; bg: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-[10px] py-[3px] rounded-[8px] text-[11px] font-medium whitespace-nowrap"
      style={{ background: bg, color }}
    >
      {children}
    </span>
  );
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

export default function DashboardClient({ reservations, properties, metrics }: Props) {
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [statusFilter, setStatusFilter]         = useState<StatusFilter>("all");
  const [propertyFilter, setPropertyFilter]     = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const filteredReservations = reservations.filter((r) => {
    if (propertyFilter && r.property.id !== propertyFilter) return false;
    if (statusFilter === "pending")         return r.status === "pending";
    if (statusFilter === "guest_submitted") return r.status === "guest_submitted";
    if (statusFilter === "signed")          return r.contracts[0]?.status === "signed";
    return true;
  });

  const surface   = { background: "var(--app-surface)",   border: "0.5px solid var(--app-border)" };
  const divider   = { borderBottom: "0.5px solid var(--app-border)" };

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-4">

      {/* Page header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-[20px] font-medium" style={{ color: "var(--app-text-1)" }}>Dashboard</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--app-text-3)" }}>{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPropertyFormOpen((v) => !v)}
            className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition cursor-pointer"
            style={{
              border: "0.5px solid var(--app-border-md)",
              background: propertyFormOpen ? "var(--app-surface-2)" : "var(--app-surface)",
              color: "var(--app-text-1)",
            }}
          >
            {propertyFormOpen ? "Cancel" : "+ Add property"}
          </button>
          <Link
            href="/reservations/new"
            className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition"
            style={{ background: "var(--app-blue)", color: "#ffffff" }}
          >
            + New reservation
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Properties",       value: metrics.properties,            sub: "Active listings",   valueColor: undefined },
          { label: "Reservations",     value: metrics.reservationsThisMonth, sub: "This month",        valueColor: undefined },
          { label: "Contracts signed", value: metrics.contractsSigned,       sub: "Total signed",      valueColor: undefined },
          { label: "Pending action",   value: metrics.pendingActions,        sub: metrics.pendingActions === 0 ? "All clear" : "Needs attention", valueColor: metrics.pendingActions > 0 ? "var(--app-amber-text)" : undefined },
        ].map(({ label, value, sub, valueColor }) => (
          <div key={label} className="rounded-[8px] p-4" style={{ background: "var(--app-surface-2)" }}>
            <p className="text-[12px] mb-1.5" style={{ color: "var(--app-text-2)" }}>{label}</p>
            <p className="text-[22px] font-medium" style={{ color: valueColor ?? "var(--app-text-1)" }}>{value}</p>
            <p className="text-[11px] mt-1" style={{ color: "var(--app-text-3)" }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Properties section */}
      <div className="rounded-[12px] overflow-hidden" style={surface}>
        <div className="flex items-center justify-between px-5 py-4" style={divider}>
          <span className="text-[14px] font-medium" style={{ color: "var(--app-text-1)" }}>Properties</span>
          <span className="text-[12px]" style={{ color: "var(--app-text-3)" }}>{properties.length} total</span>
        </div>
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
      </div>

      {/* Reservations section */}
      <div id="reservations-section" className="rounded-[12px] overflow-hidden" style={surface}>
        <div className="flex items-center justify-between px-5 py-4" style={divider}>
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium" style={{ color: "var(--app-text-1)" }}>Reservations</span>
            {propertyFilter && (
              <button
                onClick={() => setPropertyFilter(null)}
                className="text-[11px] px-2 py-0.5 rounded-full transition"
                style={{ background: "var(--app-blue-bg)", color: "var(--app-blue-text)" }}
              >
                {properties.find((p) => p.id === propertyFilter)?.name} ×
              </button>
            )}
          </div>
          <span className="text-[12px]" style={{ color: "var(--app-text-3)" }}>{filteredReservations.length} total</span>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 px-5 py-3" style={divider}>
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="px-3 py-[4px] rounded-full text-[12px] transition cursor-pointer"
              style={
                statusFilter === key
                  ? { background: "var(--app-blue)", color: "#ffffff", border: "0.5px solid var(--app-blue)" }
                  : { background: "var(--app-surface)", color: "var(--app-text-2)", border: "0.5px solid var(--app-border-md)" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {filteredReservations.length === 0 ? (
          <p className="px-5 py-10 text-[13px] text-center" style={{ color: "var(--app-text-3)" }}>
            No reservations found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--app-border)", background: "var(--app-surface-2)" }}>
                  {[
                    { label: "Guest",     w: "16%" },
                    { label: "Property",  w: "22%" },
                    { label: "Check-in",  w: "12%" },
                    { label: "Check-out", w: "12%", cls: "max-[960px]:hidden" },
                    { label: "Source",    w: "11%", cls: "max-[800px]:hidden" },
                    { label: "Status",    w: "16%" },
                    { label: "Contract",  w: "9%"  },
                    { label: "",          w: "8%"  },
                  ].map(({ label, w, cls = "" }) => (
                    <th
                      key={label}
                      className={`px-2.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[.04em] ${cls}`}
                      style={{ color: "var(--app-text-2)", width: w }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="res-table-row cursor-pointer transition"
                    style={{ borderBottom: idx < filteredReservations.length - 1 ? "0.5px solid var(--app-border)" : "none" }}
                    onClick={() => window.location.href = `/reservations/${r.id}`}
                  >
                    <td className="px-2.5 py-3">
                      <span className="block text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "var(--app-text-1)" }}>
                        {r.guests[0]?.fullName ?? "—"}
                      </span>
                      {r.guests.length > 1 && (
                        <span className="block text-[11px]" style={{ color: "var(--app-text-3)" }}>
                          +{r.guests.length - 1} more
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-3 text-[13px] font-medium overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: "var(--app-text-1)" }}>
                      {r.property.name}
                    </td>
                    <td className="px-2.5 py-3 text-[13px] whitespace-nowrap" style={{ color: "var(--app-text-1)" }}>
                      {fmtDate(r.checkInDate)}
                    </td>
                    <td className="max-[960px]:hidden px-2.5 py-3 text-[13px] whitespace-nowrap" style={{ color: "var(--app-text-1)" }}>
                      {fmtDate(r.checkOutDate)}
                    </td>
                    <td className="max-[800px]:hidden px-2.5 py-3 text-[13px]" style={{ color: "var(--app-text-2)" }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle flex-shrink-0" style={{ background: "var(--app-blue)" }} />
                      {SOURCE_LABEL[r.source] ?? r.source}
                    </td>
                    <td className="px-2.5 py-3">{statusBadge(r.status)}</td>
                    <td className="px-2.5 py-3">
                      {r.contracts[0]
                        ? contractBadge(r.contracts[0].status)
                        : <span style={{ color: "var(--app-text-3)" }}>—</span>}
                    </td>
                    <td className="px-2.5 py-3 text-right">
                      <Link
                        href={`/reservations/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[12px] font-medium whitespace-nowrap hover:underline"
                        style={{ color: "var(--app-blue)" }}
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
