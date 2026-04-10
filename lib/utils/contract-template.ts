export interface ContractTemplateData {
  contractNumber: string;
  hostName: string;
  propertyName: string;
  propertyAddress: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  documentType?: string;
  documentNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  generatedAt: string;
  signatureImageUrl?: string;
}

export function buildContractHtml(data: ContractTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Rental Contract – ${data.contractNumber}</title>
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
  <p class="subtitle">Contract No. ${data.contractNumber} — Generated on ${data.generatedAt}</p>

  <div class="section">
    <h2>Host Information</h2>
    <div class="row"><span class="label">Name:</span><span class="value">${data.hostName}</span></div>
  </div>

  <div class="section">
    <h2>Property Details</h2>
    <div class="row"><span class="label">Property Name:</span><span class="value">${data.propertyName}</span></div>
    <div class="row"><span class="label">Address:</span><span class="value">${data.propertyAddress}</span></div>
  </div>

  <div class="section">
    <h2>Reservation Details</h2>
    <div class="row"><span class="label">Check-In:</span><span class="value">${data.checkInDate}</span></div>
    <div class="row"><span class="label">Check-Out:</span><span class="value">${data.checkOutDate}</span></div>
  </div>

  <div class="section">
    <h2>Guest Information</h2>
    <div class="row"><span class="label">Full Name:</span><span class="value">${data.guestName}</span></div>
    <div class="row"><span class="label">Email:</span><span class="value">${data.guestEmail}</span></div>
    ${data.guestPhone ? `<div class="row"><span class="label">Phone:</span><span class="value">${data.guestPhone}</span></div>` : ""}
    ${data.documentType ? `<div class="row"><span class="label">Document Type:</span><span class="value">${data.documentType}</span></div>` : ""}
    ${data.documentNumber ? `<div class="row"><span class="label">Document Number:</span><span class="value">${data.documentNumber}</span></div>` : ""}
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
        <p>${data.hostName}<br/><small>Host Signature</small></p>
      </div>
      <div class="sig-box">
        ${data.signatureImageUrl
          ? `<img src="${data.signatureImageUrl}" style="max-height:80px;max-width:100%;display:block;margin-bottom:4px;"/>`
          : `<div class="sig-line"></div>`}
        <p>${data.guestName}<br/><small>Guest Signature</small></p>
      </div>
    </div>
  </div>

  <footer>This document was generated electronically by HostAutomation.</footer>
</body>
</html>
  `.trim();
}
