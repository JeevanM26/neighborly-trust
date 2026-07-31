# 🏡 Neighborly Trust — Production Hyperlocal Services Marketplace

**Neighborly Trust** connects rural customers with nearby verified service providers (electricians, plumbers, carpenters, home cleaners).

Built with **Next.js 14+ (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase (Postgres, Auth, RLS, Storage, Realtime)**, and **OpenStreetMap Nominatim**.

---

## 🎨 Visual Design System
Preserved faithfully from the reference prototype (`neighborly-trust.jsx`):
- **Navy Primary**: `#0B3D66`
- **Deep Navy Header**: `#072A4A`
- **Sky Tint Background**: `#EAF2FB`
- **Gold Accent**: `#F5A623`
- Designed specifically for **rural & low-literacy users** with large tap targets, language switching, and voice/audio toggle guidance.

---

## 🚀 Key Features

1. **Dual Role Authentication**:
   - Customer & Provider logins with explicit DPDP Act privacy consent (GPS location & phone storage).
2. **Real-time Provider Map & Location**:
   - Live location streaming via Supabase Realtime when providers toggle "online".
   - Haversine GPS distance sorting relative to customer's location.
3. **Monetization Engine**:
   - **8% Platform Commission**: Computed and recorded on every completed booking.
   - **Featured Listings**: Featured providers sort above equal-distance providers with a "Featured" badge.
   - **Admin Dashboard (`/admin`)**: Protected route displaying total platform commission collected and active featured provider management.
4. **Data Safety & Security**:
   - 100% Row-Level Security (RLS) enforcement on all database tables.
   - Nightly database backup workflow via GitHub Actions (`.github/workflows/db-backup.yml`).
   - Uptime health check endpoint (`/api/health`) to prevent free-tier Supabase project auto-pausing.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js 18+ & npm
- Free Supabase account ([supabase.com](https://supabase.com))
- Free Vercel account linked to GitHub

### 2. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_COMMISSION_PERCENTAGE=8
```

### 3. Run Database Migrations
Copy the contents of `supabase/schema.sql` and run it in your **Supabase SQL Editor**:
- Creates `profiles`, `provider_profiles`, `bookings`, `ratings`, and `payouts` tables.
- Applies 8% commission trigger and rating average trigger.
- Enforces strict Row-Level Security (RLS) policies.

### 4. Install Dependencies & Start Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the Vitest test suite verifying commission calculation, haversine distance calculation, and featured provider sorting:
```bash
npm run test
```

---

## 🌐 Deploying to GitHub & Vercel

### Step 1: Push to GitHub
1. Create a new GitHub repository (e.g. `neighborly-trust`).
2. Run the following commands in the project root:
```bash
git init
git add .
git commit -m "feat: production Neighborly Trust app with Next.js, Supabase, 8% commission, and RLS"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/neighborly-trust.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Log into [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Select your `neighborly-trust` repository from GitHub.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_COMMISSION_PERCENTAGE`
4. Click **Deploy**. Vercel will build and host your production Next.js app!

---

## 🛡️ License & Copyright
© 2026 Neighborly Trust Inc. All rights reserved.
