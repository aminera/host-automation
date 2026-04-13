"use client";

import { useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const contractId = searchParams.get("contractId");
  const guestId = searchParams.get("guestId");

  const sigRef = useRef<SignatureCanvas>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function clearSignature() {
    sigRef.current?.clear();
  }

  async function handleSign() {
    if (!contractId || !guestId) {
      setError("Missing contract or guest information.");
      return;
    }

    if (sigRef.current?.isEmpty()) {
      setError("Please draw your signature before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);

    const signatureDataUrl = sigRef.current!.toDataURL("image/png");

    const res = await fetch("/api/contracts/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, contractId, guestId, signatureDataUrl }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (data.error) {
      setError(data.error);
    } else {
      setDone(true);
    }
  }

  if (done) return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold mb-2">Contract signed!</h2>
        <p className="text-sm text-gray-500">Your digital signature has been saved. The contract is now complete.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-lg font-bold mb-1">Sign Your Contract</h1>
          <p className="text-sm text-gray-500 mb-6">Please draw your signature in the box below using your finger or mouse.</p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white mb-4">
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                className: "w-full",
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearSignature}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={handleSign}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Signing…" : "Confirm & Sign"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </main>
  );
}
