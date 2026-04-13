"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

interface ReservationDetail {
  id: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  source: string;
  createdAt: string;
  property: { name: string; address: string; city: string; country: string };
  guests: Array<{
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    documentType?: string | null;
    documentNumber?: string | null;
    documentFileUrl?: string | null;
    createdAt: string;
  }>;
  contracts: Array<{
    id: string;
    contractNumber: string;
    status: string;
    pdfUrl?: string | null;
    createdAt: string;
    signatures: Array<{
      id: string;
      signedAt: string;
      guest: { fullName: string };
    }>;
  }>;
  guestFormTokens: Array<{ token: string; expiresAt: string; used: boolean; createdAt: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " · " + new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function nights(checkIn: string, checkOut: string) {
  const n = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
  return `${n} night${n !== 1 ? "s" : ""}`;
}

function isExpired(iso: string) {
  return new Date(iso) < new Date();
}

const STATUS_META: Record<string, { label: string; badgeBg: string; badgeColor: string }> = {
  pending:         { label: "Pending",         badgeBg: "var(--app-amber-bg)",  badgeColor: "var(--app-amber-text)" },
  confirmed:       { label: "Confirmed",       badgeBg: "var(--app-green-bg)",  badgeColor: "var(--app-green-text)" },
  guest_submitted: { label: "Guest submitted", badgeBg: "var(--app-blue-bg)",   badgeColor: "var(--app-blue-text)"  },
  completed:       { label: "Completed",       badgeBg: "var(--app-surface-2)", badgeColor: "var(--app-text-2)"     },
  cancelled:       { label: "Cancelled",       badgeBg: "var(--app-red-bg)",    badgeColor: "var(--app-red-text)"   },
  signed:          { label: "Signed",          badgeBg: "var(--app-green-bg)",  badgeColor: "var(--app-green-text)" },
  draft:           { label: "Draft",           badgeBg: "var(--app-surface-2)", badgeColor: "var(--app-text-2)"     },
};

function Badge({ status, children }: { status?: string; children?: React.ReactNode }) {
  const meta = status ? (STATUS_META[status] ?? { label: status, badgeBg: "var(--app-surface-2)", badgeColor: "var(--app-text-2)" }) : null;
  return (
    <span
      className="inline-flex items-center px-[10px] py-[3px] rounded-[8px] text-[11px] font-medium whitespace-nowrap"
      style={{ background: meta?.badgeBg ?? "var(--app-surface-2)", color: meta?.badgeColor ?? "var(--app-text-2)" }}
    >
      {meta?.label ?? children}
    </span>
  );
}

// ── Section shell ────────────────────────────────────────────────────────────

function Section({ title, aside, noPad, children }: {
  title: string;
  aside?: React.ReactNode;
  noPad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[12px] overflow-hidden mb-5 last:mb-0"
      style={{ background: "var(--app-surface)", border: "0.5px solid var(--app-border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-[14px]"
        style={{ borderBottom: "0.5px solid var(--app-border)" }}
      >
        <span className="text-[13px] font-medium" style={{ color: "var(--app-text-1)" }}>{title}</span>
        {aside}
      </div>
      {noPad ? children : <div className="px-5 py-5">{children}</div>}
    </div>
  );
}

// ── KV row ───────────────────────────────────────────────────────────────────

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="px-5 py-3"
      style={{ borderBottom: "0.5px solid var(--app-border)" }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: "var(--app-text-3)" }}>
        {label}
      </p>
      <div className="text-[13px] font-medium" style={{ color: "var(--app-text-1)" }}>{children}</div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading]         = useState(true);

  // action states
  const [generatingToken,    setGeneratingToken]    = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [updatingStatus,     setUpdatingStatus]     = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);

  // new link generated
  const [newLink, setNewLink] = useState<string | null>(null);

  // copy states per url
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // feedback
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  function flashFeedback(text: string, ok = true) {
    setFeedback({ text, ok });
    setTimeout(() => setFeedback(null), 3000);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  }

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then((data) => { setReservation(data); setLoading(false); });
  }, [id]);

  async function handleGenerateToken() {
    setGeneratingToken(true);
    try {
      const res  = await fetch(`/api/reservations/${id}/token`, { method: "POST" });
      const data = await res.json();
      setNewLink(data.link);
      flashFeedback("New guest form link generated.");
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleGenerateContract() {
    setGeneratingContract(true);
    try {
      const res  = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: id }),
      });
      const data = await res.json();
      if (data.error) { flashFeedback(`Error: ${data.error}`, false); return; }
      flashFeedback("Contract generated.");
      // reload reservation to show contract
      const fresh = await fetch(`/api/reservations/${id}`).then((r) => r.json());
      setReservation(fresh);
    } finally {
      setGeneratingContract(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!reservation || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const res  = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) { flashFeedback(`Error: ${data.error}`, false); return; }
      setReservation((r) => r ? { ...r, status: data.status } : r);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/reservations/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  // ── Loading / error ──────────────────────────────────────────────────────

  if (loading) return (
    <div className="p-10 text-[13px] text-center" style={{ color: "var(--app-text-3)" }}>Loading…</div>
  );
  if (!reservation) return (
    <div className="p-10 text-[13px] text-center" style={{ color: "var(--app-red-text)" }}>Reservation not found.</div>
  );

  // ── Derived data ─────────────────────────────────────────────────────────

  const latestToken = reservation.guestFormTokens[0] ?? null;
  const activeToken = latestToken && !latestToken.used && !isExpired(latestToken.expiresAt) ? latestToken : null;
  const contract    = reservation.contracts[0] ?? null;

  const guestLinkUrl = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/guest-form/${token}` : "";

  // timeline events — newest first
  const timelineEvents: { title: string; time: string }[] = [
    { title: "Reservation created", time: reservation.createdAt },
    ...(latestToken ? [{ title: "Guest link sent", time: latestToken.createdAt }] : []),
    ...(reservation.guests.length > 0 ? [{ title: "Guest form submitted", time: reservation.guests[0].createdAt }] : []),
    ...(contract ? [{ title: "Contract generated", time: contract.createdAt }] : []),
    ...(contract?.signatures.map((s) => ({ title: `Signed by ${s.guest.fullName}`, time: s.signedAt })) ?? []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="mx-auto px-4 py-7"
      style={{ maxWidth: 1100 }}
    >

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[12px] mb-5 flex-wrap" style={{ color: "var(--app-text-3)" }}>
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--app-text-2)" }}>Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--app-text-2)" }}>Reservations</Link>
        <span>/</span>
        <span>{reservation.property.name}</span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[20px] font-medium" style={{ color: "var(--app-text-1)" }}>
              {reservation.property.name}
            </h1>
            <Badge status={reservation.status} />
          </div>
          <p className="text-[12px] mt-1" style={{ color: "var(--app-text-3)" }}>
            Reservation #{reservation.id.slice(0, 8).toUpperCase()} · Created {fmtDate(reservation.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateToken}
            disabled={generatingToken}
            className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition disabled:opacity-50"
            style={{
              background: "var(--app-surface)",
              color: "var(--app-text-1)",
              border: "0.5px solid var(--app-border-md)",
            }}
          >
            {generatingToken ? "Generating…" : "Regenerate link"}
          </button>

          <button
            onClick={handleGenerateContract}
            disabled={generatingContract}
            className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition disabled:opacity-50"
            style={{ background: "var(--app-blue)", color: "#ffffff" }}
          >
            {generatingContract ? "Generating…" : "Generate contract"}
          </button>

          {reservation.status !== "cancelled" ? (
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={updatingStatus}
              className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition disabled:opacity-50"
              style={{
                color: "var(--app-red-text)",
                border: "0.5px solid #F7C1C1",
                background: "var(--app-surface)",
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange("pending")}
              disabled={updatingStatus}
              className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition disabled:opacity-50"
              style={{
                color: "var(--app-text-2)",
                border: "0.5px solid var(--app-border-md)",
                background: "var(--app-surface)",
              }}
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          className="mb-4 px-4 py-2.5 rounded-[8px] text-[13px] font-medium"
          style={{
            background: feedback.ok ? "var(--app-green-bg)" : "var(--app-red-bg)",
            color: feedback.ok ? "var(--app-green-text)" : "var(--app-red-text)",
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px] items-start">

        {/* ── LEFT ─────────────────────────────────────────────────────── */}
        <div>

          {/* Reservation details */}
          <Section title="Reservation details" noPad aside={
            <span
              className="text-[12px] font-medium cursor-pointer hover:underline"
              style={{ color: "var(--app-blue)" }}
            >
              Edit
            </span>
          }>
            <div className="grid grid-cols-2 sm:grid-cols-2">
              <KV label="Property">{reservation.property.name}</KV>
              <KV label="Source">{reservation.source.charAt(0).toUpperCase() + reservation.source.slice(1)}</KV>
              <KV label="Check-in">{fmtDate(reservation.checkInDate)}</KV>
              <KV label="Check-out">{fmtDate(reservation.checkOutDate)}</KV>
              <KV label="Duration">{nights(reservation.checkInDate, reservation.checkOutDate)}</KV>
              <KV label="Guests">{reservation.guests.length} guest{reservation.guests.length !== 1 ? "s" : ""}</KV>
              {/* Status selector full width */}
              <div className="col-span-2 px-5 py-3">
                <p className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: "var(--app-text-3)" }}>
                  Status
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(
                    [
                      { value: "pending",   label: "Pending"   },
                      { value: "confirmed", label: "Confirmed" },
                      { value: "completed", label: "Completed" },
                      { value: "cancelled", label: "Cancelled" },
                    ] as const
                  ).map(({ value, label }) => {
                    const isActive = reservation.status === value;
                    const meta = STATUS_META[value];
                    return (
                      <button
                        key={value}
                        onClick={() => !isActive && handleStatusChange(value)}
                        disabled={updatingStatus}
                        className="px-[10px] py-[3px] rounded-[8px] text-[11px] font-medium transition disabled:opacity-60"
                        style={{
                          background: isActive ? meta.badgeBg : "var(--app-surface-2)",
                          color: isActive ? meta.badgeColor : "var(--app-text-3)",
                          border: isActive ? "none" : "0.5px solid var(--app-border)",
                          cursor: isActive ? "default" : "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                  {updatingStatus && (
                    <span className="text-[11px]" style={{ color: "var(--app-text-3)" }}>Saving…</span>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* Guests */}
          <Section
            title="Guests"
            noPad
            aside={
              <Badge>{reservation.guests.length} submitted</Badge>
            }
          >
            {reservation.guests.length === 0 ? (
              <div className="px-5 py-5 text-[13px]" style={{ color: "var(--app-text-3)" }}>
                No guests submitted yet.
              </div>
            ) : (
              <div className="px-5 py-5 space-y-3">
                {reservation.guests.map((g, i) => (
                  <div
                    key={g.id}
                    className="rounded-[10px] p-4"
                    style={{ background: "var(--app-surface-2)" }}
                  >
                    {/* Guest header */}
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-semibold flex-shrink-0"
                          style={{ background: "var(--app-blue-bg)", color: "var(--app-blue-text)" }}
                        >
                          {initials(g.fullName)}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium" style={{ color: "var(--app-text-1)" }}>{g.fullName}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: "var(--app-text-3)" }}>
                            {i === 0 ? "Primary guest" : "Additional guest"}
                          </p>
                        </div>
                      </div>
                      {g.documentFileUrl && (
                        <Badge>
                          <span style={{ color: "var(--app-green-text)" }}>Verified</span>
                        </Badge>
                      )}
                    </div>

                    {/* Guest fields */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {g.email && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--app-text-3)" }}>Email</p>
                          <p className="text-[12px]" style={{ color: "var(--app-text-1)" }}>{g.email}</p>
                        </div>
                      )}
                      {g.phone && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--app-text-3)" }}>Phone</p>
                          <p className="text-[12px]" style={{ color: "var(--app-text-1)" }}>{g.phone}</p>
                        </div>
                      )}
                      {g.documentType && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--app-text-3)" }}>Document type</p>
                          <p className="text-[12px] capitalize" style={{ color: "var(--app-text-1)" }}>
                            {g.documentType.replace("_", " ")}
                          </p>
                        </div>
                      )}
                      {g.documentNumber && (
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: "var(--app-text-3)" }}>ID number</p>
                          <p className="text-[12px]" style={{ color: "var(--app-text-1)" }}>{g.documentNumber}</p>
                        </div>
                      )}
                    </div>

                    {g.documentFileUrl && (
                      <a
                        href={g.documentFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-[12px] font-medium hover:underline"
                        style={{ color: "var(--app-blue)" }}
                      >
                        View document →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────── */}
        <div>

          {/* Contract */}
          <Section
            title="Contract"
            aside={contract ? <Badge status={contract.status} /> : undefined}
          >
            {!contract ? (
              <div className="space-y-3">
                <p className="text-[13px]" style={{ color: "var(--app-text-3)" }}>No contract generated yet.</p>
                {reservation.guests.length > 0 && (
                  <button
                    onClick={handleGenerateContract}
                    disabled={generatingContract}
                    className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition disabled:opacity-50"
                    style={{ background: "var(--app-green-bg)", color: "var(--app-green-text)" }}
                  >
                    {generatingContract ? "Generating…" : "Generate contract"}
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* File row */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--app-green-bg)" }}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="4" y="2" width="12" height="16" rx="2" fill="var(--app-green-text)" opacity="0.18"/>
                      <path d="M7 7h6M7 10h6M7 13h4" stroke="var(--app-green-text)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--app-text-1)" }}>Rental Contract</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--app-text-3)" }}>
                      Generated {fmtDate(contract.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                {contract.signatures.map((sig) => (
                  <div
                    key={sig.id}
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 mb-3"
                    style={{ background: "var(--app-surface-2)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M3 13c2-4 4-7 6-7s2 3 3 3 2-2 3-3" stroke="var(--app-blue)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <p className="text-[12px] font-medium" style={{ color: "var(--app-text-1)" }}>
                        Signed by {sig.guest.fullName}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--app-text-3)" }}>
                        {fmtDateTime(sig.signedAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Divider */}
                <div style={{ height: "0.5px", background: "var(--app-border)", margin: "12px 0" }} />

                {/* Actions */}
                {contract.pdfUrl && (
                  <div className="flex items-center justify-between py-[7px]">
                    <span className="text-[12px]" style={{ color: "var(--app-text-2)" }}>Download PDF</span>
                    <a
                      href={contract.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-medium hover:underline"
                      style={{ color: "var(--app-blue)" }}
                    >
                      Download →
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between py-[7px]">
                  <span className="text-[12px]" style={{ color: "var(--app-text-2)" }}>Regenerate contract</span>
                  <button
                    onClick={handleGenerateContract}
                    disabled={generatingContract}
                    className="text-[12px] font-medium hover:underline disabled:opacity-50"
                    style={{ color: "var(--app-blue)" }}
                  >
                    {generatingContract ? "Generating…" : "Regenerate"}
                  </button>
                </div>
              </div>
            )}
          </Section>

          {/* Guest form link */}
          <Section
            title="Guest form link"
            aside={
              activeToken
                ? <Badge><span style={{ color: "var(--app-green-text)" }}>Active</span></Badge>
                : latestToken
                  ? <Badge>Used</Badge>
                  : undefined
            }
          >
            {/* Active token display */}
            {activeToken && (
              <div
                className="rounded-[10px] p-4"
                style={{ background: "var(--app-surface-2)" }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--app-text-3)" }}>
                  Shareable link
                </p>
                <span
                  className="block text-[12px] break-all mb-3"
                  style={{ color: "var(--app-blue)" }}
                >
                  {guestLinkUrl(activeToken.token)}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px]" style={{ color: "var(--app-text-3)" }}>
                    Expires {fmtDate(activeToken.expiresAt)}
                  </span>
                  <button
                    onClick={() => copyUrl(guestLinkUrl(activeToken.token))}
                    className="text-[11px] font-medium px-3 py-1 rounded-[6px] transition flex-shrink-0"
                    style={{
                      background: copiedUrl === guestLinkUrl(activeToken.token) ? "var(--app-green-bg)" : "var(--app-surface)",
                      color: copiedUrl === guestLinkUrl(activeToken.token) ? "var(--app-green-text)" : "var(--app-text-2)",
                      border: "0.5px solid var(--app-border-md)",
                    }}
                  >
                    {copiedUrl === guestLinkUrl(activeToken.token) ? "Copied!" : "Copy link"}
                  </button>
                </div>
              </div>
            )}

            {/* New link (just generated) */}
            {newLink && (
              <div
                className={`rounded-[10px] p-4 ${activeToken ? "mt-3" : ""}`}
                style={{ background: "var(--app-surface-2)" }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: "var(--app-text-3)" }}>
                  New link
                </p>
                <span
                  className="block text-[12px] break-all mb-3"
                  style={{ color: "var(--app-blue)" }}
                >
                  {newLink}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px]" style={{ color: "var(--app-text-3)" }}>Valid for 72 hours</span>
                  <button
                    onClick={() => copyUrl(newLink)}
                    className="text-[11px] font-medium px-3 py-1 rounded-[6px] transition flex-shrink-0"
                    style={{
                      background: copiedUrl === newLink ? "var(--app-green-bg)" : "var(--app-surface)",
                      color: copiedUrl === newLink ? "var(--app-green-text)" : "var(--app-text-2)",
                      border: "0.5px solid var(--app-border-md)",
                    }}
                  >
                    {copiedUrl === newLink ? "Copied!" : "Copy link"}
                  </button>
                </div>
              </div>
            )}

            {/* No active token and no new link */}
            {!activeToken && !newLink && (
              <div className="space-y-2">
                {latestToken && (
                  <p className="text-[12px]" style={{ color: "var(--app-text-3)" }}>
                    {latestToken.used ? "Previous link was already used." : "Previous link has expired."}
                  </p>
                )}
                <button
                  onClick={handleGenerateToken}
                  disabled={generatingToken}
                  className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition disabled:opacity-50"
                  style={{ background: "var(--app-blue)", color: "#ffffff" }}
                >
                  {generatingToken ? "Generating…" : "Generate guest form link"}
                </button>
              </div>
            )}
          </Section>

          {/* Activity timeline */}
          <Section title="Activity">
            <div className="space-y-0">
              {timelineEvents.map((evt, i) => (
                <div key={i} className="flex gap-3">
                  {/* Spine */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-2 h-2 rounded-full mt-[3px]"
                      style={{ background: i === 0 ? "var(--app-green-text)" : "var(--app-border-md)" }}
                    />
                    {i < timelineEvents.length - 1 && (
                      <div
                        className="w-px flex-1 mt-1"
                        style={{ background: "var(--app-border)", minHeight: 20 }}
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`pb-4 ${i === timelineEvents.length - 1 ? "pb-0" : ""}`}>
                    <p className="text-[12px] font-medium" style={{ color: "var(--app-text-1)" }}>{evt.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--app-text-3)" }}>
                      {fmtDateTime(evt.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Delete zone */}
          <div
            className="rounded-[12px] px-5 py-4"
            style={{ background: "var(--app-surface)", border: "0.5px solid var(--app-border)" }}
          >
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] flex-1" style={{ color: "var(--app-text-2)" }}>
                  Delete this reservation permanently?
                </span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-[5px] rounded-[8px] text-[12px] font-medium transition disabled:opacity-50"
                  style={{ background: "var(--app-red-text)", color: "#ffffff" }}
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-[5px] rounded-[8px] text-[12px] transition"
                  style={{ color: "var(--app-text-2)" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-[12px] font-medium transition hover:underline"
                style={{ color: "var(--app-red-text)" }}
              >
                Delete reservation
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
