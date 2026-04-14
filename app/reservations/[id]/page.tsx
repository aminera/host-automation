"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";

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

// ── Styled components ────────────────────────────────────────────────────────

const PageWrap = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 28px 32px;
`;

const BreadNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--app-text-3);
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const BreadLink = styled(Link)`
  color: var(--app-text-2);
  &:hover { text-decoration: underline; }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const PageTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const PageSubtitle = styled.p`
  font-size: 12px;
  margin-top: 4px;
  color: var(--app-text-3);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const OutlineBtn = styled.button<{ $danger?: boolean; $primary?: boolean }>`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: 0.5px solid ${(p) => p.$danger ? "#F7C1C1" : p.$primary ? "transparent" : "var(--app-border-md)"};
  background: ${(p) => p.$primary ? "var(--app-blue)" : "var(--app-surface)"};
  color: ${(p) => p.$danger ? "var(--app-red-text)" : p.$primary ? "#ffffff" : "var(--app-text-1)"};
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const FeedbackBar = styled.div<{ $ok: boolean }>`
  margin-bottom: 16px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: ${(p) => p.$ok ? "var(--app-green-bg)" : "var(--app-red-bg)"};
  color: ${(p) => p.$ok ? "var(--app-green-text)" : "var(--app-red-text)"};
`;

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 300px;
  }
`;

const BadgeSpan = styled.span<{ $bg: string; $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
`;

// Section components
const SectionWrap = styled.div`
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 20px;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  &:last-child { margin-bottom: 0; }
`;

const SectionHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 0.5px solid var(--app-border);
`;

const SectionHeadTitle = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const SectionBody = styled.div`
  padding: 20px;
`;

// KV components
const KvRow = styled.div`
  padding: 12px 20px;
  border-bottom: 0.5px solid var(--app-border);
`;

const KvLabel = styled.p`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  color: var(--app-text-3);
`;

const KvValue = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const KvGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const KvGridFull = styled.div`
  grid-column: span 2;
  padding: 12px 20px;
`;

// Status pills
const StatusPillWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const StatusPill = styled.button<{ $active: boolean; $bg: string; $color: string }>`
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  cursor: ${(p) => p.$active ? "default" : "pointer"};
  background: ${(p) => p.$active ? p.$bg : "var(--app-surface-2)"};
  color: ${(p) => p.$active ? p.$color : "var(--app-text-3)"};
  border: ${(p) => p.$active ? "none" : "0.5px solid var(--app-border)"};
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; }
`;

const SavingText = styled.span`
  font-size: 11px;
  color: var(--app-text-3);
`;

// Guest card
const GuestList = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const GuestCard = styled.div`
  border-radius: 10px;
  padding: 16px;
  background: var(--app-surface-2);
`;

const GuestCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
`;

const GuestCardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  background: var(--app-blue-bg);
  color: var(--app-blue-text);
`;

const GuestName = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const GuestRole = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const GuestFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const FieldMicroLabel = styled.p`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
  color: var(--app-text-3);
`;

const FieldText = styled.p`
  font-size: 12px;
  color: var(--app-text-1);
`;

const DocLink = styled.a`
  display: inline-block;
  margin-top: 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--app-blue);
  &:hover { text-decoration: underline; }
`;

const EmptyMsg = styled.div`
  padding: 20px;
  font-size: 13px;
  color: var(--app-text-3);
`;

// Contract
const ContractFileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ContractFileIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--app-green-bg);
`;

const ContractFileName = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const ContractFileMeta = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const SignRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: var(--app-surface-2);
`;

const SignName = styled.p`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const SignMeta = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const ContractDivider = styled.div`
  height: 0.5px;
  background: var(--app-border);
  margin: 12px 0;
`;

const ContractAction = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 0;
`;

const ContractActionLabel = styled.span`
  font-size: 12px;
  color: var(--app-text-2);
`;

const ContractActionBtn = styled.button`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-blue);
  background: none;
  border: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
  &:disabled { opacity: 0.5; }
`;

const ContractActionLink = styled.a`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-blue);
  &:hover { text-decoration: underline; }
`;

const ContractEmpty = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContractEmptyText = styled.p`
  font-size: 13px;
  color: var(--app-text-3);
`;

const GenerateContractBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-green-bg);
  color: var(--app-green-text);
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; }
`;

// Guest form link
const LinkBox = styled.div<{ $mt?: boolean }>`
  border-radius: 10px;
  padding: 16px;
  background: var(--app-surface-2);
  ${(p) => p.$mt ? "margin-top: 12px;" : ""}
`;

const LinkLabel = styled.p`
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
  color: var(--app-text-3);
`;

const LinkUrl = styled.span`
  display: block;
  font-size: 12px;
  word-break: break-all;
  margin-bottom: 12px;
  color: var(--app-blue);
`;

const LinkFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const LinkExpiry = styled.span`
  font-size: 11px;
  color: var(--app-text-3);
`;

const CopyBtn = styled.button<{ $copied: boolean }>`
  font-size: 11px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 0.5px solid var(--app-border-md);
  background: ${(p) => p.$copied ? "var(--app-green-bg)" : "var(--app-surface)"};
  color: ${(p) => p.$copied ? "var(--app-green-text)" : "var(--app-text-2)"};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
`;

const NoLinkWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoLinkText = styled.p`
  font-size: 12px;
  color: var(--app-text-3);
`;

const GenerateLinkBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-blue);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; }
`;

// Timeline
const TimelineItem = styled.div`
  display: flex;
  gap: 12px;
`;

const TimelineSpine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
`;

const TimelineDot = styled.div<{ $active?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 3px;
  background: ${(p) => p.$active ? "var(--app-green-text)" : "var(--app-border-md)"};
`;

const TimelineLine = styled.div`
  width: 1px;
  flex: 1;
  margin-top: 4px;
  background: var(--app-border);
  min-height: 20px;
`;

const TimelineContent = styled.div<{ $last?: boolean }>`
  padding-bottom: ${(p) => p.$last ? "0" : "16px"};
`;

const TimelineTitle = styled.p`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const TimelineMeta = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

// Delete zone
const DeleteZone = styled.div`
  border-radius: 12px;
  padding: 16px 20px;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
`;

const DeleteConfirmRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DeleteConfirmText = styled.span`
  font-size: 12px;
  flex: 1;
  color: var(--app-text-2);
`;

const ConfirmDeleteBtn = styled.button`
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  background: var(--app-red-text);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; }
`;

const CancelConfirmBtn = styled.button`
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--app-text-2);
  background: none;
  border: none;
  cursor: pointer;
`;

const DeleteBtn = styled.button`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-red-text);
  background: none;
  border: none;
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const EditLink = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--app-blue);
  cursor: pointer;
  &:hover { text-decoration: underline; }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function Badge({ status, children }: { status?: string; children?: ReactNode }) {
  const meta = status
    ? (STATUS_META[status] ?? { label: status, badgeBg: "var(--app-surface-2)", badgeColor: "var(--app-text-2)" })
    : null;
  return (
    <BadgeSpan $bg={meta?.badgeBg ?? "var(--app-surface-2)"} $color={meta?.badgeColor ?? "var(--app-text-2)"}>
      {meta?.label ?? children}
    </BadgeSpan>
  );
}

function Section({ title, aside, noPad, children }: {
  title: string;
  aside?: ReactNode;
  noPad?: boolean;
  children: ReactNode;
}) {
  return (
    <SectionWrap>
      <SectionHead>
        <SectionHeadTitle>{title}</SectionHeadTitle>
        {aside}
      </SectionHead>
      {noPad ? children : <SectionBody>{children}</SectionBody>}
    </SectionWrap>
  );
}

function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <KvRow>
      <KvLabel>{label}</KvLabel>
      <KvValue>{children}</KvValue>
    </KvRow>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading]         = useState(true);

  const [generatingToken,    setGeneratingToken]    = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [updatingStatus,     setUpdatingStatus]     = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);

  const [newLink,   setNewLink]   = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

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

  if (loading) return (
    <PageWrap>
      <EmptyMsg style={{ textAlign: "center" }}>Loading…</EmptyMsg>
    </PageWrap>
  );
  if (!reservation) return (
    <PageWrap>
      <EmptyMsg style={{ textAlign: "center", color: "var(--app-red-text)" }}>Reservation not found.</EmptyMsg>
    </PageWrap>
  );

  const latestToken = reservation.guestFormTokens[0] ?? null;
  const activeToken = latestToken && !latestToken.used && !isExpired(latestToken.expiresAt) ? latestToken : null;
  const contract    = reservation.contracts[0] ?? null;

  const guestLinkUrl = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/guest-form/${token}` : "";

  const timelineEvents: { title: string; time: string }[] = [
    { title: "Reservation created", time: reservation.createdAt },
    ...(latestToken ? [{ title: "Guest link sent", time: latestToken.createdAt }] : []),
    ...(reservation.guests.length > 0 ? [{ title: "Guest form submitted", time: reservation.guests[0].createdAt }] : []),
    ...(contract ? [{ title: "Contract generated", time: contract.createdAt }] : []),
    ...(contract?.signatures.map((s) => ({ title: `Signed by ${s.guest.fullName}`, time: s.signedAt })) ?? []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <PageWrap>
      {/* Breadcrumb */}
      <BreadNav>
        <BreadLink href="/dashboard">Dashboard</BreadLink>
        <span>/</span>
        <BreadLink href="/dashboard">Reservations</BreadLink>
        <span>/</span>
        <span>{reservation.property.name}</span>
      </BreadNav>

      {/* Page header */}
      <PageHeader>
        <div>
          <PageTitleRow>
            <PageTitle>{reservation.property.name}</PageTitle>
            <Badge status={reservation.status} />
          </PageTitleRow>
          <PageSubtitle>
            Reservation #{reservation.id.slice(0, 8).toUpperCase()} · Created {fmtDate(reservation.createdAt)}
          </PageSubtitle>
        </div>

        <HeaderActions>
          <OutlineBtn onClick={handleGenerateToken} disabled={generatingToken}>
            {generatingToken ? "Generating…" : "Regenerate link"}
          </OutlineBtn>

          <OutlineBtn $primary onClick={handleGenerateContract} disabled={generatingContract}>
            {generatingContract ? "Generating…" : "Generate contract"}
          </OutlineBtn>

          {reservation.status !== "cancelled" ? (
            <OutlineBtn $danger onClick={() => handleStatusChange("cancelled")} disabled={updatingStatus}>
              Cancel
            </OutlineBtn>
          ) : (
            <OutlineBtn onClick={() => handleStatusChange("pending")} disabled={updatingStatus}>
              Reopen
            </OutlineBtn>
          )}
        </HeaderActions>
      </PageHeader>

      {/* Feedback toast */}
      {feedback && <FeedbackBar $ok={feedback.ok}>{feedback.text}</FeedbackBar>}

      {/* Two-column layout */}
      <TwoColGrid>

        {/* ── LEFT ─────────────────────────────────────────────────────── */}
        <div>

          {/* Reservation details */}
          <Section title="Reservation details" noPad aside={<EditLink>Edit</EditLink>}>
            <KvGrid>
              <KV label="Property">{reservation.property.name}</KV>
              <KV label="Source">{reservation.source.charAt(0).toUpperCase() + reservation.source.slice(1)}</KV>
              <KV label="Check-in">{fmtDate(reservation.checkInDate)}</KV>
              <KV label="Check-out">{fmtDate(reservation.checkOutDate)}</KV>
              <KV label="Duration">{nights(reservation.checkInDate, reservation.checkOutDate)}</KV>
              <KV label="Guests">{reservation.guests.length} guest{reservation.guests.length !== 1 ? "s" : ""}</KV>
              <KvGridFull>
                <KvLabel>Status</KvLabel>
                <StatusPillWrap>
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
                      <StatusPill
                        key={value}
                        $active={isActive}
                        $bg={meta.badgeBg}
                        $color={meta.badgeColor}
                        onClick={() => !isActive && handleStatusChange(value)}
                        disabled={updatingStatus}
                      >
                        {label}
                      </StatusPill>
                    );
                  })}
                  {updatingStatus && <SavingText>Saving…</SavingText>}
                </StatusPillWrap>
              </KvGridFull>
            </KvGrid>
          </Section>

          {/* Guests */}
          <Section
            title="Guests"
            noPad
            aside={<Badge>{reservation.guests.length} submitted</Badge>}
          >
            {reservation.guests.length === 0 ? (
              <EmptyMsg>No guests submitted yet.</EmptyMsg>
            ) : (
              <GuestList>
                {reservation.guests.map((g, i) => (
                  <GuestCard key={g.id}>
                    <GuestCardHeader>
                      <GuestCardLeft>
                        <Avatar>{initials(g.fullName)}</Avatar>
                        <div>
                          <GuestName>{g.fullName}</GuestName>
                          <GuestRole>{i === 0 ? "Primary guest" : "Additional guest"}</GuestRole>
                        </div>
                      </GuestCardLeft>
                      {g.documentFileUrl && (
                        <BadgeSpan $bg="var(--app-surface-2)" $color="var(--app-green-text)">Verified</BadgeSpan>
                      )}
                    </GuestCardHeader>

                    <GuestFields>
                      {g.email && (
                        <div>
                          <FieldMicroLabel>Email</FieldMicroLabel>
                          <FieldText>{g.email}</FieldText>
                        </div>
                      )}
                      {g.phone && (
                        <div>
                          <FieldMicroLabel>Phone</FieldMicroLabel>
                          <FieldText>{g.phone}</FieldText>
                        </div>
                      )}
                      {g.documentType && (
                        <div>
                          <FieldMicroLabel>Document type</FieldMicroLabel>
                          <FieldText style={{ textTransform: "capitalize" }}>
                            {g.documentType.replace("_", " ")}
                          </FieldText>
                        </div>
                      )}
                      {g.documentNumber && (
                        <div>
                          <FieldMicroLabel>ID number</FieldMicroLabel>
                          <FieldText>{g.documentNumber}</FieldText>
                        </div>
                      )}
                    </GuestFields>

                    {g.documentFileUrl && (
                      <DocLink href={g.documentFileUrl} target="_blank" rel="noreferrer">
                        View document →
                      </DocLink>
                    )}
                  </GuestCard>
                ))}
              </GuestList>
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
              <ContractEmpty>
                <ContractEmptyText>No contract generated yet.</ContractEmptyText>
                {reservation.guests.length > 0 && (
                  <GenerateContractBtn onClick={handleGenerateContract} disabled={generatingContract}>
                    {generatingContract ? "Generating…" : "Generate contract"}
                  </GenerateContractBtn>
                )}
              </ContractEmpty>
            ) : (
              <div>
                <ContractFileRow>
                  <ContractFileIcon>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="4" y="2" width="12" height="16" rx="2" fill="var(--app-green-text)" opacity="0.18"/>
                      <path d="M7 7h6M7 10h6M7 13h4" stroke="var(--app-green-text)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </ContractFileIcon>
                  <div>
                    <ContractFileName>Rental Contract</ContractFileName>
                    <ContractFileMeta>Generated {fmtDate(contract.createdAt)}</ContractFileMeta>
                  </div>
                </ContractFileRow>

                {contract.signatures.map((sig) => (
                  <SignRow key={sig.id}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M3 13c2-4 4-7 6-7s2 3 3 3 2-2 3-3" stroke="var(--app-blue)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <div>
                      <SignName>Signed by {sig.guest.fullName}</SignName>
                      <SignMeta>{fmtDateTime(sig.signedAt)}</SignMeta>
                    </div>
                  </SignRow>
                ))}

                <ContractDivider />

                {contract.pdfUrl && (
                  <ContractAction>
                    <ContractActionLabel>Download PDF</ContractActionLabel>
                    <ContractActionLink href={contract.pdfUrl} target="_blank" rel="noreferrer">
                      Download →
                    </ContractActionLink>
                  </ContractAction>
                )}
                <ContractAction>
                  <ContractActionLabel>Regenerate contract</ContractActionLabel>
                  <ContractActionBtn onClick={handleGenerateContract} disabled={generatingContract}>
                    {generatingContract ? "Generating…" : "Regenerate"}
                  </ContractActionBtn>
                </ContractAction>
              </div>
            )}
          </Section>

          {/* Guest form link */}
          <Section
            title="Guest form link"
            aside={
              activeToken
                ? <BadgeSpan $bg="var(--app-surface-2)" $color="var(--app-green-text)">Active</BadgeSpan>
                : latestToken
                  ? <Badge>Used</Badge>
                  : undefined
            }
          >
            {activeToken && (
              <LinkBox>
                <LinkLabel>Shareable link</LinkLabel>
                <LinkUrl>{guestLinkUrl(activeToken.token)}</LinkUrl>
                <LinkFooter>
                  <LinkExpiry>Expires {fmtDate(activeToken.expiresAt)}</LinkExpiry>
                  <CopyBtn
                    $copied={copiedUrl === guestLinkUrl(activeToken.token)}
                    onClick={() => copyUrl(guestLinkUrl(activeToken.token))}
                  >
                    {copiedUrl === guestLinkUrl(activeToken.token) ? "Copied!" : "Copy link"}
                  </CopyBtn>
                </LinkFooter>
              </LinkBox>
            )}

            {newLink && (
              <LinkBox $mt={!!activeToken}>
                <LinkLabel>New link</LinkLabel>
                <LinkUrl>{newLink}</LinkUrl>
                <LinkFooter>
                  <LinkExpiry>Valid for 72 hours</LinkExpiry>
                  <CopyBtn $copied={copiedUrl === newLink} onClick={() => copyUrl(newLink)}>
                    {copiedUrl === newLink ? "Copied!" : "Copy link"}
                  </CopyBtn>
                </LinkFooter>
              </LinkBox>
            )}

            {!activeToken && !newLink && (
              <NoLinkWrap>
                {latestToken && (
                  <NoLinkText>
                    {latestToken.used ? "Previous link was already used." : "Previous link has expired."}
                  </NoLinkText>
                )}
                <GenerateLinkBtn onClick={handleGenerateToken} disabled={generatingToken}>
                  {generatingToken ? "Generating…" : "Generate guest form link"}
                </GenerateLinkBtn>
              </NoLinkWrap>
            )}
          </Section>

          {/* Activity timeline */}
          <Section title="Activity">
            <div>
              {timelineEvents.map((evt, i) => (
                <TimelineItem key={i}>
                  <TimelineSpine>
                    <TimelineDot $active={i === 0} />
                    {i < timelineEvents.length - 1 && <TimelineLine />}
                  </TimelineSpine>
                  <TimelineContent $last={i === timelineEvents.length - 1}>
                    <TimelineTitle>{evt.title}</TimelineTitle>
                    <TimelineMeta>{fmtDateTime(evt.time)}</TimelineMeta>
                  </TimelineContent>
                </TimelineItem>
              ))}
            </div>
          </Section>

          {/* Delete zone */}
          <DeleteZone>
            {showDeleteConfirm ? (
              <DeleteConfirmRow>
                <DeleteConfirmText>Delete this reservation permanently?</DeleteConfirmText>
                <ConfirmDeleteBtn onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting…" : "Yes, delete"}
                </ConfirmDeleteBtn>
                <CancelConfirmBtn onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </CancelConfirmBtn>
              </DeleteConfirmRow>
            ) : (
              <DeleteBtn onClick={() => setShowDeleteConfirm(true)}>
                Delete reservation
              </DeleteBtn>
            )}
          </DeleteZone>

        </div>
      </TwoColGrid>
    </PageWrap>
  );
}
