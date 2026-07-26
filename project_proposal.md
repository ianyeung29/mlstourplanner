# 🚀 MLS Tour Planner — Comprehensive System Architecture & Technical Proposal

> **Document Version**: 2.5  
> **Target Audience**: External AI Reviewers, Lead Software Engineers, Product Architects, & Investors  
> **Live Production Application**: [https://www.mlstourplanner.com](https://www.mlstourplanner.com)  

---

## 1. Executive Summary & Product Vision

**MLS Tour Planner** is an AI-powered SaaS platform specifically designed for high-performing real estate agents, buyer representatives, and brokerages. The platform automates the time-consuming process of organizing, scheduling, optimizing, dispatches, and conducting multi-property showing tours for buyer clients.

### 🔑 Core Problem Solved
Real estate agents manually spend **2 to 4 hours per showing day**:
1. Collecting listing addresses and MLS numbers from MLS databases (OneKey MLS, REcolorado, CRMLS, Bright MLS, etc.).
2. Calculating driving distances and route sequences across 5-10 properties.
3. Managing appointment window constraints, Open House schedules, and listing agent contact details.
4. Formatting professional itineraries to email or text to buyer clients.

### 💡 The Solution
MLS Tour Planner reduces this entire workflow to **under 2 minutes**:
- **Multi-Source Ingestion**: Ingests properties via single MLS lookup, bulk MLS lists, raw address strings, or AI optical document scanning of PDF flyers/screenshots via DeepSeek v4 Flash.
- **5,040 Permutation Route Optimization**: Evaluates all mathematical routes to minimize driving time while honoring locked stop sequences, visit durations, and travel buffers.
- **Interactive Workspace & Live Sync**: Provides dual Timeline and Google Interactive Map views with live hover synchronization.
- **Client Dispatch & Branded Itineraries**: Dispatches interactive web itineraries directly via Resend API and generates client-facing web links (`https://www.mlstourplanner.com/tours/tour_...`).

---

## 2. Technology Stack & System Architecture

The application is built on a modern, serverless, full-stack JavaScript/TypeScript framework designed for instant global rendering, high performance, and rapid cross-platform mobile deployment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (WEB / MOBILE)                     │
│  Next.js 15 React 19 Client Components • Tailwind CSS • Lucide Icons       │
│  Capacitor Native Mobile Wrapper (iOS Xcode / Android Studio)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            API SERVERLESS LAYER                             │
│  Next.js 15 App Router Route Handlers (/api/*)                              │
├─────────────────┬───────────────────┬───────────────────┬───────────────────┤
│  Authentication │  AI Extraction    │  Route Optimizer  │  Payment Engine   │
│  Next-Auth      │  DeepSeek v4      │  Google Distance  │  Stripe Checkout  │
│  Google OAuth   │  Cloudflare R2    │  Matrix + TSP     │  Stripe Portal    │
│  Apple ID OIDC  │  Photo Storage    │  Engine           │  Webhooks         │
└─────────────────┴─────────┬─────────┴─────────┬─────────┴─────────┬─────────┘
                            │                   │                   │
┌───────────────────────────▼───────────────────▼───────────────────▼─────────┐
│                           DATABASE & STORAGE LAYER                          │
│  Prisma ORM 5.22 • Neon PostgreSQL Serverless DB • Cloudflare R2 Bucket     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Stack Breakdown:

| Layer | Technology | Rationale & Selection Criteria |
| :--- | :--- | :--- |
| **Framework** | **Next.js 15.5 (App Router)** | Full-stack React 19 framework providing SSR, static generation, API route handlers, and server actions. |
| **Styling** | **Tailwind CSS + Vanilla Glassmorphism** | Custom dark mode UI palette with dynamic HSL glows, smooth animations, and ultra-responsive viewports. |
| **Database** | **Neon PostgreSQL + Prisma ORM 5.22** | Serverless PostgreSQL with auto-scaling connection pooling and type-safe database schemas. |
| **AI Processing** | **DeepSeek v4 Flash (`deepseek-v4-flash`)** | Low-latency LLM engine for multi-page document parsing, OCR property metadata extraction, and photo cropping. |
| **Media Storage** | **Cloudflare R2 Storage** | High-speed, zero-egress S3-compatible bucket storage for property listing thumbnails with 30-day auto-retention policies. |
| **Maps & Routing** | **Google Maps JS API + Distance Matrix** | Live interactive route polylines, custom marker overlays, real-time matrix distance/duration calculations. |
| **Payments** | **Stripe API + Customer Portal** | Hosted Stripe Checkout sessions with promo code support (`$14.99/mo` promo, `$29.99/mo` regular) and self-service portal. |
| **Email Dispatch** | **Resend API** | High-deliverability transactional email service for sending branded showing itineraries to clients. |

---

## 3. Detailed Architectural Components & Workflows

### 3.1 Authentication & Multi-Tenant Data Isolation
- **Dual Authentication**: Supports email/password credentials with verification tokens, plus **Google OAuth 2.0** (`prompt=select_account`) for instant 1-click agent login.
- **Apple ID Ready**: Designed with OIDC compliance to meet Apple App Store Guideline 4.8.
- **Data Isolation**: Every created tour attaches permanent Creator Agent metadata (`agent_email`, `agent_phone`, `agent_brokerage`) to prevent cross-agent data bleeding and ensure correct email signature dispatches.

### 3.2 2-Step Showing Tour Configuration
1. **Step 1: Parameters & Buyer Client**: Select saved buyer contact or enter new client details, select tour date, specify earliest start time (e.g. 09:30) and latest finish time (e.g. 16:00), and enter the starting origin address.
2. **Step 2: Multi-Source Listing Ingestion**:
   - **MLS Lookup**: Direct live query against MLS numbers (e.g. `ONEKEY-3489102`).
   - **Raw Addresses**: Bulk paste list of unformatted addresses.
   - **DeepSeek AI Scanner**: Upload single or multi-page listing flyers, MLS sheets, or screenshots. DeepSeek extracts listing price, bed/bath counts, sqft, listing agent contact, open house schedules, and crops primary listing photos.

### 3.3 Traveling Salesperson Problem (TSP) 5,040 Route Optimization Engine
- Calculates real-world driving distance and duration matrices between all property nodes via Google Distance Matrix API.
- Evaluates up to **5,040 route permutations** while respecting **user-locked stops** (`is_locked = true`), visit durations (default 25 min), travel buffers (default 5 min), and Open House time windows.
- Automatically flags properties that fall outside the agent's expected tour time window (`Outside Tour Window` alert).

### 3.4 Dual Workspace Views (`/tours/[id]`)
- **Timeline View**:
  - Full-width property address title with zero text truncation.
  - Priority dropdown selector (`⭐ Must See`, `🔹 Preferred`, `⚪ Optional`).
  - Inline visit duration (`- 25m +`) and travel buffer (`- 5m +`) touch controls.
  - Open House auto-detection badge (distinguishes same-day open house vs. appointment request required).
  - Dedicated horizontal action toolbar (**Edit Specs**, **Lock Order**, **Email Agent Request**, **Notes**, **Delete**, **Up/Down Order**).
- **Route Map View**:
  - Full-height interactive Google Map with custom numbered tour pins (`#1`, `#2`, `#3`).
  - Live hover sync: hovering over a property card in the timeline highlights the corresponding pin on the map.
  - Mode toggle: Google Interactive Map vs. Google Directions view.
  - Deep link launcher for official Google Maps Mobile Navigation App.

### 3.5 Client Dispatch & Public Web Itineraries
- **Email Modal**: Formats a responsive, branded HTML email with listing thumbnails, showing times, pricing specs, and listing agent info.
- **Dynamic Origin Resolution**: All client itinerary links dynamically read `process.env.BASE_URL` or `process.env.NEXT_PUBLIC_BASE_URL` to output clean production URLs (`https://www.mlstourplanner.com/tours/tour_...`).
- **Resend Integration**: 1-click direct email dispatch to the buyer client.

### 3.6 Dashboard & Tour History Lifecycle
- **Real-Time Search**: Multi-attribute filtering across tour names, client names/emails, property addresses, and MLS numbers.
- **Auto-Completion**: Tours whose date and finish time (`tour_date` + `latest_finish`) have passed automatically transition to `COMPLETED` status.
- **Folded History Section**: Active/upcoming tours stay front-and-center, while completed past tours collapse neatly into a **"Folded Past Tour History"** section with 1-click expand/collapse capabilities.

---

## 4. Cross-Platform Mobile Architecture Strategy

Rather than building separate codebase branches for web, iOS, and Android, MLSTourPlanner uses a **Unified Shared Codebase Strategy** via **Capacitor by Ionic**.

```
                           ┌────────────────────────────────┐
                           │   SINGLE NEXT.JS CODEBASE      │
                           │  (HTML, TSX, React 19, API)    │
                           └───────────────┬────────────────┘
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             │                             │                             │
             ▼                             ▼                             ▼
   ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
   │  WEB APPLICATION  │         │   iOS APP (APPLE) │         │ ANDROID APP (PLAY)│
   │  Vercel / Next.js │         │  Capacitor Xcode  │         │ Capacitor Studio  │
   │  mlstourplanner.com│         │  App Store (.ipa) │         │ Google Play (.apk)│
   └───────────────────┘         └───────────────────┘         └───────────────────┘
```

### Why Capacitor is the Optimal Architecture:
1. **100% Code Reuse**: Zero rewriting required. The exact UI components, route optimizer, Google Maps integration, and Stripe payment flows run natively inside iOS and Android shells.
2. **Instant Over-The-Air (OTA) Updates**: 95%+ of feature updates, bug fixes, and UI improvements update live on agents' phones without needing to re-submit to Apple or Google Play store review.
3. **Native Capabilities**: Full access to native device hardware (camera for flyer scanning, push notifications for showing alerts, native GPS location).
4. **App Store Compliance**: Compliant with Apple Guideline 4.8 by incorporating Google & Apple ID social logins.

---

## 5. Security, Environment & Financial Model

### 5.1 Environment Configuration (`.env`)
```env
# Database
DATABASE_URL="postgresql://neondb_owner:***@ep-floral-band.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Base Domain
BASE_URL="https://www.mlstourplanner.com"
NEXT_PUBLIC_BASE_URL="https://www.mlstourplanner.com"

# Email Engine
RESEND_API_KEY=re_iezA6ZmN_...
RESEND_FROM_EMAIL=admin@mlstourplanner.com

# OAuth Credentials
GOOGLE_CLIENT_ID=983730625598-***.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***

# AI Engine
DEEPSEEK_API_KEY=sk-***
DEEPSEEK_MODEL=deepseek-v4-flash
```

### 5.2 Monetization & Billing Architecture
- **Free Trial**: 3 complete showing tours allowed.
- **PRO Unlimited Subscription**:
  - Standard List Price: **$29.99/mo**
  - Promotional Launch Price: **$14.99/mo**
- **Self-Service Stripe Portal**: Agents can view invoices, update credit cards, or cancel subscriptions at any time via `/api/create-portal-session`.

---

## 6. Prompt for External AI Review & Technical Evaluation

> **Instruction for Reviewer AI**:  
> Please review this technical proposal and codebase architecture for **MLS Tour Planner**. Provide an objective evaluation on the following 5 dimensions:
> 
> 1. **Architectural Feasibility & Scalability**: Is the Next.js 15 + Prisma + Neon PostgreSQL + Capacitor stack optimal for scaling to 50,000+ real estate agents?
> 2. **AI & Routing Engine Efficiency**: Evaluate the DeepSeek v4 Flash OCR ingestion pipeline and the 5,040 TSP route optimization algorithm. Are there bottleneck risks or edge cases?
> 3. **Mobile & UX Optimization**: Assess the dual Timeline / Google Interactive Map responsive layout and Capacitor cross-platform deployment strategy.
> 4. **Security & Monetization Structure**: Review the Stripe Checkout integration, OAuth 2.0 Google/Apple login strategy, and multi-tenant agent data isolation.
> 5. **Recommendations for Improvement**: What 3 high-impact technical enhancements or feature additions would you recommend prior to scaling marketing efforts?
