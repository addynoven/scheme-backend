import time
from app.core.config import settings

# Sliding window rate limiter: {client_id: [timestamp_float, ...]}
_RATE_LIMIT_STORE: dict[str, list[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30


def check_rate_limit(client_id: str) -> bool:
    """Sliding-window rate limiter per client identifier."""
    if getattr(settings, "TESTING", False):
        return True

    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    timestamps = _RATE_LIMIT_STORE.get(client_id, [])
    # Filter out expired timestamps
    valid_timestamps = [ts for ts in timestamps if ts > window_start]

    if len(valid_timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        _RATE_LIMIT_STORE[client_id] = valid_timestamps
        return False

    valid_timestamps.append(now)
    _RATE_LIMIT_STORE[client_id] = valid_timestamps
    return True
