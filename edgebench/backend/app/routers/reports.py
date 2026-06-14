import json
import platform
import socket
from datetime import datetime, timedelta

import psutil
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SystemMetric, Alert, BenchmarkResult

router = APIRouter()


def _gather_report_data(db: Session) -> dict:
    cutoff_24h = datetime.now() - timedelta(hours=24)
    rows = db.query(SystemMetric).filter(SystemMetric.timestamp >= cutoff_24h).all()
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(20).all()
    benchmarks = db.query(BenchmarkResult).order_by(BenchmarkResult.timestamp.desc()).limit(10).all()

    avg_cpu = round(sum(r.cpu_percent or 0 for r in rows) / max(len(rows), 1), 2)
    avg_mem = round(sum(r.mem_percent or 0 for r in rows) / max(len(rows), 1), 2)
    max_cpu = round(max((r.cpu_percent or 0 for r in rows), default=0), 2)
    max_mem = round(max((r.mem_percent or 0 for r in rows), default=0), 2)

    try:
        disk = psutil.disk_usage("/")
    except Exception:
        disk = psutil.disk_usage(".")

    return {
        "generated_at": datetime.now().isoformat(),
        "system": {
            "hostname": socket.gethostname(),
            "os": platform.system(),
            "os_version": platform.version(),
            "platform": platform.platform(),
            "cpu_count": psutil.cpu_count(),
            "total_ram_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2),
            "total_disk_gb": round(disk.total / (1024 ** 3), 2),
        },
        "utilization_24h": {
            "samples": len(rows),
            "avg_cpu_percent": avg_cpu,
            "avg_mem_percent": avg_mem,
            "max_cpu_percent": max_cpu,
            "max_mem_percent": max_mem,
        },
        "alerts": [
            {
                "timestamp": a.timestamp.isoformat() if a.timestamp else None,
                "type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "resolved": a.resolved,
            }
            for a in alerts
        ],
        "benchmarks": [
            {
                "timestamp": b.timestamp.isoformat() if b.timestamp else None,
                "type": b.benchmark_type,
                "score": b.score,
                "duration_seconds": b.duration_seconds,
            }
            for b in benchmarks
        ],
    }


@router.get("/json")
async def report_json(db: Session = Depends(get_db)):
    data = _gather_report_data(db)
    return JSONResponse(content=data)


@router.get("/html", response_class=HTMLResponse)
async def report_html(db: Session = Depends(get_db)):
    d = _gather_report_data(db)
    sev_color = {"critical": "#ef4444", "high": "#f97316", "medium": "#eab308", "low": "#22c55e"}

    alerts_rows = "".join(
        f"<tr><td>{a['timestamp']}</td><td>{a['type']}</td>"
        f"<td style='color:{sev_color.get(a['severity'],\"#fff\")}'>{a['severity']}</td>"
        f"<td>{a['message']}</td><td>{'✓' if a['resolved'] else '✗'}</td></tr>"
        for a in d["alerts"]
    ) or "<tr><td colspan='5'>No alerts</td></tr>"

    bench_rows = "".join(
        f"<tr><td>{b['timestamp']}</td><td>{b['type']}</td><td>{b['score']}</td><td>{b['duration_seconds']}s</td></tr>"
        for b in d["benchmarks"]
    ) or "<tr><td colspan='4'>No benchmarks run yet</td></tr>"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>EdgeBench Report – {d['generated_at']}</title>
<style>
  body{{font-family:monospace;background:#0f172a;color:#e2e8f0;padding:2rem;margin:0}}
  h1{{color:#38bdf8;border-bottom:1px solid #334155;padding-bottom:.5rem}}
  h2{{color:#7dd3fc;margin-top:2rem}}
  table{{width:100%;border-collapse:collapse;margin-top:1rem}}
  th{{background:#1e293b;text-align:left;padding:.5rem .75rem;font-size:.85rem;color:#94a3b8}}
  td{{padding:.45rem .75rem;border-bottom:1px solid #1e293b;font-size:.85rem}}
  .card{{background:#1e293b;border-radius:.5rem;padding:1rem 1.5rem;margin:.5rem 0;display:inline-block;min-width:160px}}
  .card span{{display:block;font-size:1.5rem;font-weight:bold;color:#38bdf8}}
  .card small{{color:#94a3b8;font-size:.75rem}}
  .grid{{display:flex;flex-wrap:wrap;gap:1rem}}
</style>
</head>
<body>
<h1>🖥 EdgeBench System Report</h1>
<p>Generated: {d['generated_at']}</p>

<h2>System Information</h2>
<div class="grid">
  <div class="card"><small>Hostname</small><span>{d['system']['hostname']}</span></div>
  <div class="card"><small>OS</small><span>{d['system']['os']}</span></div>
  <div class="card"><small>CPU Cores</small><span>{d['system']['cpu_count']}</span></div>
  <div class="card"><small>Total RAM</small><span>{d['system']['total_ram_gb']} GB</span></div>
  <div class="card"><small>Total Disk</small><span>{d['system']['total_disk_gb']} GB</span></div>
</div>

<h2>24-Hour Utilization (based on {d['utilization_24h']['samples']} samples)</h2>
<div class="grid">
  <div class="card"><small>Avg CPU</small><span>{d['utilization_24h']['avg_cpu_percent']}%</span></div>
  <div class="card"><small>Max CPU</small><span>{d['utilization_24h']['max_cpu_percent']}%</span></div>
  <div class="card"><small>Avg Memory</small><span>{d['utilization_24h']['avg_mem_percent']}%</span></div>
  <div class="card"><small>Max Memory</small><span>{d['utilization_24h']['max_mem_percent']}%</span></div>
</div>

<h2>Recent Alerts</h2>
<table>
  <tr><th>Timestamp</th><th>Type</th><th>Severity</th><th>Message</th><th>Resolved</th></tr>
  {alerts_rows}
</table>

<h2>Benchmark Results</h2>
<table>
  <tr><th>Timestamp</th><th>Type</th><th>Score</th><th>Duration</th></tr>
  {bench_rows}
</table>
</body>
</html>"""
    return html
