# EdgeBench 🖥

**Linux Performance Monitoring & Benchmarking Platform**

A full-stack platform for real-time system monitoring, benchmarking, Docker container tracking, network diagnostics, alerting, and automated reporting.

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Live gauges, resource trend chart, quick stats |
| **System Metrics** | CPU, Memory, Disk, Network with real-time area charts |
| **Process Analyzer** | Sortable process table, search, zombie detection |
| **Benchmark Engine** | Pure-Python CPU/Memory/Disk benchmarks with scoring |
| **Docker Monitor** | Container stats, health, restart counts, inline logs |
| **Diagnostics** | Ping, DNS lookup, port scanner, internet connectivity |
| **Alerts** | Threshold-based alerting with severity levels |
| **Analytics** | Historical trend charts (1h → 30d), benchmark history |
| **Reports** | HTML + JSON reports with download |

---

## Quick Start

### Option 1 — Docker Compose (Recommended)

```bash
docker compose up --build
```

Then open:
- **UI**: http://localhost:3000
- **API docs**: http://localhost:8000/docs

---

### Option 2 — Manual Setup

#### Backend

```bash
cd backend

# Create and activate virtualenv
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend (in a second terminal)

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm start
```

Open http://localhost:3000

---

## Tech Stack

**Backend**
- Python 3.11, FastAPI, SQLAlchemy, SQLite
- psutil (system metrics), docker SDK (container monitoring)
- WebSocket for real-time streaming

**Frontend**
- React 18, React Router 6
- Recharts (charts), Lucide-React (icons), Axios (HTTP)

---

## API Reference

Base URL: `http://localhost:8000`

| Endpoint | Description |
|---|---|
| `GET /api/v1/metrics/current` | Live system metrics |
| `GET /api/v1/metrics/history` | Historical snapshots |
| `GET /api/v1/processes/` | All running processes |
| `GET /api/v1/processes/top-cpu` | Top CPU consumers |
| `POST /api/v1/benchmarks/cpu` | Run CPU benchmark |
| `POST /api/v1/benchmarks/memory` | Run memory benchmark |
| `POST /api/v1/benchmarks/disk` | Run disk benchmark |
| `GET /api/v1/docker/containers` | Docker container list |
| `POST /api/v1/diagnostics/ping` | Ping a host |
| `POST /api/v1/diagnostics/dns` | DNS lookup |
| `POST /api/v1/diagnostics/port-scan` | Scan ports |
| `GET /api/v1/alerts/active` | Active alerts |
| `GET /api/v1/analytics/trends?period=24h` | Trend data |
| `GET /api/v1/reports/html` | HTML report |
| `GET /api/v1/reports/json` | JSON report |
| `WS /ws` | Real-time metrics WebSocket |

Full interactive docs: http://localhost:8000/docs

---

## Alert Thresholds (auto-configured)

| Resource | High | Critical |
|---|---|---|
| CPU | 85% | 95% |
| Memory | 80% | 90% |
| Disk | 80% | 90% |
| Swap | 70% | 85% |

Alerts auto-resolve when the resource drops below threshold.

---

## Benchmarks Explained

| Benchmark | Tests |
|---|---|
| **CPU** | Sieve of Eratosthenes (500k primes), 150×150 matrix multiply, Fibonacci stress |
| **Memory** | 64MB alloc, sequential read/write, 100k random accesses |
| **Disk** | 32MB sequential write/read, 1000 random seeks |

All benchmarks are pure Python — no external tools required.

---

## Project Structure

```
edgebench/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── database.py         # SQLite/SQLAlchemy setup
│   │   ├── models.py           # DB models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── routers/            # API route handlers
│   │   └── services/           # Business logic
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.js              # Layout + routing
        ├── services/api.js     # API client
        └── components/         # Page components
```

---

## Requirements

- **Backend**: Python 3.10+
- **Frontend**: Node.js 18+
- **Docker** (optional): Docker Desktop or Docker Engine

Docker monitoring requires the Docker socket (`/var/run/docker.sock`) to be accessible.

---

## Skills Demonstrated

Linux Administration · System Monitoring · Performance Benchmarking ·
Docker Operations · Networking · TCP/IP · Troubleshooting ·
Infrastructure Monitoring · Data Pipelines · Alerting · FastAPI ·
React · SQLite · REST APIs · WebSockets
