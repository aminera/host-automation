"use client";

import { useState } from "react";

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

export default function PropertiesPanel({ initial, formOpen, onFormClose, onViewReservations }: Props) {
  const [properties, setProperties] = useState<Property[]>(initial);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]           = useState("");

  function field(key: keyof typeof emptyForm, placeholder: string) {
    return (
      <input
        type="text"
        required
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full text-[13px] px-3 py-2 rounded-[8px] outline-none transition"
        style={{
          border: "0.5px solid var(--app-border-md)",
          background: "var(--app-surface)",
          color: "var(--app-text-1)",
        }}
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
        <form
          onSubmit={handleAdd}
          className="px-5 py-4 space-y-3"
          style={{ borderBottom: "0.5px solid var(--app-border)" }}
        >
          <div className="grid grid-cols-2 gap-3">
            {field("name", "Name")}
            {field("address", "Address")}
            {field("city", "City")}
            {field("country", "Country")}
          </div>
          {error && <p className="text-[12px]" style={{ color: "var(--app-red-text)" }}>{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-[14px] py-[7px] rounded-[8px] text-[13px] font-medium transition"
              style={{ background: "var(--app-blue)", color: "#ffffff", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Saving…" : "Save property"}
            </button>
            <button
              type="button"
              onClick={() => { onFormClose(); setForm(emptyForm); setError(""); }}
              className="px-[14px] py-[7px] rounded-[8px] text-[13px] transition"
              style={{ color: "var(--app-text-2)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {properties.length === 0 ? (
        <p className="px-5 py-6 text-[13px]" style={{ color: "var(--app-text-3)" }}>No properties yet.</p>
      ) : (
        <div className="px-5">
          {properties.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-3"
              style={{ borderBottom: "0.5px solid var(--app-border)" }}
            >
              <div>
                <p className="text-[13px] font-medium" style={{ color: "var(--app-text-1)" }}>{p.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--app-text-3)" }}>
                  {p.address}, {p.city}, {p.country}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="text-[12px] transition hover:opacity-75 disabled:opacity-40"
                  style={{ color: "var(--app-red-text)" }}
                >
                  {deletingId === p.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
