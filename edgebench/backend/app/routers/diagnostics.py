import asyncio
import socket
import time
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class PingRequest(BaseModel):
    target: str
    count: int = 4
    timeout: int = 5


class DnsRequest(BaseModel):
    hostname: str


class PortScanRequest(BaseModel):
    target: str
    ports: List[int] = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3000, 3306, 5432, 6379, 8000, 8080, 8443, 27017]
    timeout: float = 1.0


class TracerouteRequest(BaseModel):
    target: str
    max_hops: int = 15
    timeout: int = 3


# ─── Ping ─────────────────────────────────────────────────────────────────────

@router.post("/ping")
async def ping(req: PingRequest):
    t0 = time.perf_counter()
    try:
        proc = await asyncio.create_subprocess_exec(
            "ping", "-c", str(req.count), "-W", str(req.timeout), req.target,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=req.timeout * req.count + 5)
        elapsed = time.perf_counter() - t0
        output = stdout.decode(errors="replace")
        success = proc.returncode == 0
        return {
            "target": req.target,
            "success": success,
            "output": output,
            "return_code": proc.returncode,
            "duration_seconds": round(elapsed, 3),
        }
    except asyncio.TimeoutError:
        return {"target": req.target, "success": False, "output": "Timeout", "duration_seconds": req.timeout * req.count}
    except FileNotFoundError:
        # ping not available
        return _python_ping(req.target, req.count, req.timeout)


def _python_ping(target: str, count: int, timeout: int) -> dict:
    """Fallback ping using raw TCP to port 80."""
    results = []
    for _ in range(count):
        t0 = time.perf_counter()
        try:
            sock = socket.create_connection((target, 80), timeout=timeout)
            sock.close()
            rtt = (time.perf_counter() - t0) * 1000
            results.append(rtt)
        except Exception:
            results.append(None)

    successful = [r for r in results if r is not None]
    return {
        "target": target,
        "success": len(successful) > 0,
        "method": "tcp_echo",
        "packets_sent": count,
        "packets_received": len(successful),
        "packet_loss_percent": round((1 - len(successful) / count) * 100, 1),
        "avg_rtt_ms": round(sum(successful) / len(successful), 2) if successful else None,
        "output": f"{len(successful)}/{count} packets received",
    }


# ─── DNS ──────────────────────────────────────────────────────────────────────

@router.post("/dns")
async def dns_lookup(req: DnsRequest):
    t0 = time.perf_counter()
    try:
        loop = asyncio.get_event_loop()
        info = await loop.run_in_executor(None, socket.getaddrinfo, req.hostname, None)
        addresses = list({item[4][0] for item in info})
        elapsed = time.perf_counter() - t0
        return {
            "hostname": req.hostname,
            "success": True,
            "addresses": addresses,
            "duration_ms": round(elapsed * 1000, 2),
        }
    except socket.gaierror as e:
        elapsed = time.perf_counter() - t0
        return {
            "hostname": req.hostname,
            "success": False,
            "error": str(e),
            "duration_ms": round(elapsed * 1000, 2),
        }


# ─── Port Scan ────────────────────────────────────────────────────────────────

@router.post("/port-scan")
async def port_scan(req: PortScanRequest):
    t0 = time.perf_counter()

    async def check_port(port: int):
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(req.target, port), timeout=req.timeout
            )
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            return {"port": port, "status": "open"}
        except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
            return {"port": port, "status": "closed"}

    results = await asyncio.gather(*[check_port(p) for p in req.ports])
    elapsed = time.perf_counter() - t0

    open_ports = [r for r in results if r["status"] == "open"]
    return {
        "target": req.target,
        "ports_scanned": len(req.ports),
        "open_ports": open_ports,
        "all_results": list(results),
        "duration_seconds": round(elapsed, 3),
    }


# ─── Connectivity check ───────────────────────────────────────────────────────

@router.get("/connectivity")
async def connectivity_check():
    """Quick multi-target connectivity test."""
    targets = [
        ("8.8.8.8", 53),
        ("1.1.1.1", 53),
        ("google.com", 80),
    ]
    results = []
    for host, port in targets:
        t0 = time.perf_counter()
        try:
            sock = socket.create_connection((host, port), timeout=3)
            sock.close()
            rtt = (time.perf_counter() - t0) * 1000
            results.append({"host": host, "port": port, "status": "reachable", "rtt_ms": round(rtt, 2)})
        except Exception as e:
            results.append({"host": host, "port": port, "status": "unreachable", "error": str(e)})

    return {"results": results, "internet_available": any(r["status"] == "reachable" for r in results)}
