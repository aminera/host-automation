// ── Template variable reference ───────────────────────────────────────────────

export const TEMPLATE_VARIABLES: { key: string; label: string }[] = [
  { key: "contract_number",    label: "Auto-generated contract number" },
  { key: "generated_at",       label: "Date the PDF was generated" },
  { key: "host_name",          label: "Host full name" },
  { key: "property_name",      label: "Property name" },
  { key: "property_address",   label: "Full property address" },
  { key: "check_in",           label: "Check-in date" },
  { key: "check_out",          label: "Check-out date" },
  { key: "guest_name",         label: "Guest full name" },
  { key: "guest_email",        label: "Guest email" },
  { key: "guest_phone_row",    label: "Phone row (hidden if empty)" },
  { key: "document_type_row",  label: "Document type row (hidden if empty)" },
  { key: "ID_number_row",label: "ID number (hidden if empty)" },
  { key: "signature_block",    label: "Signature image or blank line" },
];

// ── Default template HTML (uses {{variable}} placeholders) ───────────────────

export const DEFAULT_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Rental Contract – {{contract_number}}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #222; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; font-size: 22px; margin-bottom: 4px; }
    .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 32px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 15px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
    .row { display: flex; gap: 24px; margin-bottom: 8px; }
    .label { font-weight: bold; min-width: 160px; font-size: 13px; }
    .value { font-size: 13px; }
    .signature-area { margin-top: 48px; border-top: 1px dashed #999; padding-top: 24px; }
    .sig-row { display: flex; justify-content: space-between; margin-top: 32px; }
    .sig-box { text-align: center; width: 45%; }
    .sig-line { border-top: 1px solid #333; margin-top: 48px; width: 100%; }
    footer { margin-top: 48px; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <h1>Short-Term Rental Contract</h1>
  <p class="subtitle">Contract No. {{contract_number}} — Generated on {{generated_at}}</p>

  <div class="section">
    <h2>Host Information</h2>
    <div class="row"><span class="label">Name:</span><span class="value">{{host_name}}</span></div>
  </div>

  <div class="section">
    <h2>Property Details</h2>
    <div class="row"><span class="label">Property Name:</span><span class="value">{{property_name}}</span></div>
    <div class="row"><span class="label">Address:</span><span class="value">{{property_address}}</span></div>
  </div>

  <div class="section">
    <h2>Reservation Details</h2>
    <div class="row"><span class="label">Check-In:</span><span class="value">{{check_in}}</span></div>
    <div class="row"><span class="label">Check-Out:</span><span class="value">{{check_out}}</span></div>
  </div>

  <div class="section">
    <h2>Guest Information</h2>
    <div class="row"><span class="label">Full Name:</span><span class="value">{{guest_name}}</span></div>
    <div class="row"><span class="label">Email:</span><span class="value">{{guest_email}}</span></div>
    {{guest_phone_row}}
    {{document_type_row}}
    {{ID_number_row}}
  </div>

  <div class="section">
    <h2>Terms &amp; Conditions</h2>
    <p style="font-size: 12px; line-height: 1.6;">
      The guest agrees to maintain the property in good condition, respect house rules, and vacate by the agreed check-out time.
      The host agrees to provide the property in the condition described. This contract is binding from the date of signature.
      Any damage beyond normal wear and tear is the responsibility of the guest.
    </p>
  </div>

  <div class="signature-area">
    <div class="sig-row">
      <div class="sig-box">
        <div class="sig-line"></div>
        <p>{{host_name}}<br/><small>Host Signature</small></p>
      </div>
      <div class="sig-box">
        {{signature_block}}
        <p>{{guest_name}}<br/><small>Guest Signature</small></p>
      </div>
    </div>
  </div>

  <footer>This document was generated electronically by HostAutomation.</footer>
</body>
</html>`;

// ── Render data interface ─────────────────────────────────────────────────────

export interface ContractRenderData {
  contractNumber:    string;
  hostName:          string;
  propertyName:      string;
  propertyAddress:   string;
  guestName:         string;
  guestEmail:        string;
  guestPhone?:       string;
  documentType?:     string;
  documentNumber?:   string;
  checkInDate:       string;
  checkOutDate:      string;
  generatedAt:       string;
  signatureImageUrl?: string;
}

// ── Renderer ──────────────────────────────────────────────────────────────────

export function renderTemplate(html: string, data: ContractRenderData): string {
  const vars: Record<string, string> = {
    contract_number:     data.contractNumber,
    generated_at:        data.generatedAt,
    host_name:           data.hostName,
    property_name:       data.propertyName,
    property_address:    data.propertyAddress,
    check_in:            data.checkInDate,
    check_out:           data.checkOutDate,
    guest_name:          data.guestName,
    guest_email:         data.guestEmail,
    guest_phone_row:     data.guestPhone
      ? `<span class="value">${data.guestPhone}</span>`
      : "",
    document_type_row:   data.documentType
      ? `<span class="value">${data.documentType}</span>`
      : "",
    ID_number_row: data.documentNumber
      ? `<span class="value">${data.documentNumber}</span>`
      : "",
    signature_block:     data.signatureImageUrl
      ? `<img src="${data.signatureImageUrl}" style="max-height:80px;max-width:100%;display:inline-block;"/>`
      : `<div ></div>`,
  };

  return html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

// ── Sample data for previews ───────────────────────────────────────────────────

export const SAMPLE_RENDER_DATA: ContractRenderData = {
  contractNumber:  "CTR-PREVIEW-001",
  hostName:        "John Host",
  propertyName:    "Beach Villa",
  propertyAddress: "12 Ocean Drive, Marbella, Spain",
  guestName:       "Jane Guest",
  guestEmail:      "jane.guest@example.com",
  guestPhone:      "+34 600 123 456",
  documentType:    "Passport",
  documentNumber:  "AB123456",
  checkInDate:     "22 Apr 2026",
  checkOutDate:    "29 Apr 2026",
  generatedAt:     new Date().toLocaleDateString("en-GB"),
};
