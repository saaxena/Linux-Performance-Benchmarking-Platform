from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean, JSON, Text
from sqlalchemy.sql import func
from .database import Base


class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)

    # CPU
    cpu_percent = Column(Float, default=0.0)
    cpu_load_1min = Column(Float, default=0.0)
    cpu_load_5min = Column(Float, default=0.0)
    cpu_load_15min = Column(Float, default=0.0)
    cpu_temp = Column(Float, nullable=True)
    cpu_cores = Column(Integer, default=1)
    cpu_freq_current = Column(Float, nullable=True)

    # Memory
    mem_total = Column(Float, default=0.0)
    mem_used = Column(Float, default=0.0)
    mem_available = Column(Float, default=0.0)
    mem_percent = Column(Float, default=0.0)
    swap_total = Column(Float, default=0.0)
    swap_used = Column(Float, default=0.0)
    swap_percent = Column(Float, default=0.0)

    # Disk
    disk_total = Column(Float, default=0.0)
    disk_used = Column(Float, default=0.0)
    disk_free = Column(Float, default=0.0)
    disk_percent = Column(Float, default=0.0)
    disk_read_bytes = Column(Float, default=0.0)
    disk_write_bytes = Column(Float, default=0.0)

    # Network
    net_bytes_sent = Column(Float, default=0.0)
    net_bytes_recv = Column(Float, default=0.0)
    net_packets_sent = Column(Float, default=0.0)
    net_packets_recv = Column(Float, default=0.0)
    net_connections = Column(Integer, default=0)

    # System
    uptime_seconds = Column(Float, default=0.0)
    boot_time = Column(Float, default=0.0)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    alert_type = Column(String, index=True)
    severity = Column(String)  # low, medium, high, critical
    message = Column(Text)
    value = Column(Float)
    threshold = Column(Float)
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)


class BenchmarkResult(Base):
    __tablename__ = "benchmark_results"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now(), index=True)
    benchmark_type = Column(String, index=True)
    score = Column(Float)
    details = Column(JSON)
    duration_seconds = Column(Float)


class DiagnosticResult(Base):
    __tablename__ = "diagnostic_results"

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=func.now())
    diagnostic_type = Column(String)
    target = Column(String)
    success = Column(Boolean)
    result = Column(JSON)
    duration_ms = Column(Float)
