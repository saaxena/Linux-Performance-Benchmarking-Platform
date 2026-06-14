from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class CPUMetrics(BaseModel):
    percent: float
    load_1min: float
    load_5min: float
    load_15min: float
    temperature: Optional[float]
    cores: int
    frequency: Optional[float]


class MemoryMetrics(BaseModel):
    total: float
    used: float
    available: float
    percent: float
    swap_total: float
    swap_used: float
    swap_percent: float


class DiskMetrics(BaseModel):
    total: float
    used: float
    free: float
    percent: float
    read_bytes_per_sec: float
    write_bytes_per_sec: float


class NetworkMetrics(BaseModel):
    bytes_sent_per_sec: float
    bytes_recv_per_sec: float
    packets_sent: float
    packets_recv: float
    connections: int


class SystemInfo(BaseModel):
    uptime_seconds: float
    boot_time: float


class SystemMetricsResponse(BaseModel):
    timestamp: str
    cpu: CPUMetrics
    memory: MemoryMetrics
    disk: DiskMetrics
    network: NetworkMetrics
    system: SystemInfo


class ProcessInfo(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_percent: float
    memory_mb: float
    status: str
    username: Optional[str]
    num_threads: int


class BenchmarkRequest(BaseModel):
    iterations: Optional[int] = 1


class BenchmarkResultResponse(BaseModel):
    id: int
    timestamp: datetime
    benchmark_type: str
    score: float
    details: Dict[str, Any]
    duration_seconds: float

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    timestamp: datetime
    alert_type: str
    severity: str
    message: str
    value: float
    threshold: float
    resolved: bool
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class DiagnosticRequest(BaseModel):
    target: str
    timeout: Optional[int] = 5


class PortScanRequest(BaseModel):
    target: str
    ports: Optional[List[int]] = [22, 80, 443, 3000, 5432, 6379, 8000, 8080, 8443, 27017]


class MetricHistoryResponse(BaseModel):
    id: int
    timestamp: datetime
    cpu_percent: float
    mem_percent: float
    disk_percent: float
    net_bytes_recv: float
    net_bytes_sent: float

    class Config:
        from_attributes = True
