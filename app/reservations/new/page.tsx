"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";

interface BookedRange {
  id: string;
  checkIn: string;
  checkOut: string;
}

function findConflict(checkIn: string, checkOut: string, booked: BookedRange[]): BookedRange | null {
  if (!checkIn || !checkOut) return null;
  const newIn = new Date(checkIn).getTime();
  const newOut = new Date(checkOut).getTime();
  return booked.find((r) =>
    newIn < new Date(r.checkOut).getTime() && new Date(r.checkIn).getTime() < newOut
  ) ?? null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Styled components ─────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 540px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BackLink = styled(Link)`
  font-size: 13px;
  color: var(--app-blue);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const Card = styled.div`
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 0.5px solid var(--app-border);
`;

const CardTitle = styled.h1`
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const CardSubtitle = styled.p`
  font-size: 12px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const Form = styled.form`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FieldGroup = styled.div``;

const FieldLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  color: var(--app-text-3);
`;

const StyledInput = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  border: 0.5px solid ${({ $hasError }) => $hasError ? "var(--app-red-text)" : "var(--app-border-md)"};
  background: ${({ $hasError }) => $hasError ? "var(--app-amber-bg)" : "var(--app-surface)"};
  color: var(--app-text-1);
`;

const StyledSelect = styled.select`
  width: 100%;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  border: 0.5px solid var(--app-border-md);
  background: var(--app-surface);
  color: var(--app-text-1);
`;

const DateRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const DateField = styled.div`
  flex: 1;
`;

const ConflictAlert = styled.div`
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 12px;
  background: var(--app-amber-bg);
  color: var(--app-amber-text);
  border: 0.5px solid var(--app-amber-text);
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: var(--app-red-text);
`;

const LoadingText = styled.p`
  font-size: 13px;
  color: var(--app-text-3);
`;

const SubmitBtn = styled.button`
  width: 100%;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: var(--app-blue);
  color: #ffffff;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// ── Component ─────────────────────────────────────────────────────────────

export default function NewReservationPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [source, setSource] = useState("airbnb");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => {
        setProperties(data);
        if (data.length > 0) setPropertyId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!propertyId) return;
    setBookedRanges([]);
    setCheckIn("");
    setCheckOut("");
    setError("");
    fetch(`/api/properties/${propertyId}/booked-dates`)
      .then((r) => r.json())
      .then((data: BookedRange[]) => setBookedRanges(data));
  }, [propertyId]);

  const conflict = findConflict(checkIn, checkOut, bookedRanges);
  const checkOutBeforeIn = checkIn && checkOut && new Date(checkOut) <= new Date(checkIn);
  const hasDateError = !!(conflict || checkOutBeforeIn);

  function handleCheckInChange(v: string) {
    setCheckIn(v);
    setError("");
    if (checkOut && new Date(checkOut) <= new Date(v)) setCheckOut("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!propertyId || !checkIn || !checkOut) { setError("All fields are required."); return; }
    if (checkOutBeforeIn) { setError("Check-out must be after check-in."); return; }
    if (conflict) {
      setError(`These dates overlap with a reservation from ${formatDate(conflict.checkIn)} to ${formatDate(conflict.checkOut)}.`);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        checkInDate: new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        source,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.error) setError(typeof data.error === "string" ? data.error : "Validation error.");
    else router.push(`/reservations/${data.id}`);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Page>
      <BackLink href="/dashboard">← Back to Dashboard</BackLink>

      <Card>
        <CardHeader>
          <CardTitle>New Reservation</CardTitle>
          <CardSubtitle>Fill in the details to create a reservation.</CardSubtitle>
        </CardHeader>

        <Form onSubmit={handleSubmit}>
          <FieldGroup>
            <FieldLabel>Property</FieldLabel>
            {properties.length === 0 ? (
              <LoadingText>Loading properties…</LoadingText>
            ) : (
              <StyledSelect value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </StyledSelect>
            )}
          </FieldGroup>

          <DateRow>
            <DateField>
              <FieldLabel>Check-In</FieldLabel>
              <StyledInput
                type="date"
                required
                value={checkIn}
                min={today}
                onChange={(e) => handleCheckInChange(e.target.value)}
                $hasError={hasDateError && !!checkIn}
              />
            </DateField>
            <DateField>
              <FieldLabel>Check-Out</FieldLabel>
              <StyledInput
                type="date"
                required
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => { setCheckOut(e.target.value); setError(""); }}
                $hasError={hasDateError && !!checkOut}
              />
            </DateField>
          </DateRow>

          {conflict && checkIn && checkOut && (
            <ConflictAlert>
              Already booked from <strong>{formatDate(conflict.checkIn)}</strong> to{" "}
              <strong>{formatDate(conflict.checkOut)}</strong>. Choose different dates.
            </ConflictAlert>
          )}

          <FieldGroup>
            <FieldLabel>Source</FieldLabel>
            <StyledSelect value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="airbnb">Airbnb</option>
              <option value="booking">Booking.com</option>
              <option value="direct">Direct</option>
            </StyledSelect>
          </FieldGroup>

          {error && <ErrorText>{error}</ErrorText>}

          <SubmitBtn
            type="submit"
            disabled={submitting || properties.length === 0 || hasDateError}
          >
            {submitting ? "Creating…" : "Create Reservation"}
          </SubmitBtn>
        </Form>
      </Card>
    </Page>
  );
}

