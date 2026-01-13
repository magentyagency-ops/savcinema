# SAV du Cinéma

A premium, functionality-first web application for collecting and managing voice reviews for movies. 
Features a public interface for recording audio reviews and a secure admin dashboard for management.

## Features

- **Public Interface**: Active movie showcase, voice recorder with waveform visualization, audio upload handling.
- **Admin Dashboard**: Secure login, active movie selection (TMDB integration), review management (listen, approve, delete).
- **Backend**: Next.js 14 App Router, PostgreSQL (Prisma), NextAuth, S3/R2 Storage.
- **UI/UX**: TailwindCSS, Radix UI (shadcn), Framer Motion, Dark Mode.

## Prerequisites

- Node.js 18+
- PostgreSQL Database (Local or Neon/Supabase)
- TMDB API Key
- S3-Compatible Storage Credentials (AWS S3 or Cloudflare R2)

## Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd savcinema
   npm install
   ```

2. **Environment Variables**
   Rename `.env` or create `.env.local` based on `.env`:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   TMDB_API_KEY="your-tmdb-key"
   
   # AWS S3 / Cloudflare R2
   S3_ENDPOINT="https://<account>.r2.cloudflarestorage.com"
   S3_ACCESS_KEY_ID="..."
   S3_SECRET_ACCESS_KEY="..."
   S3_BUCKET_NAME="savcinema-media"
   
   # Admin Seed
   ADMIN_SEED_EMAIL="admin@savcinema.com"
   ADMIN_SEED_PASSWORD="password123"
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run Migrations (Requires valid DATABASE_URL)
   npx prisma migrate dev --name init
   
   # Seed Admin User
   npm run seed
   # OR: npx ts-node prisma/seed.ts
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Deployment

### 1. Database (Neon / Supabase)
- Create a project.
- Get the Connection String (Pooled for serverless is best, but standard works).
- Set `DATABASE_URL` in Vercel.

### 2. Storage (Cloudflare R2)
- Create a Bucket.
- Create API Token with R/W permissions.
- Set `S3_ENDPOINT`, `ACCESS_KEY`, `SECRET_KEY`, `BUCKET_NAME` in Vercel.
- **CORS**: Configure CORS on R2 to allow your Vercel domain (and localhost).
  ```json
  [
    {
      "AllowedOrigins": ["*"], 
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"]
    }
  ]
  ```

### 3. Vercel (App)
- Import project.
- Add all Environment Variables.
- Redeploy.

## Usage
1. Go to `/admin/login`.
2. Login with seed credentials (`admin@savcinema.com` / `password123`).
3. Select an active movie from the dashboard.
4. Go to the public home page and record a review!

## Tech Stack Decisions
- **Next.js 14**: Best in class for React full-stack.
- **Prisma**: Type-safe DB access.
- **Tailwind/shadcn**: Rapid, consistent, premium UI building.
- **S3/R2**: Cheap, reliable object storage for audio files (`audio/webm` format).
- **NextAuth**: Standard auth solution for Next.js.
