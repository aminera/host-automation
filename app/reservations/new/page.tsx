"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

interface DateInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  hasError?: boolean;
}

function DateInput({ label, value, onChange, min, hasError }: DateInputProps) {
  return (
    <div className="flex-1">
      <label
        className="block text-[11px] font-medium uppercase tracking-wide mb-1"
        style={{ color: "var(--app-text-3)" }}
      >
        {label}
      </label>
      <input
        type="date"
        required
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[8px] px-3 py-2 text-[13px] outline-none transition"
        style={{
          border: hasError
            ? "0.5px solid var(--app-red-text)"
            : "0.5px solid var(--app-border-md)",
          background: hasError ? "var(--app-amber-bg)" : "var(--app-surface)",
          color: "var(--app-text-1)",
        }}
      />
    </div>
  );
}

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

  const fieldLabel = (text: string) => (
    <label
      className="block text-[11px] font-medium uppercase tracking-wide mb-1"
      style={{ color: "var(--app-text-3)" }}
    >
      {text}
    </label>
  );

  const selectClass = "w-full rounded-[8px] px-3 py-2 text-[13px] outline-none transition";
  const selectStyle = {
    border: "0.5px solid var(--app-border-md)",
    background: "var(--app-surface)",
    color: "var(--app-text-1)",
  };

  return (
    <div className="max-w-[540px] mx-auto px-8 py-8 space-y-4">

      <Link href="/dashboard" className="text-[13px] transition" style={{ color: "var(--app-blue)" }}>
        ← Back to Dashboard
      </Link>

      <div
        className="rounded-[12px] overflow-hidden"
        style={{ background: "var(--app-surface)", border: "0.5px solid var(--app-border)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "0.5px solid var(--app-border)" }}>
          <h1 className="text-[14px] font-medium" style={{ color: "var(--app-text-1)" }}>New Reservation</h1>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--app-text-3)" }}>Fill in the details to create a reservation.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <div>
            {fieldLabel("Property")}
            {properties.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--app-text-3)" }}>Loading properties…</p>
            ) : (
              <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={selectClass} style={selectStyle}>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          <div className="flex gap-3">
            <DateInput label="Check-In"  value={checkIn}  onChange={handleCheckInChange}             min={today}          hasError={hasDateError && !!checkIn}  />
            <DateInput label="Check-Out" value={checkOut} onChange={(v) => { setCheckOut(v); setError(""); }} min={checkIn || today} hasError={hasDateError && !!checkOut} />
          </div>

          {conflict && checkIn && checkOut && (
            <div
              className="rounded-[8px] px-3 py-2 text-[12px]"
              style={{ background: "var(--app-amber-bg)", color: "var(--app-amber-text)", border: "0.5px solid var(--app-amber-text)" }}
            >
              Already booked from <strong>{formatDate(conflict.checkIn)}</strong> to{" "}
              <strong>{formatDate(conflict.checkOut)}</strong>. Choose different dates.
            </div>
          )}

          <div>
            {fieldLabel("Source")}
            <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass} style={selectStyle}>
              <option value="airbnb">Airbnb</option>
              <option value="booking">Booking.com</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          {error && <p className="text-[12px]" style={{ color: "var(--app-red-text)" }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting || properties.length === 0 || hasDateError}
            className="w-full rounded-[8px] py-2 text-[13px] font-medium transition disabled:opacity-50"
            style={{ background: "var(--app-blue)", color: "#ffffff" }}
          >
            {submitting ? "Creating…" : "Create Reservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
