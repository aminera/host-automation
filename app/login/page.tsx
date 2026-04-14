"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styled from "styled-components";

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  padding: 0 1rem;
`;

const Card = styled.div`
  width: 100%;
  max-width: 360px;
  background: var(--app-surface);
  border-radius: 16px;
  border: 0.5px solid var(--app-border);
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.375rem;
  color: var(--app-text-1);
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: var(--app-text-3);
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--app-text-2);
`;

const Input = styled.input`
  border: 0.5px solid var(--app-border-md);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  background: var(--app-surface);
  color: var(--app-text-1);
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: var(--app-blue);
  }
`;

const ErrorMsg = styled.p`
  font-size: 0.875rem;
  color: var(--app-red-text);
`;

const SubmitBtn = styled.button`
  width: 100%;
  background: var(--app-blue);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <Page>
      <Card>
        <Title>HostAutomation</Title>
        <Subtitle>Sign in to your account</Subtitle>

        <Form onSubmit={handleSubmit}>
          <Field>
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          <Field>
            <Label>Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </SubmitBtn>
        </Form>
      </Card>
    </Page>
  );
}
