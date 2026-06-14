from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import SystemMetric

router = APIRouter()

# Shared collector instance injected at startup
_collector = None


def set_collector(c):
    global _collector
    _collector = c


@router.get("/current")
async def get_current_metrics():
    """Return live system metrics."""
    if _collector is None:
        return {"error": "Collector not initialised"}
    return _collector.get_current_metrics()


@router.get("/collect")
async def trigger_collection():
    """Force an immediate metrics collection."""
    if _collector is None:
        return {"error": "Collector not initialised"}
    metrics = _collector.collect_metrics()
    _collector._current_metrics = metrics
    return metrics


@router.get("/history")
async def get_history(
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
):
    """Return recent stored metric snapshots."""
    rows = (
        db.query(SystemMetric)
        .order_by(SystemMetric.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "cpu_percent": r.cpu_percent,
            "mem_percent": r.mem_percent,
            "disk_percent": r.disk_percent,
            "net_bytes_recv": r.net_bytes_recv,
            "net_bytes_sent": r.net_bytes_sent,
        }
        for r in reversed(rows)
    ]


@router.get("/summary")
async def get_summary(db: Session = Depends(get_db)):
    """Return 24-hour averages and current values."""
    from sqlalchemy import func as sqlfunc
    from datetime import datetime, timedelta

    cutoff = datetime.now() - timedelta(hours=24)
    rows = db.query(SystemMetric).filter(SystemMetric.timestamp >= cutoff).all()

    if not rows:
        current = _collector.get_current_metrics() if _collector else {}
        return {"period": "24h", "samples": 0, "current": current}

    avg_cpu = sum(r.cpu_percent or 0 for r in rows) / len(rows)
    avg_mem = sum(r.mem_percent or 0 for r in rows) / len(rows)
    max_cpu = max(r.cpu_percent or 0 for r in rows)
    max_mem = max(r.mem_percent or 0 for r in rows)

    return {
        "period": "24h",
        "samples": len(rows),
        "avg_cpu_percent": round(avg_cpu, 2),
        "avg_mem_percent": round(avg_mem, 2),
        "max_cpu_percent": round(max_cpu, 2),
        "max_mem_percent": round(max_mem, 2),
    }
