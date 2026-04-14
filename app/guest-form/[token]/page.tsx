"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";

// ── Types ─────────────────────────────────────────────────────────────────

interface FormData {
  reservationId: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
}

interface GuestEntry {
  fullName: string;
  email: string;
  phone: string;
  documentType: string;
  documentNumber: string;
  documentFile: File | null;
}

function emptyGuest(): GuestEntry {
  return { fullName: "", email: "", phone: "", documentType: "passport", documentNumber: "", documentFile: null };
}

const DOC_LABELS: Record<string, string> = {
  passport: "Passport",
  id_card: "National ID Card",
  driving_license: "Driving License",
};

async function uploadFile(file: File, index: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await fetch("/api/upload/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: reader.result, fileName: `guest-${index}-doc-${Date.now()}` }),
      });
      const data = await res.json();
      if (data.url) resolve(data.url);
      else reject(new Error("Upload failed"));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Styled components ─────────────────────────────────────────────────────

const Page = styled.main`
  min-height: 100vh;
  background: #f5f5f3;
  padding: 2rem 1rem;
`;

const PageCenter = styled.main`
  min-height: 100vh;
  background: #f5f5f3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
`;

const Container = styled.div`
  max-width: 480px;
  margin: 0 auto;
`;

const CenterBox = styled.div`
  text-align: center;
  max-width: 360px;
`;

const LoadingText = styled.p`
  padding: 2rem;
  font-size: 0.875rem;
  text-align: center;
  color: #9ca3af;
`;

const ErrorTitle = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
`;

const MutedText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const SuccessIcon = styled.div`
  font-size: 3rem;
  color: #22c55e;
  margin-bottom: 1rem;
`;

const SuccessTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #111827;
`;

const PropertyCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const PropertyName = styled.h1`
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
`;

const PropertyDates = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.125rem;
`;

const StepCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StepTitle = styled.h2`
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
`;

const StepSubtitle = styled.p`
  font-size: 0.875rem;
  color: #9ca3af;
  margin-top: 0.25rem;
`;

const CounterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CounterBtn = styled.button`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 1.125rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover { background: #f9fafb; }
`;

const CounterValue = styled.span`
  font-size: 1.875rem;
  font-weight: 600;
  color: #111827;
  width: 2rem;
  text-align: center;
`;

const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GuestCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GuestCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GuestCardTitle = styled.h2`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const GuestCardIndex = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
`;

const StyledInput = styled.input`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  background: #ffffff;
  color: #111827;
  box-sizing: border-box;
  transition: box-shadow 0.15s;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
  }
`;

const DocTypeRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const DocTypeBtn = styled.button<{ $selected: boolean }>`
  flex: 1;
  padding: 0.5rem 0;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid ${({ $selected }) => $selected ? "#bfdbfe" : "#e5e7eb"};
  background: ${({ $selected }) => $selected ? "#eff6ff" : "#ffffff"};
  color: ${({ $selected }) => $selected ? "#1d4ed8" : "#6b7280"};
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  background: #f0fdf4;
`;

const FilePreviewName = styled.span`
  font-size: 0.75rem;
  color: #15803d;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveFileBtn = styled.button`
  font-size: 0.75rem;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 0.5rem;
  padding: 0;

  &:hover { color: #dc2626; }
`;

const DropLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem 1rem;
  cursor: pointer;
  background: #f9fafb;
  transition: border-color 0.15s;

  &:hover { border-color: #60a5fa; }
`;

const DropText = styled.span`
  font-size: 0.875rem;
  color: #9ca3af;
`;

const DropHint = styled.span`
  font-size: 0.75rem;
  color: #d1d5db;
`;

const FieldErrorText = styled.p`
  font-size: 0.875rem;
  color: #dc2626;
  text-align: center;
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const BackBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #f9fafb; }
`;

const PrimaryBtn = styled.button`
  flex: 1;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:not(:disabled):hover { opacity: 0.9; }
`;

const SignCtaBtn = styled.button`
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.625rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
`;

export default function GuestFormPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [formData, setFormData]     = useState<FormData | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [loading, setLoading]       = useState(true);

  // Step 1 — guest count
  const [step, setStep]             = useState<1 | 2>(1);
  const [guestCount, setGuestCount] = useState(1);

  // Step 2 — per-guest entries
  const [guests, setGuests]         = useState<GuestEntry[]>([emptyGuest()]);
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Done state
  const [guestId, setGuestId]       = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    fetch(`/api/guest-form/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setTokenError(data.error);
        else setFormData(data);
        setLoading(false);
      });
  }, [token]);

  // Keep guests array in sync with guestCount
  function handleGuestCountConfirm() {
    const count = Math.max(1, Math.min(10, guestCount));
    const next: GuestEntry[] = Array.from({ length: count }, (_, i) => guests[i] ?? emptyGuest());
    setGuests(next);
    setStep(2);
  }

  function updateGuest(index: number, field: keyof GuestEntry, value: string | File | null) {
    setGuests((prev) => prev.map((g, i) => i === index ? { ...g, [field]: value } : g));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError("");

    // Validate main guest
    const main = guests[0];
    if (!main.fullName || !main.email || !main.phone || !main.documentNumber || !main.documentFile) {
      setFieldError("Please complete all required fields for the main guest.");
      return;
    }
    // Validate additional guests
    for (let i = 1; i < guests.length; i++) {
      const g = guests[i];
      if (!g.fullName || !g.documentNumber || !g.documentFile) {
        setFieldError(`Please complete the required fields for Guest ${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Upload all documents in parallel
      const uploadedUrls = await Promise.all(
        guests.map((g, i) => uploadFile(g.documentFile!, i))
      );

      const payload = guests.map((g, i) => ({
        fullName: g.fullName,
        ...(i === 0 ? { email: g.email, phone: g.phone } : {}),
        documentType: g.documentType,
        documentNumber: g.documentNumber,
        documentFileUrl: uploadedUrls[i],
      }));

      const res = await fetch(`/api/guest-form/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guests: payload }),
      });
      const data = await res.json();
      if (data.error) { setFieldError(typeof data.error === "string" ? data.error : "Submission failed."); return; }
      setGuestId(data.id);
      setContractId(data.contractId ?? null);
      setSubmitted(true);
    } catch {
      setFieldError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error / done states ─────────────────────────────────────────

  if (loading) return <LoadingText>Loading…</LoadingText>;

  if (tokenError) return (
    <PageCenter>
      <CenterBox>
        <ErrorTitle>Link unavailable</ErrorTitle>
        <MutedText>{tokenError}</MutedText>
      </CenterBox>
    </PageCenter>
  );

  if (submitted) return (
    <PageCenter>
      <CenterBox>
        <SuccessIcon>✓</SuccessIcon>
        <SuccessTitle>Information submitted!</SuccessTitle>
        {contractId && guestId ? (
          <>
            <MutedText>Your contract is ready. Please sign it to complete check-in.</MutedText>
            <SignCtaBtn
              onClick={() => router.push(`/guest-form/${token}/sign?contractId=${contractId}&guestId=${guestId}`)}
            >
              Continue to Sign Contract →
            </SignCtaBtn>
          </>
        ) : (
          <MutedText>Thank you. Your host will send you a signing link shortly.</MutedText>
        )}
      </CenterBox>
    </PageCenter>
  );

  // ── Property header ────────────────────────────────────────────────────────

  const header = (
    <PropertyCard>
      <PropertyName>{formData?.propertyName}</PropertyName>
      <PropertyDates>
        {formData
          ? `${new Date(formData.checkInDate).toLocaleDateString("en-GB")} → ${new Date(formData.checkOutDate).toLocaleDateString("en-GB")}`
          : ""}
      </PropertyDates>
    </PropertyCard>
  );

  // ── Step 1 — guest count ───────────────────────────────────────────────────

  if (step === 1) return (
    <Page>
      <Container>
        {header}
        <StepCard>
          <div>
            <StepTitle>How many guests?</StepTitle>
            <StepSubtitle>Include yourself. Each guest will need to provide a valid ID document.</StepSubtitle>
          </div>

          <CounterRow>
            <CounterBtn type="button" onClick={() => setGuestCount((n) => Math.max(1, n - 1))}>−</CounterBtn>
            <CounterValue>{guestCount}</CounterValue>
            <CounterBtn type="button" onClick={() => setGuestCount((n) => Math.min(10, n + 1))}>+</CounterBtn>
          </CounterRow>

          <PrimaryBtn onClick={handleGuestCountConfirm}>Continue →</PrimaryBtn>
        </StepCard>
      </Container>
    </Page>
  );

  // ── Step 2 — guest details ─────────────────────────────────────────────────

  return (
    <Page>
      <Container>
        {header}

        <FormStack onSubmit={handleSubmit}>
          {guests.map((g, i) => {
            const isMain = i === 0;
            return (
              <GuestCard key={i}>
                <GuestCardHeader>
                  <GuestCardTitle>
                    {isMain ? "Your information (main guest)" : `Guest ${i + 1}`}
                  </GuestCardTitle>
                  {guests.length > 1 && (
                    <GuestCardIndex>{i + 1} / {guests.length}</GuestCardIndex>
                  )}
                </GuestCardHeader>

                {/* Full name */}
                <div>
                  <FieldLabel>Full Name *</FieldLabel>
                  <StyledInput type="text" required value={g.fullName}
                    onChange={(e) => updateGuest(i, "fullName", e.target.value)}
                    placeholder="Jane Doe" />
                </div>

                {/* Email & phone — main guest only */}
                {isMain && (
                  <>
                    <div>
                      <FieldLabel>Email *</FieldLabel>
                      <StyledInput type="email" required value={g.email}
                        onChange={(e) => updateGuest(i, "email", e.target.value)}
                        placeholder="you@example.com" />
                    </div>
                    <div>
                      <FieldLabel>Phone / WhatsApp *</FieldLabel>
                      <StyledInput type="tel" required value={g.phone}
                        onChange={(e) => updateGuest(i, "phone", e.target.value)}
                        placeholder="+212 6 12 34 56 78" />
                    </div>
                  </>
                )}

                {/* Document type */}
                <div>
                  <FieldLabel>Document Type *</FieldLabel>
                  <DocTypeRow>
                    {(["passport", "id_card", "driving_license"] as const).map((type) => (
                      <DocTypeBtn
                        key={type}
                        type="button"
                        $selected={g.documentType === type}
                        onClick={() => updateGuest(i, "documentType", type)}
                      >
                        {DOC_LABELS[type]}
                      </DocTypeBtn>
                    ))}
                  </DocTypeRow>
                </div>

                {/* Document number */}
                <div>
                  <FieldLabel>{DOC_LABELS[g.documentType]} Number *</FieldLabel>
                  <StyledInput type="text" required value={g.documentNumber}
                    onChange={(e) => updateGuest(i, "documentNumber", e.target.value)}
                    placeholder="AB123456" />
                </div>

                {/* Document upload */}
                <div>
                  <FieldLabel>Upload {DOC_LABELS[g.documentType]} *</FieldLabel>
                  {g.documentFile ? (
                    <FilePreview>
                      <FilePreviewName>{g.documentFile.name}</FilePreviewName>
                      <RemoveFileBtn type="button" onClick={() => updateGuest(i, "documentFile", null)}>
                        Remove
                      </RemoveFileBtn>
                    </FilePreview>
                  ) : (
                    <DropLabel>
                      <DropText>Tap to upload photo or scan</DropText>
                      <DropHint>JPG, PNG or PDF</DropHint>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        style={{ display: "none" }}
                        onChange={(e) => updateGuest(i, "documentFile", e.target.files?.[0] ?? null)}
                      />
                    </DropLabel>
                  )}
                </div>
              </GuestCard>
            );
          })}

          {fieldError && <FieldErrorText>{fieldError}</FieldErrorText>}

          <FormActions>
            <BackBtn type="button" onClick={() => setStep(1)}>← Back</BackBtn>
            <PrimaryBtn type="submit" disabled={submitting}>
              {submitting ? "Uploading & submitting…" : `Submit ${guests.length > 1 ? `${guests.length} guests` : "information"}`}
            </PrimaryBtn>
          </FormActions>
        </FormStack>
      </Container>
    </Page>
  );
}
