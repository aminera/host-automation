"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewReservationPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [source, setSource] = useState("airbnb");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((data) => {
        setProperties(data);
        if (data.length > 0) setPropertyId(data[0].id);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!propertyId || !checkIn || !checkOut) {
      setError("All fields are required.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
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

    if (data.error) {
      setError(typeof data.error === "string" ? data.error : "Validation error.");
    } else {
      router.push(`/reservations/${data.id}`);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <button
        onClick={() => router.push("/dashboard")}
        className="text-sm text-blue-600 hover:underline mb-6 block"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold mb-1">New Reservation</h1>
        <p className="text-sm text-gray-500 mb-6">Fill in the details to create a reservation.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            {properties.length === 0 ? (
              <p className="text-sm text-gray-400">Loading properties…</p>
            ) : (
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-In</label>
              <input
                type="date"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-Out</label>
              <input
                type="date"
                required
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="airbnb">Airbnb</option>
              <option value="booking">Booking.com</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || properties.length === 0}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? "Creating…" : "Create Reservation"}
          </button>
        </form>
      </div>
    </main>
  );
}
