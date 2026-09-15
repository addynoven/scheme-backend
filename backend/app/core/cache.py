"""
Valkey / Redis caching layer.

Design principles:
- Cache-aside pattern: never crash the app if Valkey is down.
  Every helper catches connection errors and returns None (miss) silently.
- Single lazily-initialised client reused across requests.
- TTL is read from settings.CACHE_TTL_SECONDS (default 24 h).
  Override via CACHE_TTL_SECONDS= in your .env file.
- All keys are namespaced under "scheme:" to avoid collisions.

Usage:
    from app.core.cache import cache_get, cache_set, cache_delete, cache_invalidate_pattern

    # Read
    value = cache_get("scheme:list:active")          # returns str | None
    # Write
    cache_set("scheme:list:active", json_str)        # uses default TTL
    cache_set("scheme:list:active", json_str, ttl=3600)
    # Delete exact key
    cache_delete("scheme:id:42")
    # Delete by prefix (wildcard pattern)
    cache_invalidate_pattern("scheme:*")             # flush all scheme keys
"""

import logging
from typing import Optional

import valkey

from app.core.config import settings

logger = logging.getLogger("app.cache")

# ──────────────────────────────────────────────────────────────────────────────
# Client singleton
# ──────────────────────────────────────────────────────────────────────────────

_client: Optional[valkey.Valkey] = None  # type: ignore[type-arg]


def _get_client() -> Optional[valkey.Valkey]:  # type: ignore[type-arg]
    """
    Return a lazily-initialised Valkey client, or None if VALKEY_URL is not set
    or the connection cannot be established.
    """
    global _client

    if not settings.VALKEY_URL:
        return None

    if _client is not None:
        return _client

    try:
        _client = valkey.from_url(
            settings.VALKEY_URL,
            decode_responses=True,   # always return str, not bytes
            socket_connect_timeout=3,
            socket_timeout=3,
        )
        # Ping to fail fast at startup rather than silently missing cache
        _client.ping()
        logger.info("Valkey cache connected: %s", settings.VALKEY_URL.split("@")[-1])
    except Exception as exc:
        logger.warning("Valkey unavailable — caching disabled. Reason: %s", exc)
        _client = None

    return _client


def close_client() -> None:
    """Close and reset the singleton (useful in tests)."""
    global _client
    if _client is not None:
        try:
            _client.close()
        except Exception:
            pass
        _client = None


# ──────────────────────────────────────────────────────────────────────────────
# Public helpers
# ──────────────────────────────────────────────────────────────────────────────

def cache_get(key: str) -> Optional[str]:
    """
    Return the cached string value for *key*, or None on miss / error.
    """
    client = _get_client()
    if client is None:
        return None
    try:
        return client.get(key)
    except Exception as exc:
        logger.debug("cache_get error for key=%s: %s", key, exc)
        return None


def cache_set(key: str, value: str, ttl: Optional[int] = None) -> bool:
    """
    Store *value* under *key* with an expiry of *ttl* seconds.
    Falls back to settings.CACHE_TTL_SECONDS when ttl is None.
    Returns True on success, False on error / no client.
    """
    client = _get_client()
    if client is None:
        return False
    effective_ttl = ttl if ttl is not None else settings.CACHE_TTL_SECONDS
    try:
        client.setex(key, effective_ttl, value)
        return True
    except Exception as exc:
        logger.debug("cache_set error for key=%s: %s", key, exc)
        return False


def cache_delete(key: str) -> bool:
    """
    Delete a single cache key. Returns True on success.
    """
    client = _get_client()
    if client is None:
        return False
    try:
        client.delete(key)
        return True
    except Exception as exc:
        logger.debug("cache_delete error for key=%s: %s", key, exc)
        return False


def cache_invalidate_pattern(pattern: str) -> int:
    """
    Delete all keys matching the glob *pattern* (e.g. "scheme:*").
    Uses SCAN + DELETE to avoid blocking the server with KEYS.
    Returns the number of keys deleted.
    """
    client = _get_client()
    if client is None:
        return 0
    deleted = 0
    try:
        cursor: int = 0
        while True:
            cursor, keys = client.scan(cursor, match=pattern, count=200)
            if keys:
                client.delete(*keys)
                deleted += len(keys)
            if cursor == 0:
                break
    except Exception as exc:
        logger.debug("cache_invalidate_pattern error for pattern=%s: %s", pattern, exc)
    return deleted


def is_cache_available() -> bool:
    """
    Health check — returns True if the Valkey client is reachable.
    Used by the /health endpoint.
    """
    client = _get_client()
    if client is None:
        return False
    try:
        return client.ping()
    except Exception:
        return False
