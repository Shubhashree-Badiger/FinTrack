"""Keep-alive pinger for Render's free plan.

Render puts a free web service to sleep after 15 minutes without incoming traffic. This task
calls the service's own public /health URL every 14.5 minutes (870 seconds), which counts as
traffic and keeps the service awake. It only runs when a public URL is known:
RENDER_EXTERNAL_URL (set by Render automatically) or KEEP_ALIVE_URL (set by you).
"""
import asyncio
import logging
import os
import urllib.request

log = logging.getLogger("fintrack.keep_alive")

DEFAULT_INTERVAL_SECONDS = 870  # 14.5 minutes, just under Render's 15-minute idle limit


def keep_alive_url() -> str | None:
    """Return the /health URL to ping, or None when keep-alive is disabled."""
    if os.getenv("KEEP_ALIVE", "true").lower() == "false":
        return None
    base = os.getenv("KEEP_ALIVE_URL") or os.getenv("RENDER_EXTERNAL_URL")
    return f"{base.rstrip('/')}/health" if base else None


def _ping(url: str) -> int:
    """Send one GET request and return the HTTP status code."""
    with urllib.request.urlopen(url, timeout=30) as response:  # noqa: S310 (fixed https URL)
        return response.status


async def run_keep_alive(url: str, interval: int) -> None:
    """Ping `url` forever, every `interval` seconds. Errors are logged and never stop the loop."""
    log.info("Keep-alive enabled: pinging %s every %s seconds", url, interval)
    while True:
        await asyncio.sleep(interval)
        try:
            status = await asyncio.to_thread(_ping, url)
            log.info("Keep-alive ping: HTTP %s", status)
        except Exception as exc:  # network hiccups must not crash the app
            log.warning("Keep-alive ping failed: %s", exc)


def start_keep_alive() -> asyncio.Task | None:
    """Start the background ping task if a public URL is configured."""
    url = keep_alive_url()
    if not url:
        return None
    interval = int(os.getenv("KEEP_ALIVE_SECONDS", str(DEFAULT_INTERVAL_SECONDS)))
    return asyncio.create_task(run_keep_alive(url, interval))
