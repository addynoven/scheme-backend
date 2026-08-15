import time
import os
import sys
from pathlib import Path
from multiprocessing import Pool, cpu_count

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app.database import SessionLocal
from app.modules.eligibility.bitmask_engine import bitmask_engine

# Pre-defined citizen profiles for testing
PROFILES = [
    {"state": "Madhya Pradesh", "gender": "male", "occupation": "farmer", "age": 44, "annual_income": 90000, "caste_category": "OBC"},
    {"state": "Madhya Pradesh", "gender": "female", "occupation": "student", "age": 20, "annual_income": 120000, "caste_category": "OBC"},
    {"state": "Maharashtra", "gender": "female", "occupation": "artisan", "age": 32, "annual_income": 150000, "caste_category": "General"},
    {"state": "Uttar Pradesh", "gender": "male", "occupation": "unemployed", "age": 28, "annual_income": 60000, "caste_category": "SC"},
    {"state": "Tamil Nadu", "gender": "male", "occupation": "senior", "age": 68, "annual_income": 50000, "caste_category": "General"},
]

def evaluate_batch(batch_size: int) -> int:
    """Evaluates a batch of citizen queries in pure RAM."""
    total_matches = 0
    num_profiles = len(PROFILES)
    for i in range(batch_size):
        p = PROFILES[i % num_profiles]
        matches = bitmask_engine.evaluate(p)
        total_matches += len(matches)
    return total_matches

def run_multicore_benchmark(total_queries: int = 100_000, workers: int | None = None):
    cores = workers or cpu_count()
    print("=" * 70)
    print(f"🔥 SCHEME NAVIGATOR: MULTI-CORE BITMASK ENGINE BENCHMARK")
    print(f"• Active CPU Cores / Worker Processes: {cores}")
    print(f"• Total Citizen Evaluations:          {total_queries:,}")
    print("=" * 70)

    # Warm-up main process
    db = SessionLocal()
    try:
        bitmask_engine.warm_up(db)
        schemes_count = len(bitmask_engine.scheme_ids)
    finally:
        db.close()
    print(f"✓ Master Process Warmed Up: {schemes_count} schemes pre-compiled in RAM.\n")

    chunk_size = total_queries // cores
    batches = [chunk_size] * cores
    remainder = total_queries % cores
    if remainder:
        batches[-1] += remainder

    print(f"Spawning {cores} isolated worker processes (1 per CPU core)...")
    t0 = time.perf_counter()
    with Pool(processes=cores) as pool:
        results = pool.map(evaluate_batch, batches)
    total_time = time.perf_counter() - t0

    qps = total_queries / total_time
    latency_us = (total_time * 1_000_000) / total_queries

    print("\n" + "=" * 70)
    print(f"🚀 MULTI-CORE BENCHMARK COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    print(f"• Total Processed Queries:   {total_queries:,}")
    print(f"• Total Execution Time:      {total_time:.3f} seconds ({total_time * 1000:.1f} ms)")
    print(f"• Combined Multi-Core QPS:   {qps:,.0f} queries/second")
    print(f"• Average Latency per Query: {latency_us:.2f} microseconds (µs)")
    print(f"• Total Matches Evaluated:   {sum(results):,}")
    print("=" * 70)

if __name__ == "__main__":
    cores = int(os.environ.get("NUM_CORES", cpu_count()))
    run_multicore_benchmark(total_queries=100_000, workers=cores)
