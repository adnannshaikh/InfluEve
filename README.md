# Influeve — Influencer Evaluation & Reporting (FastAPI + React)

Influeve helps brands evaluate Instagram creators using a clean KPI framework and lightweight reports. It fetches profile metrics, runs scoring logic, and renders a tidy report with charts (radar) and CSV export.

---

## Features

- **KPI Engine**: Authenticity, Relevance, Resonance (+ optional Expected ROAS, Trust Index)
- **Reports UI**: Radar chart, top signals, per-influencer rows, CSV export
- **API**: FastAPI backend with `/reports/{briefId}`, `/health`, and utility endpoints
- **Data Fetch**: Pluggable fetcher (Instagram Graph API / mock adapters)
- **Storage**: SQLModel/SQLite by default (easily swap to Postgres)
- **DX**: Clear dev scripts, .env examples, hot reload (Vite + Uvicorn)

---

## KPI Definitions (Core)

These are normalized 0–100 unless noted. Tune formulas in `backend/app/core/scoring.py`.

- **Authenticity**  
  Proxy for organic behaviour: engagement quality, follower/like ratio, comment quality ratio, suspicious spikes dampening.

- **Relevance**  
  Semantic match to brief (category/tags/keywords) + audience geo/demo overlap. Uses weighted tag matching and optional keyword scoring.

- **Resonance**  
  Recent engagement momentum vs. creator baseline (rolling 30/90-day uplift), save/share density if available.

- **Expected ROAS (optional)**  
  Heuristic from CPM/CPC assumptions × audience reach × CTR estimate × conversion rate; **unit:** multiple (e.g., `1.8x`).

- **Trust Index (optional)**  
  Risk-adjusted score penalizing anomalies (sudden follower jumps, bot-like comments), disclosure compliance, and ban-word density.

> **Note:** If Instagram API fields are limited, we backfill with safe defaults and mark fields as `estimated`.

---


---

## 🔧 Prerequisites

- **Node.js** ≥ 18 and npm / pnpm / yarn
- **Python** ≥ 3.10
- **Git**

*(Optional)* SQLite (bundled) or Postgres if you switch drivers.

---

## Quick Start
1) Clone
git clone <your-repo-url> influeve
cd influeve

2) Backend
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API at http://localhost:8000

3) Frontend
cd frontend
npm install
npm run dev
# App at http://localhost:5173 (Vite default)

--> Frontend Notes

ScoreRadar.tsx supports both legacy {authenticity,relevance,resonance} and new shape with optional {expected_roas,trust_index}.

ReportsPage.tsx fetches /reports/:briefId and renders table + radar + export button.

--> Database Notes

Default: SQLite file influeve.db in /backend.

First run auto-creates tables via SQLModel metadata. If you changed models (e.g., added owner_id) and see no such column, run a migration or drop/recreate the DB during development.
