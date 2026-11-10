# PayAssist AI — Autonomous Agentic Commerce Platform

> **Build What's Next with PayPal and AI** | Submission for the **PayPal AI Hackathon 2026** ($60,000+ Prize Pool)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PayPal](https://img.shields.io/badge/PayPal-REST%20API%20v2%20%2B%20SDK-003087?logo=paypal&logoColor=white)](https://developer.paypal.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![AG Grid](https://img.shields.io/badge/AG%20Grid-v33.0-orange)](https://www.ag-grid.com/)
[![Render](https://img.shields.io/badge/Render-Blueprint%20Ready-46E3B7?logo=render&logoColor=black)](render.yaml)
[![APIMatic](https://img.shields.io/badge/APIMatic-OpenAPI%20Context-00C58A)](apimatic-context.json)

---

## 1. Executive Summary & Overview

Modern online commerce suffers from high dispute overhead, static checkout friction, and manual invoicing latency. 

**PayAssist AI** reimagines digital commerce as an **Autonomous Financial Operating System** where AI agents don't merely converse—they act with **economic agency, automated negotiation guardrails, and proactive escrow defense** over real PayPal Rails.

### Core Breakthrough Innovations:

1. **Autonomous Sentinel AI Shield (Fraud & Escrow Guardian):**
   - Continuously evaluates incoming transaction streams using Bayesian risk scoring (0–100).
   - Detects card-testing velocity bursts, disposable email domains, and anomalous order amounts.
   - Autonomously recommends or triggers **PayPal Escrow Holds** before final settlement to protect seller standing.

2. **Agentic Deal Negotiator (Dynamic Smart Checkout):**
   - Buyers interact with an autonomous sales agent directly in the checkout experience.
   - Negotiates startup concessions, annual pre-commitments, and volume bundles within strict merchant margin boundaries.
   - **Dynamically recalculates and re-renders official PayPal Smart Buttons** in the DOM with the authorized discounted amount.

3. **Multimodal Hands-Free Voice Invoicing:**
   - Web Speech recognition and Neural Speech Synthesis enable merchants to run financial operations hands-free.
   - Merchants speak commands such as: *"PayAssist, draft an invoice for Acme Corp for $1,500 and send it."*
   - Gemini 2.0 Flash executes the PayPal Invoicing API v2 tool call and speaks the confirmation aloud.

4. **Enterprise AG Grid & AG Charts Financial Command:**
   - Real-time ledger tables with multi-field filtering, customer avatar initials, status pills, and one-click CSV export.
   - Interactive AG Charts with area gradient fills and linear regression cash-flow projections.

---

## 2. Tools & AI Services Used

| Component / Layer | Technology | Role & Purpose |
| :--- | :--- | :--- |
| **Foundation AI Model** | **Google Gemini 2.0 Flash** (`@google/generative-ai`) | Drives tool-calling functions (`create_invoice`, `list_invoices`, `search_transactions`, `send_payout`, `get_business_health`). |
| **Payment Rails** | **PayPal REST API v2** & **PayPal JavaScript SDK** | Orders v2 (`/v2/checkout/orders`), Invoicing v2 (`/v2/invoicing/invoices`), Payouts v1 (`/v1/payments/payouts`), and Smart Buttons. |
| **Grid & Visualization** | **AG Grid Community v33** & **AG Charts v11** | Enterprise ledger tables, CSV export, quick filter, and area trend curves. |
| **Local Database** | **sql.js (WebAssembly / Pure JS SQLite)** | Portable database pre-seeded with 6 months of transaction history (no C++ native add-on build steps required). |
| **Cloud Deployment** | **Render** ([`render.yaml`](render.yaml)) | Blueprint infrastructure-as-code configuration for full-stack service and worker orchestration. |
| **API Validation** | **APIMatic** ([`apimatic-context.json`](apimatic-context.json)) | OpenAPI 3.0 context definition for automated SDK generation and AI tool mapping. |

---

## 3. Targeted Prize Tracks

1. **Best Use of PayPal + AI:** Meaningful integration of 4 PayPal REST APIs with Gemini 2.0 Flash tool-calling.
2. **Best Use of Agentic Commerce:** Autonomous deal negotiation and proactive escrow holds without manual human intervention.
3. **Best Use of AG Grid & AG Charts:** Full enterprise financial ledger with customer avatars, status pills, and area charts.
4. **Best Use of Render:** Automated deployment blueprint in `render.yaml`.
5. **Best Use of APIMatic:** Complete `apimatic-context.json` API specification.
6. **Most Creative & Best Demo Delivery:** 60-Second Interactive Judge Tour modal built directly into the UI header.

---

## 4. Setup and Run Instructions (For Judges)

### Prerequisites
* **Node.js** v18 or higher (Node v20+ recommended)
* **npm** v9 or higher

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/payassist-ai.git
cd payassist-ai
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env` and supply your credentials:
```env
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_SECRET=your_paypal_sandbox_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
NODE_ENV=development
```

### Step 4: Launch the Unified Server
```bash
npm run dev
```

### Step 5: Open the Web Application
Open your browser and navigate to:
```
http://localhost:3001
```

---

## 5. 3-Minute Video Demo Outline (YouTube Submission)

| Time | Screen / Feature | What to Show & Say |
| :--- | :--- | :--- |
| **0:00 – 0:30** | **Executive Dashboard (`/`)** | Introduce PayAssist AI: *"Commerce needs autonomy. PayAssist AI combines Google Gemini 2.0 with PayPal Rails to create an autonomous financial operating system."* Point out the **60-Sec Judge Tour** button. |
| **0:30 – 1:15** | **Agentic Smart Checkout (`/checkout`)** | Show the Commercial Concierge chat. Type: *"Can I get 15% off for our early-stage startup?"* Show the AI calculate margins, approve the concession, and watch the official PayPal Smart Buttons re-render live with the new price. |
| **1:15 – 2:00** | **Sentinel AI Fraud Shield (`/sentinel`)** | Click *"Simulate Bot Attack ($0.85)"*. Show the Bayesian anomaly index spike to 85/100 and demonstrate how Sentinel autonomously marks the transaction for PayPal Escrow Hold. |
| **2:00 – 2:30** | **Voice Commerce Drawer** | Click the AI Copilot button (bottom right), activate the microphone, and speak: *"Show revenue summary"* or *"Create an invoice for Acme for $1,500"*. Show the tool call executed and spoken aloud. |
| **2:30 – 3:00** | **AG Grid Ledger & Conclusion** | Show instant search and CSV export across the AG Grid tables. Conclude with Render blueprint and APIMatic integration. |

---

## 6. Project Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PayAssist AI Frontend (React 18 SPA)                 │
│  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐ │
│  │ Dashboard     │ │ Sentinel AI    │ │ Invoices      │ │ Smart      │ │
│  │ (AG Charts)   │ │ (Risk Stream)  │ │ (AG Grid)     │ │ Checkout   │ │
│  └───────┬───────┘ └────────┬───────┘ └───────┬───────┘ └─────┬──────┘ │
│          │                  │                 │               │        │
│  ┌───────▼──────────────────▼─────────────────▼───────────────▼──────┐ │
│  │           Multimodal Voice & Action Agent Drawer (Gemini)         │ │
│  └──────────────────────────────────┬────────────────────────────────┘ │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ /api/*
┌─────────────────────────────────────▼──────────────────────────────────┐
│                   Express Backend & Multi-Agent Engine                 │
│  ┌───────────────────┐ ┌────────────────────┐ ┌─────────────────────┐ │
│  │ Sentinel Guardian │ │ Gemini 2.0 Agent   │ │ PayPal Orchestrator │ │
│  │ (Risk Scoring)    │ │ (8 Tool Functions) │ │ (REST API Service)  │ │
│  └─────────┬─────────┘ └─────────┬──────────┘ └──────────┬──────────┘ │
│            │                     │                       │            │
│  ┌─────────▼─────────────────────▼───────────────────────▼──────────┐ │
│  │                 SQLite Persistent Database (sql.js)              │ │
│  │      transactions │ invoices │ customers │ risk_logs │ messages  │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │
               ┌──────────────────────▼──────────────────────┐
               │         PayPal Sandbox Complete Rails       │
               │  • Orders API v2 (Capture & Smart Buttons)  │
               │  • Invoicing API v2 (Draft, Send, Track)    │
               │  • Payouts API v1 (Batch Disbursements)     │
               │  • OAuth2 Token Lifecycle Management        │
               └─────────────────────────────────────────────┘
```

---

## 7. License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
