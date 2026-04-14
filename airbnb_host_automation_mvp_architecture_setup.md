# Airbnb Host Automation SaaS (MVP)

## 🎯 Project Goal
Digitize and automate the guest onboarding and contract workflow for Airbnb hosts:
- Replace physical contract signing
- Collect guest information remotely
- Generate and sign contracts digitally
- Store documents securely

---

## 🧱 Global Architecture (MVP)

```
Frontend (Next.js)
        ↓
Backend (Next.js API Routes / Server Actions)
        ↓
Database (PostgreSQL)
        ↓
Storage (Cloudinary)
```

👉 Monolith architecture for fast development and simplicity.

---

## ⚙️ Tech Stack

### Frontend + Backend
- Next.js (App Router)
- React
- styled-components v6 (CSS-in-JS, SSR via registry)

### Backend Logic
- Next.js Route Handlers
- Service layer (business logic separation)

### Database
- PostgreSQL
- Prisma ORM

### Storage
- Cloudinary (images + PDFs)

### PDF Generation
- Puppeteer (HTML → PDF)

### Signature
- react-signature-canvas

### Auth
- NextAuth / Auth.js

---

## 🗂️ Database Schema (MVP)

### users
- id (uuid)
- full_name
- email
- password_hash
- phone
- created_at

### properties
- id
- user_id (FK)
- name
- address
- city
- country

### reservations
- id
- property_id (FK)
- check_in_date
- check_out_date
- status
- source (airbnb, booking, direct)

### guests
- id
- reservation_id (FK)
- full_name
- email
- phone
- document_type
- document_number
- document_file_url

### contracts
- id
- reservation_id (FK)
- contract_number
- status (draft, sent, signed)
- pdf_url
- signed_at

### signatures
- id
- contract_id (FK)
- guest_id (FK)
- signature_image_url
- signed_at

### guest_form_tokens
- id
- reservation_id
- token
- expires_at
- used

---

## 🔄 Main Workflow

### 1. Host creates reservation

### 2. Generate guest form link
```
/guest-form/:token
```

### 3. Guest fills form
- Personal info
- Upload CIN / Passport

### 4. Generate contract
- Inject data into HTML template
- Convert to PDF (Puppeteer)
- Upload to Cloudinary

### 5. Guest signs
- Signature stored as image
- Contract marked as signed

---

## 📁 Project Structure

```
/app
  /dashboard
  /reservations
  /contracts
  /guest-form/[token]

/lib
  /db
  /services
    contract.service.ts
    reservation.service.ts
    guest.service.ts

  /utils
    pdf-generator.ts
    token.ts

/prisma
  schema.prisma
```

---

## ☁️ File Storage Strategy (Cloudinary)

### Stored Files
- Contracts (PDF)
- Guest documents (CIN / Passport)
- Signatures

### Example URLs
```
https://res.cloudinary.com/.../contracts/contract-123.pdf
https://res.cloudinary.com/.../guests/guest-456-cin.jpg
```

### Flow
1. Upload file from frontend
2. Send to backend
3. Upload to Cloudinary
4. Save returned URL in database

---

## 🔐 Security Model

### Host
- Authenticated (login required)

### Guest
- Access via secure token only
- No account required

---

## 🔌 API Endpoints (MVP)

### Reservations
- POST /api/reservations
- GET /api/reservations

### Guest
- GET /api/guest-form/:token
- POST /api/guest-form/:token

### Contracts
- POST /api/contracts/generate
- POST /api/contracts/sign

---

## 🖥️ UI Pages

### Dashboard
- Reservations list

### Reservation Detail
- Guests
- Contract status

### Guest Form (Public)
- Mobile-first

### Signature Page
- Signature canvas

---

## 🚀 Deployment (MVP)

### Hosting
- VPS (Hostinger)

### Backend
- Node.js + Next.js
- PM2 (process manager)

### Web Server
- Nginx

### SSL
- Let's Encrypt

---

## ⚡ Scaling Plan (Future)

- Move to Vercel or AWS
- Replace Cloudinary if needed with S3
- Add Airbnb sync
- Add analytics dashboard

---

## 💡 Key Principles

- Keep MVP simple
- Focus on core workflow
- Avoid over-engineering
- Build for real usage first

---

## ✅ MVP Goal

A working system where:
- Host sends a link
- Guest fills info
- Contract is generated and signed
- Everything is stored and accessible

---

## 🔥 Next Steps

- Prisma schema implementation
- API validation (Zod)
- UI wireframes
- First working flow (end-to-end)

