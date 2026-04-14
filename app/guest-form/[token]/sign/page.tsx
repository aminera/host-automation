"use client";

import { useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SignatureCanvas from "react-signature-canvas";
import styled from "styled-components";

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

const Card = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #111827;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const SignatureBox = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  margin-bottom: 1rem;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const ClearBtn = styled.button`
  flex: 1;
  border: 1px solid #d1d5db;
  color: #374151;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.875rem;
  background: #ffffff;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: #f9fafb; }
`;

const SignBtn = styled.button`
  flex: 1;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ErrorMsg = styled.p`
  margin-top: 0.75rem;
  font-size: 0.875rem;
  color: #dc2626;
`;

const SuccessIcon = styled.div`
  font-size: 3rem;
  color: #16a34a;
  margin-bottom: 1rem;
`;

const SuccessTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #111827;
`;

const SuccessText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
`;

const TextCenter = styled.div`
  text-align: center;
`;

// ── Component ─────────────────────────────────────────────────────────────

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
    <PageCenter>
      <TextCenter>
        <SuccessIcon>✓</SuccessIcon>
        <SuccessTitle>Contract signed!</SuccessTitle>
        <SuccessText>Your digital signature has been saved. The contract is now complete.</SuccessText>
      </TextCenter>
    </PageCenter>
  );

  return (
    <Page>
      <Container>
        <Card>
          <Title>Sign Your Contract</Title>
          <Subtitle>Please draw your signature in the box below using your finger or mouse.</Subtitle>

          <SignatureBox>
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 200,
                style: { width: "100%" },
              }}
            />
          </SignatureBox>

          <BtnRow>
            <ClearBtn onClick={clearSignature}>Clear</ClearBtn>
            <SignBtn onClick={handleSign} disabled={submitting}>
              {submitting ? "Signing…" : "Confirm & Sign"}
            </SignBtn>
          </BtnRow>

          {error && <ErrorMsg>{error}</ErrorMsg>}
        </Card>
      </Container>
    </Page>
  );
}
