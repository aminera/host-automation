"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

// ── Shared input style ──────────────────────────────────────────────────────
const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900";

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

  if (loading) return <p className="p-8 text-sm text-center text-gray-400">Loading…</p>;

  if (tokenError) return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center">
        <p className="text-lg font-semibold text-red-600 mb-2">Link unavailable</p>
        <p className="text-sm text-gray-500">{tokenError}</p>
      </div>
    </main>
  );

  if (submitted) return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold mb-2">Information submitted!</h2>
        {contractId && guestId ? (
          <>
            <p className="text-sm text-gray-500 mb-6">Your contract is ready. Please sign it to complete check-in.</p>
            <button
              onClick={() => router.push(`/guest-form/${token}/sign?contractId=${contractId}&guestId=${guestId}`)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Continue to Sign Contract →
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500">Thank you. Your host will send you a signing link shortly.</p>
        )}
      </div>
    </main>
  );

  // ── Property header ────────────────────────────────────────────────────────

  const header = (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
      <h1 className="text-base font-bold text-gray-900">{formData?.propertyName}</h1>
      <p className="text-sm text-gray-400 mt-0.5">
        {formData ? `${new Date(formData.checkInDate).toLocaleDateString("en-GB")} → ${new Date(formData.checkOutDate).toLocaleDateString("en-GB")}` : ""}
      </p>
    </div>
  );

  // ── Step 1 — guest count ───────────────────────────────────────────────────

  if (step === 1) return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        {header}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">How many guests?</h2>
            <p className="text-sm text-gray-400 mt-1">
              Include yourself. Each guest will need to provide a valid ID document.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
              className="w-10 h-10 rounded-full border border-gray-200 text-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
            >
              −
            </button>
            <span className="text-3xl font-semibold text-gray-900 w-8 text-center">{guestCount}</span>
            <button
              type="button"
              onClick={() => setGuestCount((n) => Math.min(10, n + 1))}
              className="w-10 h-10 rounded-full border border-gray-200 text-lg font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-center"
            >
              +
            </button>
          </div>

          <button
            onClick={handleGuestCountConfirm}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition"
          >
            Continue →
          </button>
        </div>
      </div>
    </main>
  );

  // ── Step 2 — guest details ─────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        {header}

        <form onSubmit={handleSubmit} className="space-y-4">
          {guests.map((g, i) => {
            const isMain = i === 0;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {isMain ? "Your information (main guest)" : `Guest ${i + 1}`}
                  </h2>
                  {guests.length > 1 && (
                    <span className="text-xs text-gray-400">{i + 1} / {guests.length}</span>
                  )}
                </div>

                {/* Full name — all guests */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Full Name *
                  </label>
                  <input type="text" required value={g.fullName}
                    onChange={(e) => updateGuest(i, "fullName", e.target.value)}
                    className={inp} placeholder="Jane Doe" />
                </div>

                {/* Email & phone — main guest only */}
                {isMain && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Email *
                      </label>
                      <input type="email" required value={g.email}
                        onChange={(e) => updateGuest(i, "email", e.target.value)}
                        className={inp} placeholder="you@example.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input type="tel" required value={g.phone}
                        onChange={(e) => updateGuest(i, "phone", e.target.value)}
                        className={inp} placeholder="+212 6 12 34 56 78" />
                    </div>
                  </>
                )}

                {/* Document type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Document Type *
                  </label>
                  <div className="flex gap-2">
                    {(["passport", "id_card", "driving_license"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateGuest(i, "documentType", type)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                        style={{
                          background: g.documentType === type ? "#EFF6FF" : "#ffffff",
                          color: g.documentType === type ? "#1D4ED8" : "#6b7280",
                          borderColor: g.documentType === type ? "#BFDBFE" : "#e5e7eb",
                        }}
                      >
                        {DOC_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document number */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {DOC_LABELS[g.documentType]} Number *
                  </label>
                  <input type="text" required value={g.documentNumber}
                    onChange={(e) => updateGuest(i, "documentNumber", e.target.value)}
                    className={inp} placeholder="AB123456" />
                </div>

                {/* Document upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Upload {DOC_LABELS[g.documentType]} *
                  </label>
                  {g.documentFile ? (
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 bg-green-50">
                      <span className="text-xs text-green-700 truncate">{g.documentFile.name}</span>
                      <button
                        type="button"
                        onClick={() => updateGuest(i, "documentFile", null)}
                        className="text-xs text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 px-4 py-5 cursor-pointer hover:border-blue-400 transition bg-gray-50">
                      <span className="text-sm text-gray-400">Tap to upload photo or scan</span>
                      <span className="text-xs text-gray-300">JPG, PNG or PDF</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => updateGuest(i, "documentFile", e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}

          {fieldError && (
            <p className="text-sm text-red-600 text-center">{fieldError}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? "Uploading & submitting…" : `Submit ${guests.length > 1 ? `${guests.length} guests` : "information"}`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
