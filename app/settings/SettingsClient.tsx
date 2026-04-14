"use client";

import { useState } from "react";
import styled from "styled-components";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  createdAt: string;
}

interface Props {
  currentUser: { id: string; fullName: string; email: string; phone?: string | null };
  initialUsers: UserRow[];
}

// ── Styled components ─────────────────────────────────────────────────────────

const PageWrap = styled.div`
  max-width: 760px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

const PageTitle = styled.h1`
  font-size: 20px;
  font-weight: 500;
  color: var(--app-text-1);
  margin-bottom: 4px;
`;

const PageSubtitle = styled.p`
  font-size: 13px;
  color: var(--app-text-3);
`;

const Card = styled.div`
  background: var(--app-surface);
  border: 0.5px solid var(--app-border);
  border-radius: 12px;
  overflow: hidden;
`;

const CardHead = styled.div`
  padding: 16px 20px;
  border-bottom: 0.5px solid var(--app-border);
`;

const CardTitle = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const CardBody = styled.div`
  padding: 20px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 560px) { grid-template-columns: 1fr; }
`;

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-3);
`;

const FieldInput = styled.input`
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  background: var(--app-surface-2);
  border: 0.5px solid var(--app-border-md);
  color: var(--app-text-1);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  &:focus { border-color: var(--app-blue); }
  &::placeholder { color: var(--app-text-3); }
`;

const FormActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
`;

const PrimaryBtn = styled.button`
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--app-blue);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const FeedbackMsg = styled.span<{ $ok: boolean }>`
  font-size: 12px;
  color: ${(p) => p.$ok ? "var(--app-green-text)" : "var(--app-red-text)"};
`;

// User table
const UserTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-3);
  padding: 10px 12px;
  border-bottom: 0.5px solid var(--app-border);
  background: var(--app-surface-2);
`;

const Td = styled.td`
  font-size: 13px;
  color: var(--app-text-1);
  padding: 12px;
  border-bottom: 0.5px solid var(--app-border);
`;

const TdMuted = styled.td`
  font-size: 12px;
  color: var(--app-text-3);
  padding: 12px;
  border-bottom: 0.5px solid var(--app-border);
`;

const YouBadge = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--app-blue-bg);
  color: var(--app-blue-text);
  font-weight: 500;
`;

const Divider = styled.div`
  height: 0.5px;
  background: var(--app-border);
  margin: 20px 0;
`;

const AddUserHeading = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
  margin-bottom: 14px;
`;

const FullWidthField = styled(FieldWrap)`
  margin-top: 12px;
`;

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsClient({ currentUser, initialUsers }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);

  // ── Change password ───────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwFeedback, setPwFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwFeedback({ text: "New passwords don't match.", ok: false });
      return;
    }
    setPwSaving(true);
    setPwFeedback(null);
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwFeedback({ text: data.error ?? "Failed to update password.", ok: false });
      } else {
        setPwFeedback({ text: "Password updated successfully.", ok: true });
        setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } finally {
      setPwSaving(false);
    }
  }

  // ── Add user ──────────────────────────────────────────────────────────────
  const [addForm, setAddForm] = useState({ fullName: "", email: "", password: "", phone: "" });
  const [addSaving, setAddSaving] = useState(false);
  const [addFeedback, setAddFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddSaving(true);
    setAddFeedback(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddFeedback({ text: data.error ?? "Failed to create user.", ok: false });
      } else {
        setUsers((prev) => [...prev, data]);
        setAddForm({ fullName: "", email: "", password: "", phone: "" });
        setAddFeedback({ text: `User "${data.fullName}" created successfully.`, ok: true });
      }
    } finally {
      setAddSaving(false);
    }
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <PageWrap>
      <div>
        <PageTitle>Settings</PageTitle>
        <PageSubtitle>Manage your account and team members.</PageSubtitle>
      </div>

      {/* ── Change password ─────────────────────────────────────────── */}
      <Card>
        <CardHead>
          <CardTitle>Change password</CardTitle>
        </CardHead>
        <CardBody>
          <form onSubmit={handleChangePassword}>
            <FieldWrap style={{ marginBottom: 12 }}>
              <FieldLabel>Current password</FieldLabel>
              <FieldInput
                type="password"
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </FieldWrap>

            <FormRow>
              <FieldWrap>
                <FieldLabel>New password</FieldLabel>
                <FieldInput
                  type="password"
                  placeholder="Min. 8 characters"
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Confirm new password</FieldLabel>
                <FieldInput
                  type="password"
                  placeholder="Repeat new password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </FieldWrap>
            </FormRow>

            <FormActions>
              <PrimaryBtn type="submit" disabled={pwSaving}>
                {pwSaving ? "Saving…" : "Update password"}
              </PrimaryBtn>
              {pwFeedback && <FeedbackMsg $ok={pwFeedback.ok}>{pwFeedback.text}</FeedbackMsg>}
            </FormActions>
          </form>
        </CardBody>
      </Card>

      {/* ── Team members ─────────────────────────────────────────────── */}
      <Card>
        <CardHead>
          <CardTitle>Team members</CardTitle>
        </CardHead>

        {/* Users table */}
        <UserTable>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <Td>
                  {u.fullName}
                  {u.id === currentUser.id && <YouBadge>You</YouBadge>}
                </Td>
                <TdMuted>{u.email}</TdMuted>
                <TdMuted>{fmtDate(u.createdAt)}</TdMuted>
              </tr>
            ))}
          </tbody>
        </UserTable>

        {/* Add user form */}
        <CardBody>
          <Divider />
          <AddUserHeading>Add a new user</AddUserHeading>
          <form onSubmit={handleAddUser}>
            <FormRow>
              <FieldWrap>
                <FieldLabel>Full name</FieldLabel>
                <FieldInput
                  type="text"
                  placeholder="Jane Smith"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Email</FieldLabel>
                <FieldInput
                  type="email"
                  placeholder="jane@example.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Password</FieldLabel>
                <FieldInput
                  type="password"
                  placeholder="Min. 8 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  autoComplete="new-password"
                />
              </FieldWrap>
              <FieldWrap>
                <FieldLabel>Phone (optional)</FieldLabel>
                <FieldInput
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </FieldWrap>
            </FormRow>

            <FormActions>
              <PrimaryBtn type="submit" disabled={addSaving}>
                {addSaving ? "Creating…" : "Create user"}
              </PrimaryBtn>
              {addFeedback && <FeedbackMsg $ok={addFeedback.ok}>{addFeedback.text}</FeedbackMsg>}
            </FormActions>
          </form>
        </CardBody>
      </Card>
    </PageWrap>
  );
}
