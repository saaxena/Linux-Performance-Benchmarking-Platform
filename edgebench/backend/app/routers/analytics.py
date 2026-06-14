from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from ..database import get_db
from ..models import SystemMetric, BenchmarkResult

router = APIRouter()


def _bucket_rows(rows, bucket_minutes=5):
    """Group rows into time buckets and average them."""
    if not rows:
        return []
    buckets: dict = {}
    for r in rows:
        if r.timestamp is None:
            continue
        bucket_key = r.timestamp.replace(
            minute=(r.timestamp.minute // bucket_minutes) * bucket_minutes,
            second=0,
            microsecond=0,
        )
        if bucket_key not in buckets:
            buckets[bucket_key] = []
        buckets[bucket_key].append(r)

    result = []
    for ts in sorted(buckets):
        grp = buckets[ts]
        n = len(grp)
        result.append({
            "timestamp": ts.isoformat(),
            "cpu_percent": round(sum(r.cpu_percent or 0 for r in grp) / n, 2),
            "mem_percent": round(sum(r.mem_percent or 0 for r in grp) / n, 2),
            "disk_percent": round(sum(r.disk_percent or 0 for r in grp) / n, 2),
            "net_bytes_recv": round(sum(r.net_bytes_recv or 0 for r in grp) / n, 2),
            "net_bytes_sent": round(sum(r.net_bytes_sent or 0 for r in grp) / n, 2),
        })
    return result


@router.get("/trends")
async def get_trends(
    period: str = Query("1h", regex="^(1h|6h|24h|7d|30d)$"),
    db: Session = Depends(get_db),
):
    """Return bucketed metric trends for charts."""
    period_map = {
        "1h": (timedelta(hours=1), 2),
        "6h": (timedelta(hours=6), 10),
        "24h": (timedelta(hours=24), 30),
        "7d": (timedelta(days=7), 120),
        "30d": (timedelta(days=30), 720),
    }
    delta, bucket_min = period_map[period]
    cutoff = datetime.now() - delta

    rows = (
        db.query(SystemMetric)
        .filter(SystemMetric.timestamp >= cutoff)
        .order_by(SystemMetric.timestamp)
        .all()
    )
    return {"period": period, "data": _bucket_rows(rows, bucket_min)}


@router.get("/cpu-trend")
async def cpu_trend(
    hours: int = Query(24, le=168),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now() - timedelta(hours=hours)
    rows = (
        db.query(SystemMetric)
        .filter(SystemMetric.timestamp >= cutoff)
        .order_by(SystemMetric.timestamp)
        .all()
    )
    return [
        {"timestamp": r.timestamp.isoformat() if r.timestamp else None, "value": r.cpu_percent}
        for r in rows
    ]


@router.get("/memory-trend")
async def memory_trend(
    hours: int = Query(24, le=168),
    db: Session = Depends(get_db),
):
    cutoff = datetime.now() - timedelta(hours=hours)
    rows = (
        db.query(SystemMetric)
        .filter(SystemMetric.timestamp >= cutoff)
        .order_by(SystemMetric.timestamp)
        .all()
    )
    return [
        {"timestamp": r.timestamp.isoformat() if r.timestamp else None, "value": r.mem_percent}
        for r in rows
    ]


@router.get("/benchmark-history")
async def benchmark_history(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(BenchmarkResult)
        .order_by(BenchmarkResult.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "benchmark_type": r.benchmark_type,
            "score": r.score,
        }
        for r in reversed(rows)
    ]


@router.get("/summary")
async def analytics_summary(db: Session = Depends(get_db)):
    """Overall stats summary."""
    total_records = db.query(SystemMetric).count()
    oldest = db.query(SystemMetric).order_by(SystemMetric.timestamp).first()
    newest = db.query(SystemMetric).order_by(SystemMetric.timestamp.desc()).first()
    bench_count = db.query(BenchmarkResult).count()

    return {
        "total_metric_records": total_records,
        "first_record": oldest.timestamp.isoformat() if oldest and oldest.timestamp else None,
        "last_record": newest.timestamp.isoformat() if newest and newest.timestamp else None,
        "total_benchmarks": bench_count,
    }
