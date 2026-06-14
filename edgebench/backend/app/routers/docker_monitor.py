from fastapi import APIRouter, HTTPException, Query
from ..services import docker_service

router = APIRouter()


@router.get("/status")
async def docker_status():
    """Check if Docker daemon is reachable."""
    return docker_service.get_docker_status()


@router.get("/containers")
async def list_containers(all: bool = Query(False)):
    """List running (or all) Docker containers with resource stats."""
    return docker_service.list_containers(all_containers=all)


@router.get("/containers/{container_id}/logs")
async def container_logs(container_id: str, tail: int = Query(100, le=500)):
    """Fetch recent logs from a container."""
    logs = docker_service.get_container_logs(container_id, tail=tail)
    if not logs and not docker_service.get_docker_status()["available"]:
        raise HTTPException(status_code=503, detail="Docker not available")
    return {"container_id": container_id, "lines": logs}


@router.get("/containers/{container_id}/stats")
async def container_stats(container_id: str):
    """Get raw stats for a container."""
    stats = docker_service.get_container_stats(container_id)
    if "error" in stats:
        raise HTTPException(status_code=404, detail=stats["error"])
    return stats
