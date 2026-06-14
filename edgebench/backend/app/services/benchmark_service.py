import time
import math
import os
import random
import tempfile
from typing import Dict, Any
from datetime import datetime

from ..database import SessionLocal
from ..models import BenchmarkResult


# ─── CPU Benchmarks ───────────────────────────────────────────────────────────

def _sieve_of_eratosthenes(limit: int) -> int:
    """Return count of primes up to limit."""
    sieve = bytearray([1]) * (limit + 1)
    sieve[0] = sieve[1] = 0
    for i in range(2, int(math.sqrt(limit)) + 1):
        if sieve[i]:
            sieve[i * i :: i] = bytearray(len(sieve[i * i :: i]))
    return sum(sieve)


def _matrix_multiply(size: int = 150) -> float:
    """Multiply two NxN matrices, return seconds taken."""
    a = [[random.random() for _ in range(size)] for _ in range(size)]
    b = [[random.random() for _ in range(size)] for _ in range(size)]
    t0 = time.perf_counter()
    _ = [
        [sum(a[i][k] * b[k][j] for k in range(size)) for j in range(size)]
        for i in range(size)
    ]
    return time.perf_counter() - t0


def run_cpu_benchmark() -> Dict[str, Any]:
    details = {}

    # Prime sieve
    t0 = time.perf_counter()
    prime_count = _sieve_of_eratosthenes(500_000)
    sieve_time = time.perf_counter() - t0
    details["prime_sieve"] = {
        "primes_found": prime_count,
        "time_seconds": round(sieve_time, 4),
        "primes_per_second": round(prime_count / sieve_time),
    }

    # Matrix multiply
    mat_time = _matrix_multiply(150)
    details["matrix_multiply"] = {
        "matrix_size": "150x150",
        "time_seconds": round(mat_time, 4),
        "operations": 150 ** 3,
        "ops_per_second": round((150 ** 3) / mat_time),
    }

    # Fibonacci (stress)
    t0 = time.perf_counter()
    count = 0
    a, b = 0, 1
    while time.perf_counter() - t0 < 1.0:
        a, b = b, a + b
        count += 1
    fib_time = time.perf_counter() - t0
    details["fibonacci"] = {
        "iterations": count,
        "time_seconds": round(fib_time, 4),
        "iterations_per_second": round(count / fib_time),
    }

    total_time = sieve_time + mat_time + fib_time
    # Score: higher = faster; normalise to ~1000
    score = round(
        (details["prime_sieve"]["primes_per_second"] / 1000)
        + (details["matrix_multiply"]["ops_per_second"] / 100_000)
        + (details["fibonacci"]["iterations_per_second"] / 10_000),
        2,
    )

    return {"score": score, "details": details, "duration": total_time}


# ─── Memory Benchmarks ────────────────────────────────────────────────────────

def run_memory_benchmark() -> Dict[str, Any]:
    details = {}
    mb = 64  # allocate 64 MB

    # Allocation
    t0 = time.perf_counter()
    buf = bytearray(mb * 1024 * 1024)
    alloc_time = time.perf_counter() - t0
    details["allocation"] = {
        "size_mb": mb,
        "time_seconds": round(alloc_time, 4),
        "mb_per_second": round(mb / alloc_time, 2),
    }

    # Sequential write
    t0 = time.perf_counter()
    for i in range(0, len(buf), 4096):
        buf[i : i + 4096] = bytes(4096)
    write_time = time.perf_counter() - t0
    details["sequential_write"] = {
        "size_mb": mb,
        "time_seconds": round(write_time, 4),
        "mb_per_second": round(mb / write_time, 2),
    }

    # Sequential read
    t0 = time.perf_counter()
    total_sum = 0
    for i in range(0, len(buf), 4096):
        total_sum += sum(buf[i : i + 4096])
    read_time = time.perf_counter() - t0
    details["sequential_read"] = {
        "size_mb": mb,
        "time_seconds": round(read_time, 4),
        "mb_per_second": round(mb / read_time, 2),
    }

    # Random access
    indices = [random.randint(0, len(buf) - 1) for _ in range(100_000)]
    t0 = time.perf_counter()
    for idx in indices:
        _ = buf[idx]
    rand_time = time.perf_counter() - t0
    details["random_access"] = {
        "accesses": 100_000,
        "time_seconds": round(rand_time, 4),
        "accesses_per_second": round(100_000 / rand_time),
    }

    del buf

    total_time = alloc_time + write_time + read_time + rand_time
    score = round(
        (details["sequential_write"]["mb_per_second"] + details["sequential_read"]["mb_per_second"]) / 2, 2
    )

    return {"score": score, "details": details, "duration": total_time}


# ─── Disk Benchmarks ──────────────────────────────────────────────────────────

def run_disk_benchmark() -> Dict[str, Any]:
    details = {}
    file_size_mb = 32
    block_size = 65536  # 64 KB
    data_block = os.urandom(block_size)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".edgebench") as f:
        tmp_path = f.name

    try:
        # Sequential Write
        t0 = time.perf_counter()
        with open(tmp_path, "wb") as f:
            for _ in range((file_size_mb * 1024 * 1024) // block_size):
                f.write(data_block)
            f.flush()
            os.fsync(f.fileno())
        write_time = time.perf_counter() - t0
        details["sequential_write"] = {
            "size_mb": file_size_mb,
            "time_seconds": round(write_time, 4),
            "mb_per_second": round(file_size_mb / write_time, 2),
        }

        # Sequential Read
        t0 = time.perf_counter()
        with open(tmp_path, "rb") as f:
            while f.read(block_size):
                pass
        read_time = time.perf_counter() - t0
        details["sequential_read"] = {
            "size_mb": file_size_mb,
            "time_seconds": round(read_time, 4),
            "mb_per_second": round(file_size_mb / read_time, 2),
        }

        # Random Read (1000 seeks)
        file_size_bytes = os.path.getsize(tmp_path)
        t0 = time.perf_counter()
        with open(tmp_path, "rb") as f:
            for _ in range(1000):
                pos = random.randint(0, max(0, file_size_bytes - block_size))
                f.seek(pos)
                f.read(block_size)
        rand_time = time.perf_counter() - t0
        details["random_read"] = {
            "iops": round(1000 / rand_time),
            "time_seconds": round(rand_time, 4),
            "seeks": 1000,
        }
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    total_time = write_time + read_time + rand_time
    score = round(
        (details["sequential_write"]["mb_per_second"] + details["sequential_read"]["mb_per_second"]) / 2, 2
    )

    return {"score": score, "details": details, "duration": total_time}


# ─── Persistence helper ───────────────────────────────────────────────────────

def save_benchmark_result(benchmark_type: str, score: float, details: Dict, duration: float):
    db = SessionLocal()
    try:
        result = BenchmarkResult(
            benchmark_type=benchmark_type,
            score=score,
            details=details,
            duration_seconds=round(duration, 4),
        )
        db.add(result)
        db.commit()
        db.refresh(result)
        return result
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
