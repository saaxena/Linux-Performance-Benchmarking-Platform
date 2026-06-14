<div align="center">

# ⚡ EdgeBench

### Linux Performance Monitoring & Benchmarking Platform

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**A unified platform for real-time system monitoring, performance benchmarking, Docker container tracking, network diagnostics, threshold alerting, and automated reporting — all in one dark-themed web dashboard.**

<br/>

[🚀 Quick Start](#-quick-start) · [📐 Architecture](#-architecture) · [📖 API Reference](#-api-reference) · [🛠 Configuration](#-configuration) · [📁 Project Structure](#-project-structure)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
  - [Option 1: Docker Compose](#option-1-docker-compose-recommended)
  - [Option 2: Manual Setup](#option-2-manual-setup)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [Pages & Modules](#-pages--modules)
- [Benchmarks Explained](#-benchmarks-explained)
- [Alert Thresholds](#-alert-thresholds)
- [Skills Demonstrated](#-skills-demonstrated)
- [Troubleshooting](#-troubleshooting)

---

## 🔍 Overview

System administrators and infrastructure engineers typically juggle multiple tools to monitor CPU, memory, disk, network, processes, and containers. **EdgeBench** consolidates all of these into a single self-hosted web platform that runs directly on your Linux system, collects real metrics using `psutil`, stores history in SQLite, and serves everything through a FastAPI backend and React dashboard.

**What makes this different from tools like Grafana + Prometheus?**
- Zero external dependencies — no agents, no exporters, no separate databases
- Runs in a single `docker compose up` command
- Includes a built-in benchmarking engine (no `fio`, `stress-ng`, or `iperf3` required)
- Ships with diagnostics (ping, DNS, port scan) in the same interface
- Generates downloadable HTML + JSON reports out of the box

---

## ✨ Features

### 🖥 System Monitoring Engine
Real-time collection of system metrics every 30 seconds (configurable):
- **CPU**: utilization %, load averages (1/5/15 min), frequency, temperature, core count
- **Memory**: used/available/total, usage %, swap metrics
- **Disk**: total/used/free, usage %, read/write throughput (bytes/sec)
- **Network**: bytes sent/received per second, TCP connection count, packet counts
- **System**: uptime, boot time

### 📊 Process Analyzer
- Sortable table of all running processes (by CPU, memory, PID, or name)
- Real-time mini usage bars per process
- Search/filter processes by name
- Zombie process detection and warning
- Per-process: PID, name, status, CPU%, memory%, memory MB, threads, user

### ⚡ Benchmarking Engine
Pure-Python benchmarks — no external tools required:
- **CPU**: Sieve of Eratosthenes (500k primes), 150×150 matrix multiplication, Fibonacci stress test
- **Memory**: 64 MB allocation, sequential read/write throughput, 100k random accesses
- **Disk**: 32 MB sequential write, sequential read, 1000 random seek I/O
- All benchmarks generate a score, duration, and detailed sub-results
- Results stored in SQLite for historical comparison

### 🐳 Docker Monitoring
- Lists all running (or all) containers
- Per-container: CPU%, memory used/limit/%, restart count, health status, port mappings
- Inline log viewer (last N lines) without leaving the dashboard
- Graceful degradation when Docker is not available

### 🔧 Diagnostics Toolkit
- **Ping**: ICMP ping via system command with output display
- **DNS Lookup**: Resolves hostnames to IP addresses with response time
- **Port Scanner**: Checks a configurable list of ports (async, very fast)
- **Connectivity Check**: Validates internet reachability to multiple DNS/HTTP targets

### 🚨 Alerting Engine
- Automatic threshold monitoring on every metrics collection cycle
- Severity levels: `medium`, `high`, `critical`
- Alerts auto-resolve when resource drops below threshold
- Alert history stored in SQLite
- Manual resolve button in UI
- Alert count shown in sidebar badge

### 📈 Historical Analytics
- Time-period selector: 1h / 6h / 24h / 7d / 30d
- Bucketed trend charts for CPU + memory overlay, disk + network
- Benchmark score history bar charts
- Database summary (total records, oldest/newest entry)

### 📄 Automated Reporting
- **JSON report**: Machine-readable system snapshot (downloadable)
- **HTML report**: Beautiful dark-themed printable report in a new tab
- Reports include: system info, 24h utilization averages, alert history, benchmark results

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend Runtime** | Python 3.11 | Core language |
| **Web Framework** | FastAPI 0.109 | REST API + WebSocket |
| **ORM** | SQLAlchemy 2.0 | Database abstraction |
| **Database** | SQLite | Metric & alert storage |
| **System Metrics** | psutil 5.9 | CPU/memory/disk/network/process data |
| **Container SDK** | docker-py 7.0 | Docker daemon integration |
| **ASGI Server** | uvicorn | Async HTTP/WS server |
| **Frontend** | React 18 | SPA framework |
| **Routing** | React Router 6 | Client-side navigation |
| **Charts** | Recharts 2.12 | Area, line, bar charts |
| **Icons** | Lucide React | Icon library |
| **HTTP Client** | Axios 1.6 | API communication |
| **Containerisation** | Docker + Compose | Deployment |
| **Web Server** | Nginx (Alpine) | Frontend serving + reverse proxy |

---

## ✅ Prerequisites

Make sure you have the following installed:

**For Docker Compose (easiest):**
```
Docker Desktop ≥ 24.x   or   Docker Engine + Docker Compose plugin
```

**For manual setup:**
```
Python ≥ 3.10
Node.js ≥ 18.x
npm ≥ 9.x
```

**Linux tools** (auto-installed in Docker, optional for manual):
```
ping (iputils-ping)
traceroute
```

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

**Step 1 — Clone or extract the project**
```bash
# If cloning from GitHub:
git clone https://github.com/YOUR_USERNAME/edgebench.git
cd edgebench

# Or if you downloaded the zip:
unzip edgebench.zip
cd edgebench
```

**Step 2 — Start everything**
```bash
docker compose up --build
```

This will:
1. Build the Python backend image (installs all pip packages)
2. Build the React frontend image (runs `npm install` + `npm run build`)
3. Start both services and connect them

**Step 3 — Open the dashboard**

| Service | URL |
|---------|-----|
| **Web Dashboard** | http://localhost:3000 |
| **API (FastAPI)** | http://localhost:8000 |
| **Interactive API Docs** | http://localhost:8000/docs |
| **ReDoc API Docs** | http://localhost:8000/redoc |

**Step 4 — Stop everything**
```bash
docker compose down
```

> **Note on Docker monitoring inside Docker:** For the Docker monitor module to see your host containers, the Docker socket must be accessible. This is configured in `docker-compose.yml` via `volumes: /var/run/docker.sock:/var/run/docker.sock`. On macOS/Windows Docker Desktop, this works by default.

---

### Option 2: Manual Setup

This runs the backend and frontend as native processes, which gives you more accurate system metrics (since you're monitoring the real host, not a container).

#### Step 1 — Set up the Backend

```bash
# Navigate to backend directory
cd edgebench/backend

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate        # Linux / macOS
# OR
venv\Scripts\activate           # Windows

# Install all dependencies
pip install -r requirements.txt
```

Expected output (abbreviated):
```
Successfully installed fastapi-0.109.1 uvicorn-0.27.0 sqlalchemy-2.0.25
psutil-5.9.8 docker-7.0.0 ...
```

#### Step 2 — Start the Backend

```bash
# From inside edgebench/backend/ with venv activated:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

The backend will immediately:
- Create `edgebench.db` (SQLite database)
- Start the background metrics collector (runs every 30 seconds)
- Expose the REST API and WebSocket endpoint

#### Step 3 — Set up the Frontend

Open a **new terminal** (keep the backend running):

```bash
# Navigate to frontend directory
cd edgebench/frontend

# Install Node.js dependencies
npm install --legacy-peer-deps
```

> The `--legacy-peer-deps` flag is needed due to peer dependency resolution in some npm versions. This is safe to use.

#### Step 4 — Start the Frontend

```bash
npm start
```

This starts the React development server. You'll see:
```
Compiled successfully!

You can now view edgebench-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

Your browser should open automatically. If not, go to **http://localhost:3000**.

---

## 📁 Project Structure

```
edgebench/
│
├── backend/                          # Python FastAPI backend
│   ├── Dockerfile                    # Backend container definition
│   ├── requirements.txt              # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py                   # FastAPI app entry point, lifespan, WebSocket
│       ├── database.py               # SQLAlchemy engine + session factory
│       ├── models.py                 # ORM models (SystemMetric, Alert, BenchmarkResult, ...)
│       ├── schemas.py                # Pydantic request/response schemas
│       │
│       ├── services/                 # Business logic layer
│       │   ├── metrics_collector.py  # psutil-based real-time collector (background task)
│       │   ├── benchmark_service.py  # Pure-Python CPU/memory/disk benchmarks
│       │   ├── docker_service.py     # Docker SDK integration + graceful fallback
│       │   └── alert_service.py      # Threshold checking + alert CRUD
│       │
│       └── routers/                  # API route handlers (one file per domain)
│           ├── metrics.py            # /api/v1/metrics/*
│           ├── processes.py          # /api/v1/processes/*
│           ├── benchmarks.py         # /api/v1/benchmarks/*
│           ├── docker_monitor.py     # /api/v1/docker/*
│           ├── diagnostics.py        # /api/v1/diagnostics/*
│           ├── alerts.py             # /api/v1/alerts/*
│           ├── analytics.py          # /api/v1/analytics/*
│           └── reports.py            # /api/v1/reports/*
│
├── frontend/                         # React frontend
│   ├── Dockerfile                    # Multi-stage: build React → serve with Nginx
│   ├── nginx.conf                    # Nginx config (SPA routing + API proxy)
│   ├── package.json                  # Node.js dependencies and scripts
│   └── src/
│       ├── index.js                  # React entry point
│       ├── index.css                 # Base styles + scrollbar
│       ├── App.js                    # Root component: sidebar layout + React Router
│       │
│       ├── services/
│       │   └── api.js                # Centralised Axios API client (all endpoints)
│       │
│       └── components/               # One component per page/module
│           ├── Dashboard.js          # Overview: gauges, trend chart, quick stats
│           ├── SystemMetrics.js      # CPU/memory/disk/network area charts
│           ├── ProcessAnalyzer.js    # Sortable process table + search
│           ├── BenchmarkEngine.js    # Run benchmarks, view scores + history
│           ├── DockerMonitor.js      # Container cards with stats + log viewer
│           ├── Diagnostics.js        # Ping / DNS / port scan / connectivity
│           ├── AlertsPanel.js        # Alert list with severity + resolve
│           ├── Analytics.js          # Historical trends with period selector
│           └── Reports.js            # JSON/HTML report generator + download
│
├── docker-compose.yml                # Orchestrates backend + frontend
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
└── README.md                         # This file
```

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│                   http://localhost:3000                      │
└────────────────────────┬────────────────────────────────────┘
                         │  HTTP / WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Frontend (SPA)                      │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌─────────┐  │
│  │Dashboard │ │  Metrics  │ │  Benchmarks  │ │ Docker  │  │
│  └──────────┘ └───────────┘ └──────────────┘ └─────────┘  │
│  ┌────────────┐ ┌────────┐ ┌───────────┐ ┌──────────────┐  │
│  │Diagnostics │ │Alerts  │ │ Analytics │ │   Reports    │  │
│  └────────────┘ └────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        services/api.js  (Axios client)               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │  REST API calls + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend  :8000                         │
│                                                             │
│  ┌─────────────────┐    ┌────────────────────────────────┐  │
│  │  REST Routers   │    │     Background Tasks           │  │
│  │  /api/v1/*      │    │  MetricsCollector (30s loop)   │  │
│  │                 │    │  AlertService (threshold check) │  │
│  └────────┬────────┘    └───────────────┬────────────────┘  │
│           │                             │                    │
│  ┌────────▼─────────────────────────────▼──────────────┐   │
│  │              Service Layer                           │   │
│  │  metrics_collector · benchmark_service               │   │
│  │  docker_service    · alert_service                   │   │
│  └────────────────────────┬─────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │                  Data Layer                          │   │
│  │   SQLAlchemy ORM → SQLite (edgebench.db)             │   │
│  │   Tables: system_metrics · alerts ·                  │   │
│  │           benchmark_results · diagnostic_results     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     ┌─────────┐   ┌──────────┐  ┌──────────────┐
     │  psutil │   │ Docker   │  │  subprocess  │
     │ (Linux) │   │  SDK     │  │ (ping, etc.) │
     └─────────┘   └──────────┘  └──────────────┘
```

---

## 📖 API Reference

Base URL: `http://localhost:8000`

Interactive docs: **http://localhost:8000/docs** (Swagger UI)

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/metrics/current` | Live system snapshot (CPU, mem, disk, net) |
| `GET` | `/api/v1/metrics/history?limit=100` | Recent stored metric records |
| `GET` | `/api/v1/metrics/collect` | Force immediate collection |
| `GET` | `/api/v1/metrics/summary` | 24h averages and peaks |

### Processes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/processes/?sort_by=cpu&limit=50` | All processes |
| `GET` | `/api/v1/processes/top-cpu?limit=10` | Top CPU consumers |
| `GET` | `/api/v1/processes/top-memory?limit=10` | Top memory consumers |
| `GET` | `/api/v1/processes/zombies` | Zombie processes |
| `GET` | `/api/v1/processes/search?name=nginx` | Search by name |

### Benchmarks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/benchmarks/cpu` | Run CPU benchmark |
| `POST` | `/api/v1/benchmarks/memory` | Run memory benchmark |
| `POST` | `/api/v1/benchmarks/disk` | Run disk benchmark |
| `POST` | `/api/v1/benchmarks/all` | Run all three sequentially |
| `GET` | `/api/v1/benchmarks/history?limit=50&benchmark_type=cpu` | Benchmark history |
| `GET` | `/api/v1/benchmarks/status` | Check if benchmark is running |

### Docker

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/docker/status` | Docker daemon availability |
| `GET` | `/api/v1/docker/containers?all=false` | Container list with stats |
| `GET` | `/api/v1/docker/containers/{id}/logs?tail=100` | Container logs |
| `GET` | `/api/v1/docker/containers/{id}/stats` | Raw container stats |

### Diagnostics

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/diagnostics/ping` | `{"target": "8.8.8.8", "count": 4}` | ICMP/TCP ping |
| `POST` | `/api/v1/diagnostics/dns` | `{"hostname": "google.com"}` | DNS resolution |
| `POST` | `/api/v1/diagnostics/port-scan` | `{"target": "localhost", "ports": [22, 80]}` | Port availability |
| `GET` | `/api/v1/diagnostics/connectivity` | — | Internet reachability check |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/alerts/` | All alerts (optional `?resolved=true/false`) |
| `GET` | `/api/v1/alerts/active` | Only unresolved alerts |
| `GET` | `/api/v1/alerts/history?limit=200` | Full alert history |
| `GET` | `/api/v1/alerts/stats` | Count by severity |
| `GET` | `/api/v1/alerts/thresholds` | Current threshold config |
| `PUT` | `/api/v1/alerts/{id}/resolve` | Mark an alert as resolved |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/trends?period=24h` | Bucketed trend data (1h/6h/24h/7d/30d) |
| `GET` | `/api/v1/analytics/cpu-trend?hours=24` | Raw CPU time series |
| `GET` | `/api/v1/analytics/memory-trend?hours=24` | Raw memory time series |
| `GET` | `/api/v1/analytics/benchmark-history?limit=20` | Recent benchmark scores |
| `GET` | `/api/v1/analytics/summary` | DB record counts + date range |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/reports/json` | Full JSON report |
| `GET` | `/api/v1/reports/html` | Rendered HTML report (open in browser) |

### WebSocket

```
ws://localhost:8000/ws
```

Pushes a fresh metrics snapshot every **5 seconds**. Same schema as `/api/v1/metrics/current`.

```json
{
  "timestamp": "2025-01-15T14:32:01.123456",
  "cpu": { "percent": 23.4, "load_1min": 0.91, "cores": 8, ... },
  "memory": { "percent": 61.2, "used": 9876543210, ... },
  "disk": { "percent": 45.1, ... },
  "network": { "bytes_recv_per_sec": 12345.6, ... },
  "system": { "uptime_seconds": 86400.0, ... }
}
```

---

## 🛠 Configuration

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

```env
# Database location (SQLite path or PostgreSQL URL)
DATABASE_URL=sqlite:///./edgebench.db

# How often metrics are collected (seconds)
METRICS_INTERVAL=30

# Backend API URL used by the frontend
REACT_APP_API_URL=http://localhost:8000
```

**Environment variables for Docker Compose:**

You can override any variable directly in `docker-compose.yml` under the `environment:` key, or create a `.env` file in the project root (Compose reads it automatically).

---

## 🖥 Pages & Modules

### Dashboard
The entry point. Shows:
- Four real-time gauge cards (CPU %, Memory %, Disk %, Swap %) with dynamic color coding (green → orange → red as usage rises)
- Quick stat row: uptime, network in/out rates, TCP connections, active alert count
- A 60-point trend line chart overlaying CPU, memory, and disk
- CPU detail row: frequency, temperature, load averages, disk I/O rates

Auto-refreshes every **10 seconds**.

### System Metrics
Four full-height area charts (CPU, Memory, Disk, Network), each with:
- Historical area chart from stored data (last 80 samples)
- Metadata grid below each chart with precise values
- Disk utilization bar with gradient color
- Network chart overlaying receive/send rates (dual Y-axis)

Auto-refreshes every **8 seconds**.

### Process Analyzer
- Full process table with inline mini usage bars
- Sort by: CPU (default), Memory, PID, or Name
- Live search that queries the backend and filters results
- Zombie process banner with PID list
- Auto-refreshes every **15 seconds** (disabled during search)

### Benchmark Engine
- Three benchmark cards (CPU, Memory, Disk)
- "Run All" button executes all three sequentially
- Each card shows score, duration, expandable detail table
- Score history bar chart below each card (last 10 runs)
- Results are persisted to SQLite

> **Performance note:** Benchmarks run in a thread pool so they don't block the API server. The CPU benchmark takes roughly 2–5 seconds, memory about 3–8 seconds, disk about 5–15 seconds depending on your hardware.

### Docker Monitor
- Status indicator (Docker available / unavailable)
- Toggle to show all containers vs. only running
- Container cards showing: name, image, ID, status badge, restart count, CPU/memory bars, port mappings
- Inline log viewer — click "Logs" to expand a scrollable terminal-style log panel

### Diagnostics
| Tool | How to use |
|------|-----------|
| **Ping** | Enter any hostname or IP → click Ping → see raw output |
| **DNS Lookup** | Enter a hostname → see resolved IPs and response time |
| **Port Scanner** | Enter a host → scans 22 common ports async → color-coded open/closed |
| **Connectivity** | One click → checks 3 external targets (8.8.8.8, 1.1.1.1, google.com) |

### Alerts Panel
- Filter tabs: All / Active / Resolved
- Each alert card shows: severity badge, alert type, message, value vs. threshold, timestamps
- "Resolve" button for manual resolution
- Threshold config panel at the bottom

### Analytics
- Period selector: 1h → 30d
- Summary cards: avg CPU, max CPU, avg memory, max memory, total DB records
- Trend chart: CPU + memory overlay (dual area), disk + network (dual Y-axis line)
- Benchmark score history bar charts (one per type)

### Reports
- **Generate Report** → fetches a point-in-time snapshot
- **Download JSON** → saves `edgebench-report-YYYY-MM-DD.json` to your downloads
- **Open HTML Report** → opens a formatted dark-themed printable page in a new tab
- Four tabs in the UI: Overview, Alerts, Benchmarks, Raw JSON

---

## ⚡ Benchmarks Explained

### CPU Benchmark

| Test | What it measures |
|------|-----------------|
| **Sieve of Eratosthenes** | Integer computation speed — finds all primes up to 500,000 |
| **Matrix Multiplication** | Floating-point throughput — multiplies two 150×150 matrices |
| **Fibonacci Stress** | Raw iteration speed — runs Fibonacci for exactly 1 second |

Score formula (higher = faster):
```
score = (primes_per_sec / 1000) + (matrix_ops_per_sec / 100000) + (fib_iters_per_sec / 10000)
```

### Memory Benchmark

| Test | What it measures |
|------|-----------------|
| **Allocation** | Speed of allocating 64 MB of memory |
| **Sequential Write** | Throughput of writing 4 KB blocks across 64 MB |
| **Sequential Read** | Throughput of reading 4 KB blocks across 64 MB |
| **Random Access** | Latency of 100,000 random byte reads |

Score = average of sequential write MB/s and sequential read MB/s.

### Disk Benchmark

| Test | What it measures |
|------|-----------------|
| **Sequential Write** | Write a 32 MB file in 64 KB blocks with fsync |
| **Sequential Read** | Read the 32 MB file back in 64 KB blocks |
| **Random Read** | 1,000 random seek + read operations |

Score = average of sequential write MB/s and sequential read MB/s. Temp file is created and deleted automatically.

---

## 🚨 Alert Thresholds

Alerts are checked automatically on every metric collection cycle.

| Resource | High Threshold | Critical Threshold |
|----------|---------------|-------------------|
| CPU Usage | 85% | 95% |
| Memory Usage | 80% | 90% |
| Disk Usage | 80% | 90% |
| Swap Usage | 70% | 85% |

**How it works:**
1. If a resource exceeds the **High** threshold → alert is created with `high` or `critical` severity
2. If the resource drops back below the threshold → alert is **automatically resolved**
3. You can also manually resolve any alert from the UI

Alerts are deduplicated — only one open alert exists per resource type at a time.

---

## 🧰 Skills Demonstrated

This project was built to demonstrate the following engineering skills:

| Category | Skills |
|----------|--------|
| **Linux Administration** | System metrics, process management, filesystem operations, network analysis |
| **Backend Development** | FastAPI, SQLAlchemy ORM, async Python, WebSockets, REST API design |
| **Frontend Development** | React 18, React Router, component architecture, real-time data polling |
| **Data Visualisation** | Recharts, time-series charts, area/bar/line charts, dual Y-axis |
| **Database** | SQLite, SQLAlchemy models, background write operations |
| **Performance Testing** | Benchmarking methodology, pure-Python implementations, scoring |
| **Docker & Containers** | Docker SDK, container monitoring, Docker Compose multi-service |
| **Networking** | TCP port scanning, DNS resolution, ICMP ping, async socket programming |
| **Infrastructure Monitoring** | Metric collection pipelines, threshold alerting, historical analytics |
| **Documentation** | API design, technical writing, architecture diagrams |

---

## ❓ Troubleshooting

### Backend won't start

```
ModuleNotFoundError: No module named 'psutil'
```
→ Make sure you activated your virtual environment: `source venv/bin/activate`

```
Address already in use: 8000
```
→ Change port: `uvicorn app.main:app --port 8001` and update `REACT_APP_API_URL`

---

### Frontend shows "Cannot connect to EdgeBench API"

1. Confirm the backend is running: `curl http://localhost:8000/health` should return `{"status":"healthy"}`
2. If running manually, confirm `REACT_APP_API_URL=http://localhost:8000` (no trailing slash)
3. Check browser console for CORS errors

---

### Docker monitoring shows "Docker Unavailable"

- The Docker socket must be mounted: add `-v /var/run/docker.sock:/var/run/docker.sock` when running the container, or use the included `docker-compose.yml`
- On Linux you may need: `sudo chmod 666 /var/run/docker.sock`
- On macOS with Docker Desktop, the socket is available by default

---

### Benchmarks are very slow

- The disk benchmark writes/reads a 32 MB file — on slow SD cards or network-mounted drives this can take 30+ seconds
- The CPU benchmark scales with your CPU — on a single-core or low-frequency CPU it may take 10+ seconds

---

### Metrics show 0 or wrong values

- Run the backend directly on the host (not in a container) for the most accurate host metrics
- CPU temperature requires hardware sensors — `None` is normal on VMs or many cloud instances
- Network I/O rates are 0 for the first collection cycle (they measure the delta from the previous reading)

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

Built with ⚡ by a platform/infrastructure engineer, for platform/infrastructure engineers.

**[⬆ Back to Top](#-edgebench)**

</div>
