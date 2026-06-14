from typing import List, Dict, Any

_docker_available = False
_client = None


def _get_client():
    global _docker_available, _client
    if _client is not None:
        return _client
    try:
        import docker
        _client = docker.from_env()
        _client.ping()
        _docker_available = True
    except Exception:
        _client = None
        _docker_available = False
    return _client


def get_docker_status() -> Dict[str, Any]:
    client = _get_client()
    return {"available": client is not None, "docker_available": _docker_available}


def list_containers(all_containers: bool = False) -> List[Dict[str, Any]]:
    client = _get_client()
    if not client:
        return []
    try:
        containers = client.containers.list(all=all_containers)
        result = []
        for c in containers:
            try:
                stats = c.stats(stream=False)
                cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - stats["precpu_stats"]["cpu_usage"]["total_usage"]
                system_delta = stats["cpu_stats"]["system_cpu_usage"] - stats["precpu_stats"]["system_cpu_usage"]
                num_cpus = stats["cpu_stats"].get("online_cpus", 1)
                cpu_pct = (cpu_delta / system_delta) * num_cpus * 100.0 if system_delta > 0 else 0.0

                mem_used = stats["memory_stats"].get("usage", 0)
                mem_limit = stats["memory_stats"].get("limit", 1)
                mem_pct = (mem_used / mem_limit) * 100.0 if mem_limit > 0 else 0.0
            except Exception:
                cpu_pct = 0.0
                mem_used = 0
                mem_limit = 0
                mem_pct = 0.0

            result.append({
                "id": c.short_id,
                "full_id": c.id,
                "name": c.name,
                "image": c.image.tags[0] if c.image.tags else c.image.short_id,
                "status": c.status,
                "created": c.attrs.get("Created", ""),
                "cpu_percent": round(cpu_pct, 2),
                "memory_used_mb": round(mem_used / (1024 * 1024), 2),
                "memory_limit_mb": round(mem_limit / (1024 * 1024), 2),
                "memory_percent": round(mem_pct, 2),
                "restart_count": c.attrs.get("RestartCount", 0),
                "health": c.attrs.get("State", {}).get("Health", {}).get("Status", "none"),
                "ports": c.attrs.get("NetworkSettings", {}).get("Ports", {}),
            })
        return result
    except Exception as e:
        print(f"[DockerService] list_containers error: {e}")
        return []


def get_container_logs(container_id: str, tail: int = 100) -> List[str]:
    client = _get_client()
    if not client:
        return ["Docker not available"]
    try:
        container = client.containers.get(container_id)
        logs = container.logs(tail=tail, timestamps=True).decode("utf-8", errors="replace")
        return logs.splitlines()
    except Exception as e:
        return [f"Error fetching logs: {e}"]


def get_container_stats(container_id: str) -> Dict[str, Any]:
    client = _get_client()
    if not client:
        return {}
    try:
        container = client.containers.get(container_id)
        return container.stats(stream=False)
    except Exception as e:
        return {"error": str(e)}
