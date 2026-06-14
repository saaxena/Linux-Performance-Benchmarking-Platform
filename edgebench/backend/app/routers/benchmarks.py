from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
import asyncio

from ..database import get_db
from ..models import BenchmarkResult
from ..services.benchmark_service import (
    run_cpu_benchmark,
    run_memory_benchmark,
    run_disk_benchmark,
    save_benchmark_result,
)

router = APIRouter()

_running: dict = {}


async def _run_in_thread(fn, benchmark_type: str):
    loop = asyncio.get_event_loop()
    try:
        _running[benchmark_type] = True
        result = await loop.run_in_executor(None, fn)
        save_benchmark_result(
            benchmark_type=benchmark_type,
            score=result["score"],
            details=result["details"],
            duration=result["duration"],
        )
        return result
    finally:
        _running[benchmark_type] = False


@router.post("/cpu")
async def benchmark_cpu():
    """Run CPU benchmark (prime sieve + matrix multiply + Fibonacci)."""
    if _running.get("cpu"):
        raise HTTPException(status_code=409, detail="CPU benchmark already running")
    result = await _run_in_thread(run_cpu_benchmark, "cpu")
    return {"benchmark_type": "cpu", **result}


@router.post("/memory")
async def benchmark_memory():
    """Run memory benchmark (alloc + sequential read/write + random access)."""
    if _running.get("memory"):
        raise HTTPException(status_code=409, detail="Memory benchmark already running")
    result = await _run_in_thread(run_memory_benchmark, "memory")
    return {"benchmark_type": "memory", **result}


@router.post("/disk")
async def benchmark_disk():
    """Run disk benchmark (sequential write/read + random read)."""
    if _running.get("disk"):
        raise HTTPException(status_code=409, detail="Disk benchmark already running")
    result = await _run_in_thread(run_disk_benchmark, "disk")
    return {"benchmark_type": "disk", **result}


@router.post("/all")
async def benchmark_all():
    """Run all benchmarks sequentially."""
    if any(_running.values()):
        raise HTTPException(status_code=409, detail="A benchmark is already running")

    loop = asyncio.get_event_loop()

    cpu = await _run_in_thread(run_cpu_benchmark, "cpu")
    mem = await _run_in_thread(run_memory_benchmark, "memory")
    disk = await _run_in_thread(run_disk_benchmark, "disk")

    return {
        "cpu": {"benchmark_type": "cpu", **cpu},
        "memory": {"benchmark_type": "memory", **mem},
        "disk": {"benchmark_type": "disk", **disk},
    }


@router.get("/history")
async def benchmark_history(
    limit: int = Query(50, le=200),
    benchmark_type: str = Query(None),
    db: Session = Depends(get_db),
):
    """Return historical benchmark results."""
    q = db.query(BenchmarkResult)
    if benchmark_type:
        q = q.filter(BenchmarkResult.benchmark_type == benchmark_type)
    rows = q.order_by(BenchmarkResult.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "benchmark_type": r.benchmark_type,
            "score": r.score,
            "details": r.details,
            "duration_seconds": r.duration_seconds,
        }
        for r in rows
    ]


@router.get("/status")
async def benchmark_status():
    return {"running": _running}
