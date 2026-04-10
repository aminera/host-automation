"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface FormData {
  reservationId: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
}

export default function GuestFormPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [tokenError, setTokenError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState("passport");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fieldError, setFieldError] = useState("");

  useEffect(() => {
    fetch(`/api/guest-form/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setTokenError(data.error);
        } else {
          setFormData(data);
        }
        setLoading(false);
      });
  }, [token]);

  async function uploadDocument() {
    if (!documentFile) return null;
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const res = await fetch("/api/upload/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, fileName: `guest-doc-${Date.now()}` }),
        });
        const data = await res.json();
        if (data.url) resolve(data.url);
        else reject(new Error("Upload failed"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(documentFile);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError("");

    if (!fullName || !email) {
      setFieldError("Full name and email are required.");
      return;
    }

    setSubmitting(true);

    let docUrl: string | null = null;
    if (documentFile) {
      try {
        docUrl = await uploadDocument();
      } catch {
        setFieldError("Document upload failed. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    const res = await fetch(`/api/guest-form/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone: phone || undefined,
        documentType: documentType || undefined,
        documentNumber: documentNumber || undefined,
        documentFileUrl: docUrl || undefined,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (data.error) {
      setFieldError(data.error);
    } else {
      setGuestId(data.id);
      setContractId(data.contractId ?? null);
      setSubmitted(true);
    }
  }

  if (loading) return <p className="p-8 text-sm text-center text-gray-500">Loading…</p>;
  if (tokenError) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-lg font-semibold text-red-600 mb-2">Link unavailable</p>
        <p className="text-sm text-gray-500">{tokenError}</p>
      </div>
    </main>
  );

  if (submitted) return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold mb-2">Information submitted!</h2>
        {contractId && guestId ? (
          <>
            <p className="text-sm text-gray-500 mb-6">Your contract is ready. Please sign it to complete check-in.</p>
            <button
              onClick={() => router.push(`/guest-form/${token}/sign?contractId=${contractId}&guestId=${guestId}`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700"
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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
          <h1 className="text-lg font-bold mb-1">{formData?.propertyName}</h1>
          <p className="text-sm text-gray-500">
            {formData ? `${new Date(formData.checkInDate).toLocaleDateString("en-GB")} → ${new Date(formData.checkOutDate).toLocaleDateString("en-GB")}` : ""}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-base">Your Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="passport">Passport</option>
              <option value="id_card">ID Card</option>
              <option value="driving_license">Driving License</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AB123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload Document (photo / scan)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:border-0 file:rounded file:bg-blue-50 file:text-blue-700 file:text-sm"
            />
          </div>

          {fieldError && <p className="text-sm text-red-600">{fieldError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white rounded-lg py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? "Submitting…" : "Submit Information"}
          </button>
        </form>
      </div>
    </main>
  );
}
