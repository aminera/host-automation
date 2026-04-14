"use client";

import { useState } from "react";
import styled from "styled-components";

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

interface Props {
  initial: Property[];
  formOpen: boolean;
  onFormClose: () => void;
  onViewReservations: (propertyId: string) => void;
}

const emptyForm = { name: "", address: "", city: "", country: "" };

// ── Styled components ─────────────────────────────────────────────────────

const AddForm = styled.form`
  padding: 1rem 1.25rem;
  border-bottom: 0.5px solid var(--app-border);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const FormInput = styled.input`
  width: 100%;
  font-size: 13px;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 0.5px solid var(--app-border-md);
  background: var(--app-surface);
  color: var(--app-text-1);
  outline: none;
  transition: border-color 0.15s;

  &:focus { border-color: var(--app-blue); }
`;

const FormActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SaveBtn = styled.button<{ $saving?: boolean }>`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  background: var(--app-blue);
  color: #ffffff;
  opacity: ${({ $saving }) => $saving ? 0.6 : 1};
  transition: opacity 0.15s;
`;

const CancelBtn = styled.button`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--app-text-2);
  transition: color 0.15s;
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: var(--app-red-text);
  margin-bottom: 0.5rem;
`;

const EmptyMsg = styled.p`
  padding: 1.5rem 1.25rem;
  font-size: 13px;
  color: var(--app-text-3);
`;

const ListWrap = styled.div`
  padding: 0 1.25rem;
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 0.5px solid var(--app-border);
`;

const PropName = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-1);
`;

const PropAddress = styled.p`
  font-size: 11px;
  margin-top: 2px;
  color: var(--app-text-3);
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const RemoveBtn = styled.button<{ $disabled?: boolean }>`
  font-size: 12px;
  border: none;
  background: transparent;
  color: var(--app-red-text);
  cursor: pointer;
  transition: opacity 0.15s;
  opacity: ${({ $disabled }) => $disabled ? 0.4 : 1};
  pointer-events: ${({ $disabled }) => $disabled ? "none" : "auto"};
`;

// ── Component ─────────────────────────────────────────────────────────────

export default function PropertiesPanel({ initial, formOpen, onFormClose, onViewReservations }: Props) {
  const [properties, setProperties] = useState<Property[]>(initial);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]           = useState("");

  function field(key: keyof typeof emptyForm, placeholder: string) {
    return (
      <FormInput
        type="text"
        required
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setError("Could not save property."); return; }
    setProperties((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setForm(emptyForm);
    onFormClose();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    setProperties((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  return (
    <>
      {formOpen && (
        <AddForm onSubmit={handleAdd}>
          <FormGrid>
            {field("name", "Name")}
            {field("address", "Address")}
            {field("city", "City")}
            {field("country", "Country")}
          </FormGrid>
          {error && <ErrorText>{error}</ErrorText>}
          <FormActions>
            <SaveBtn type="submit" disabled={saving} $saving={saving}>
              {saving ? "Saving…" : "Save property"}
            </SaveBtn>
            <CancelBtn
              type="button"
              onClick={() => { onFormClose(); setForm(emptyForm); setError(""); }}
            >
              Cancel
            </CancelBtn>
          </FormActions>
        </AddForm>
      )}

      {properties.length === 0 ? (
        <EmptyMsg>No properties yet.</EmptyMsg>
      ) : (
        <ListWrap>
          {properties.map((p) => (
            <PropertyRow key={p.id}>
              <div>
                <PropName>{p.name}</PropName>
                <PropAddress>{p.address}, {p.city}, {p.country}</PropAddress>
              </div>
              <RowActions>
                <RemoveBtn
                  onClick={() => handleDelete(p.id)}
                  $disabled={deletingId === p.id}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? "Removing…" : "Remove"}
                </RemoveBtn>
              </RowActions>
            </PropertyRow>
          ))}
        </ListWrap>
      )}
    </>
  );
}
