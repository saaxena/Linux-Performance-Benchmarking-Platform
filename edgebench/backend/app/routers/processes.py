from fastapi import APIRouter, Query
from typing import List, Optional
import psutil

router = APIRouter()


def _proc_info(p: psutil.Process) -> dict:
    try:
        with p.oneshot():
            mem_info = p.memory_info()
            return {
                "pid": p.pid,
                "name": p.name(),
                "cpu_percent": round(p.cpu_percent(), 2),
                "memory_percent": round(p.memory_percent(), 2),
                "memory_mb": round(mem_info.rss / (1024 * 1024), 2),
                "status": p.status(),
                "username": p.username() if hasattr(p, "username") else "unknown",
                "num_threads": p.num_threads(),
                "create_time": p.create_time(),
            }
    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        return None


@router.get("/")
async def list_processes(
    limit: int = Query(50, le=200),
    sort_by: str = Query("cpu", regex="^(cpu|memory|pid|name)$"),
):
    """List all running processes sorted by resource usage."""
    # Warm up CPU measurements
    for p in psutil.process_iter():
        try:
            p.cpu_percent()
        except Exception:
            pass

    import time
    time.sleep(0.3)

    procs = []
    for p in psutil.process_iter():
        info = _proc_info(p)
        if info:
            procs.append(info)

    key_map = {
        "cpu": lambda x: x["cpu_percent"],
        "memory": lambda x: x["memory_percent"],
        "pid": lambda x: x["pid"],
        "name": lambda x: x["name"].lower(),
    }
    procs.sort(key=key_map.get(sort_by, key_map["cpu"]), reverse=(sort_by not in ("pid", "name")))
    return procs[:limit]


@router.get("/top-cpu")
async def top_cpu_processes(limit: int = Query(10, le=50)):
    """Return top CPU-consuming processes."""
    for p in psutil.process_iter():
        try:
            p.cpu_percent()
        except Exception:
            pass
    import time; time.sleep(0.3)

    procs = []
    for p in psutil.process_iter():
        info = _proc_info(p)
        if info:
            procs.append(info)

    procs.sort(key=lambda x: x["cpu_percent"], reverse=True)
    return procs[:limit]


@router.get("/top-memory")
async def top_memory_processes(limit: int = Query(10, le=50)):
    """Return top memory-consuming processes."""
    procs = []
    for p in psutil.process_iter():
        info = _proc_info(p)
        if info:
            procs.append(info)
    procs.sort(key=lambda x: x["memory_percent"], reverse=True)
    return procs[:limit]


@router.get("/zombies")
async def zombie_processes():
    """Return zombie processes."""
    zombies = []
    for p in psutil.process_iter():
        try:
            if p.status() == psutil.STATUS_ZOMBIE:
                zombies.append({"pid": p.pid, "name": p.name(), "status": "zombie"})
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return zombies


@router.get("/search")
async def search_processes(name: str = Query(..., min_length=1)):
    """Search processes by name."""
    results = []
    for p in psutil.process_iter():
        try:
            if name.lower() in p.name().lower():
                info = _proc_info(p)
                if info:
                    results.append(info)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return results
