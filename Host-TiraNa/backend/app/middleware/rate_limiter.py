"""
Login rate limiter.

Implements the "5 failed login attempts per 15 min" rule from
Section 7 (Security & Auth) of host_dashboard_design.md.

This in-process implementation is fine for development and single-
worker deployments. For production with multiple Gunicorn workers,
replace the in-memory dict with Redis (same interface, swap storage).
"""

from datetime import datetime, timedelta
from flask import current_app

_failed_attempts = {}


def record_failed_login(email: str) -> None:
    _failed_attempts.setdefault(email, []).append(datetime.utcnow())


def clear_failed_logins(email: str) -> None:
    _failed_attempts.pop(email, None)


def is_locked_out(email: str):
    """
    Returns (locked: bool, seconds_remaining: int).

    A host is locked out once they have MAX_LOGIN_ATTEMPTS failures
    within the LOGIN_LOCKOUT_MINUTES window.
    """
    max_attempts = current_app.config.get("MAX_LOGIN_ATTEMPTS", 5)
    window_minutes = current_app.config.get("LOGIN_LOCKOUT_MINUTES", 15)
    window = timedelta(minutes=window_minutes)
    now = datetime.utcnow()

    attempts = _failed_attempts.get(email, [])
    recent = [t for t in attempts if now - t < window]
    _failed_attempts[email] = recent

    if len(recent) >= max_attempts:
        oldest = min(recent)
        remaining = window - (now - oldest)
        return True, max(int(remaining.total_seconds()), 0)

    return False, 0
