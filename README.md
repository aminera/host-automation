# Host Automation

A full-stack SaaS app for short-term rental hosts to automate guest onboarding and contract workflows.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: styled-components v6 (CSS-in-JS, SSR via `lib/registry.tsx`)
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Cloudinary (documents, PDFs, signatures)
- **Auth**: NextAuth / Auth.js
- **PDF generation**: Puppeteer
- **Signature**: react-signature-canvas

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

```bash
npm run db:migrate   # run pending migrations
npm run db:seed      # seed initial data
```

## Project Structure

```
app/              Next.js pages and API routes
components/       Shared UI components
lib/
  db/             Prisma client
  services/       Business logic (reservation, contract, guest, template)
  utils/          PDF generator, Cloudinary, token helpers
prisma/           Schema and migrations
types/            Global TypeScript augmentations
```
