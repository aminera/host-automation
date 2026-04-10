"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ReservationDetail {
  id: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  source: string;
  property: {
    name: string;
    address: string;
    city: string;
    country: string;
  };
  guests: Array<{
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    documentType?: string;
    documentNumber?: string;
    documentFileUrl?: string;
  }>;
  contracts: Array<{
    id: string;
    contractNumber: string;
    status: string;
    pdfUrl?: string;
  }>;
  guestFormTokens: Array<{
    token: string;
    expiresAt: string;
    used: boolean;
  }>;
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [generatingContract, setGeneratingContract] = useState(false);
  const [guestLink, setGuestLink] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setReservation(data);
        setLoading(false);
      });
  }, [id]);

  async function handleGenerateToken() {
    setGeneratingToken(true);
    const res = await fetch(`/api/reservations/${id}/token`, { method: "POST" });
    const data = await res.json();
    setGuestLink(data.link);
    setGeneratingToken(false);
    setFeedback("Guest form link generated!");
  }

  async function handleGenerateContract() {
    if (!reservation) return;
    setGeneratingContract(true);
    const res = await fetch("/api/contracts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId: id }),
    });
    const data = await res.json();
    if (data.error) {
      setFeedback(`Error: ${data.error}`);
    } else {
      setFeedback("Contract generated successfully!");
      router.refresh();
    }
    setGeneratingContract(false);
  }

  if (loading) return <p className="p-8 text-sm text-gray-500">Loading…</p>;
  if (!reservation) return <p className="p-8 text-sm text-red-500">Reservation not found.</p>;

  const latestToken = reservation.guestFormTokens[0];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <button onClick={() => router.push("/dashboard")} className="text-sm text-blue-600 hover:underline">
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
        <h1 className="text-xl font-bold">{reservation.property.name}</h1>
        <p className="text-sm text-gray-500">{reservation.property.address}, {reservation.property.city}, {reservation.property.country}</p>
        <div className="flex gap-6 text-sm mt-2">
          <span><strong>Check-In:</strong> {new Date(reservation.checkInDate).toLocaleDateString("en-GB")}</span>
          <span><strong>Check-Out:</strong> {new Date(reservation.checkOutDate).toLocaleDateString("en-GB")}</span>
          <span><strong>Source:</strong> {reservation.source}</span>
          <span><strong>Status:</strong> {reservation.status.replace("_", " ")}</span>
        </div>
      </div>

      {/* Guest Form Link */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-3">Guest Form Link</h2>
        {latestToken && !latestToken.used ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Active link (expires {new Date(latestToken.expiresAt).toLocaleString()}):</p>
            <code className="block bg-gray-50 border rounded p-2 text-xs break-all">
              {typeof window !== "undefined" ? `${window.location.origin}/guest-form/${latestToken.token}` : ""}
            </code>
          </div>
        ) : (
          <button
            onClick={handleGenerateToken}
            disabled={generatingToken}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generatingToken ? "Generating…" : "Generate Guest Form Link"}
          </button>
        )}
        {guestLink && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">New link:</p>
            <code className="block bg-gray-50 border rounded p-2 text-xs break-all">{guestLink}</code>
          </div>
        )}
      </div>

      {/* Guests */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-3">Guests</h2>
        {reservation.guests.length === 0 ? (
          <p className="text-sm text-gray-400">No guests submitted yet.</p>
        ) : (
          <ul className="space-y-3">
            {reservation.guests.map((g) => (
              <li key={g.id} className="text-sm border-b last:border-0 pb-3 last:pb-0">
                <p className="font-medium">{g.fullName}</p>
                <p className="text-gray-500">{g.email} {g.phone && `· ${g.phone}`}</p>
                {g.documentType && <p className="text-gray-500">{g.documentType} — {g.documentNumber}</p>}
                {g.documentFileUrl && <a href={g.documentFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">View Document</a>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Contracts */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-3">Contract</h2>
        {reservation.contracts.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">No contract generated yet.</p>
            {reservation.guests.length > 0 && (
              <button
                onClick={handleGenerateContract}
                disabled={generatingContract}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {generatingContract ? "Generating PDF…" : "Generate Contract"}
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {reservation.contracts.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-gray-500">{c.contractNumber}</span>
                <span className="capitalize">{c.status}</span>
                {c.pdfUrl && <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs">Download PDF</a>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {feedback && <p className="text-sm text-center text-green-700">{feedback}</p>}
    </main>
  );
}
