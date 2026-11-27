"""Tests for the Render keep-alive pinger configuration."""
import asyncio

from app import keep_alive


def test_disabled_without_public_url(monkeypatch):
    """No URL means no pinging (local runs and tests)."""
    monkeypatch.delenv("RENDER_EXTERNAL_URL", raising=False)
    monkeypatch.delenv("KEEP_ALIVE_URL", raising=False)
    assert keep_alive.keep_alive_url() is None


def test_uses_render_url_and_can_be_switched_off(monkeypatch):
    """Render's own URL is used automatically; KEEP_ALIVE=false turns it off."""
    monkeypatch.delenv("KEEP_ALIVE_URL", raising=False)
    monkeypatch.setenv("RENDER_EXTERNAL_URL", "https://fintrack.example.com/")
    assert keep_alive.keep_alive_url() == "https://fintrack.example.com/health"
    monkeypatch.setenv("KEEP_ALIVE", "false")
    assert keep_alive.keep_alive_url() is None


def test_default_interval_is_14_and_a_half_minutes():
    """The ping runs just under Render's 15-minute idle limit."""
    assert keep_alive.DEFAULT_INTERVAL_SECONDS == 870


def test_loop_pings_and_survives_errors(monkeypatch):
    """The loop keeps going after a failed ping."""
    calls = []

    def fake_ping(url):
        calls.append(url)
        if len(calls) == 1:
            raise OSError("network down")
        return 200

    monkeypatch.setattr(keep_alive, "_ping", fake_ping)

    async def run():
        task = asyncio.create_task(keep_alive.run_keep_alive("https://x/health", 0))
        while len(calls) < 3:
            await asyncio.sleep(0.01)
        task.cancel()

    asyncio.run(run())
    assert len(calls) >= 3
