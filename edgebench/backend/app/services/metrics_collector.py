import psutil
import asyncio
import time
from datetime import datetime
from typing import Dict, Any

from ..database import SessionLocal
from ..models import SystemMetric


class MetricsCollector:
    def __init__(self, interval: int = 30):
        self.interval = interval
        self._current_metrics: Dict[str, Any] = {}
        self._last_net_io = None
        self._last_disk_io = None
        self._last_time = None

    async def start_collecting(self):
        """Background task: collect metrics every N seconds."""
        while True:
            try:
                metrics = self.collect_metrics()
                self._current_metrics = metrics
                self._save_metrics(metrics)
                # deferred import to avoid circular
                from .alert_service import AlertService
                AlertService.check_thresholds(metrics)
            except Exception as e:
                print(f"[MetricsCollector] Error: {e}")
            await asyncio.sleep(self.interval)

    def collect_metrics(self) -> Dict[str, Any]:
        now = time.time()

        # ── CPU ──────────────────────────────────────────────
        cpu_percent = psutil.cpu_percent(interval=0.5)
        try:
            load_avg = psutil.getloadavg()
        except AttributeError:
            load_avg = (0.0, 0.0, 0.0)
        cpu_count = psutil.cpu_count(logical=True) or 1

        try:
            freq = psutil.cpu_freq()
            cpu_freq = freq.current if freq else None
        except Exception:
            cpu_freq = None

        cpu_temp = None
        try:
            temps = psutil.sensors_temperatures()
            for key in ("coretemp", "cpu_thermal", "k10temp", "acpitz", "cpu-thermal"):
                if key in temps and temps[key]:
                    cpu_temp = temps[key][0].current
                    break
        except Exception:
            pass

        # ── Memory ───────────────────────────────────────────
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()

        # ── Disk ─────────────────────────────────────────────
        try:
            disk = psutil.disk_usage("/")
        except Exception:
            disk = psutil.disk_usage(".")

        disk_read_rate = 0.0
        disk_write_rate = 0.0
        try:
            disk_io = psutil.disk_io_counters()
            if disk_io and self._last_disk_io and self._last_time:
                elapsed = now - self._last_time
                if elapsed > 0:
                    disk_read_rate = (disk_io.read_bytes - self._last_disk_io.read_bytes) / elapsed
                    disk_write_rate = (disk_io.write_bytes - self._last_disk_io.write_bytes) / elapsed
            self._last_disk_io = disk_io
        except Exception:
            pass

        # ── Network ──────────────────────────────────────────
        net_sent_rate = 0.0
        net_recv_rate = 0.0
        net_pkts_sent = 0.0
        net_pkts_recv = 0.0
        try:
            net_io = psutil.net_io_counters()
            if net_io and self._last_net_io and self._last_time:
                elapsed = now - self._last_time
                if elapsed > 0:
                    net_sent_rate = (net_io.bytes_sent - self._last_net_io.bytes_sent) / elapsed
                    net_recv_rate = (net_io.bytes_recv - self._last_net_io.bytes_recv) / elapsed
                net_pkts_sent = float(net_io.packets_sent - self._last_net_io.packets_sent)
                net_pkts_recv = float(net_io.packets_recv - self._last_net_io.packets_recv)
            self._last_net_io = net_io
        except Exception:
            pass

        try:
            connections = len(psutil.net_connections())
        except Exception:
            connections = 0

        # ── System ───────────────────────────────────────────
        boot_time = psutil.boot_time()
        uptime = now - boot_time
        self._last_time = now

        return {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "percent": round(cpu_percent, 2),
                "load_1min": round(load_avg[0], 2),
                "load_5min": round(load_avg[1], 2),
                "load_15min": round(load_avg[2], 2),
                "temperature": round(cpu_temp, 1) if cpu_temp is not None else None,
                "cores": cpu_count,
                "frequency": round(cpu_freq, 1) if cpu_freq else None,
            },
            "memory": {
                "total": mem.total,
                "used": mem.used,
                "available": mem.available,
                "percent": round(mem.percent, 2),
                "swap_total": swap.total,
                "swap_used": swap.used,
                "swap_percent": round(swap.percent, 2),
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": round(disk.percent, 2),
                "read_bytes_per_sec": round(max(disk_read_rate, 0), 2),
                "write_bytes_per_sec": round(max(disk_write_rate, 0), 2),
            },
            "network": {
                "bytes_sent_per_sec": round(max(net_sent_rate, 0), 2),
                "bytes_recv_per_sec": round(max(net_recv_rate, 0), 2),
                "packets_sent": net_pkts_sent,
                "packets_recv": net_pkts_recv,
                "connections": connections,
            },
            "system": {
                "uptime_seconds": round(uptime, 0),
                "boot_time": boot_time,
            },
        }

    def get_current_metrics(self) -> Dict[str, Any]:
        if not self._current_metrics:
            self._current_metrics = self.collect_metrics()
        return self._current_metrics

    def _save_metrics(self, m: Dict[str, Any]):
        db = SessionLocal()
        try:
            row = SystemMetric(
                cpu_percent=m["cpu"]["percent"],
                cpu_load_1min=m["cpu"]["load_1min"],
                cpu_load_5min=m["cpu"]["load_5min"],
                cpu_load_15min=m["cpu"]["load_15min"],
                cpu_temp=m["cpu"]["temperature"],
                cpu_cores=m["cpu"]["cores"],
                cpu_freq_current=m["cpu"]["frequency"],
                mem_total=m["memory"]["total"],
                mem_used=m["memory"]["used"],
                mem_available=m["memory"]["available"],
                mem_percent=m["memory"]["percent"],
                swap_total=m["memory"]["swap_total"],
                swap_used=m["memory"]["swap_used"],
                swap_percent=m["memory"]["swap_percent"],
                disk_total=m["disk"]["total"],
                disk_used=m["disk"]["used"],
                disk_free=m["disk"]["free"],
                disk_percent=m["disk"]["percent"],
                disk_read_bytes=m["disk"]["read_bytes_per_sec"],
                disk_write_bytes=m["disk"]["write_bytes_per_sec"],
                net_bytes_sent=m["network"]["bytes_sent_per_sec"],
                net_bytes_recv=m["network"]["bytes_recv_per_sec"],
                net_packets_sent=m["network"]["packets_sent"],
                net_packets_recv=m["network"]["packets_recv"],
                net_connections=m["network"]["connections"],
                uptime_seconds=m["system"]["uptime_seconds"],
                boot_time=m["system"]["boot_time"],
            )
            db.add(row)
            db.commit()
        except Exception as e:
            print(f"[MetricsCollector] DB save error: {e}")
            db.rollback()
        finally:
            db.close()
