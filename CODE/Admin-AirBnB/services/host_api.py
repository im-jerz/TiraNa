import logging

import requests

from config import Config

logger = logging.getLogger(__name__)


class HostAPIClient:
    def __init__(self):
        self.base_url = Config.HOST_API_URL
        self.headers = {"X-API-Key": Config.HOST_API_KEY}

    def _get(self, path: str, params: dict | None = None) -> dict | list | None:
        try:
            resp = requests.get(
                f"{self.base_url}{path}",
                headers=self.headers,
                params=params,
                timeout=5,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning("Host API unavailable (%s): %s", path, e)
            return None

    def _post(self, path: str, json: dict | None = None) -> dict | None:
        try:
            resp = requests.post(
                f"{self.base_url}{path}",
                headers=self.headers,
                json=json,
                timeout=5,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning("Host API unavailable (%s): %s", path, e)
            return None

    def _delete(self, path: str) -> dict | None:
        try:
            resp = requests.delete(
                f"{self.base_url}{path}",
                headers=self.headers,
                timeout=5,
            )
            resp.raise_for_status()
            return resp.json() if resp.content else {}
        except Exception as e:
            logger.warning("Host API unavailable (%s): %s", path, e)
            return None

    # ── Stats ──────────────────────────────────────────────

    def get_stats(self) -> dict:
        data = self._get("/api/admin/stats")
        return data if data else {
            "total_bookings": 0,
            "total_revenue": 0,
            "active_hosts": 0,
            "active_rooms": 0,
            "pending_verifications": 0,
            "reported_rooms": 0,
            "open_disputes": 0,
        }

    def get_revenue(self, period: str = "30d") -> list:
        return self._get("/api/admin/stats/revenue", params={"period": period}) or []

    def get_booking_stats(self, period: str = "30d") -> list:
        return self._get("/api/admin/stats/bookings", params={"period": period}) or []

    def is_available(self) -> bool:
        try:
            resp = requests.get(f"{self.base_url}/api/admin/stats", headers=self.headers, timeout=3)
            return resp.status_code == 200
        except Exception:
            return False

    # ── Guests ─────────────────────────────────────────────

    def get_guests(self, search: str = "", status: str = "", page: int = 1, per_page: int = 20) -> dict | None:
        return self._get("/api/admin/guests", params={
            "search": search, "status": status, "page": page, "per_page": per_page
        })

    def get_guest(self, guest_id: str) -> dict | None:
        return self._get(f"/api/admin/guests/{guest_id}")

    def ban_guest(self, guest_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/guests/{guest_id}/ban", json={"reason": reason})

    def unban_guest(self, guest_id: str) -> dict | None:
        return self._post(f"/api/admin/guests/{guest_id}/unban")

    # ── Hosts ──────────────────────────────────────────────

    def get_hosts(self, search: str = "", status: str = "", page: int = 1, per_page: int = 20) -> dict | None:
        return self._get("/api/admin/hosts", params={
            "search": search, "status": status, "page": page, "per_page": per_page
        })

    def get_host(self, host_id: str) -> dict | None:
        return self._get(f"/api/admin/hosts/{host_id}")

    def delete_host(self, host_id: str) -> dict | None:
        return self._delete(f"/api/admin/hosts/{host_id}")

    def suspend_host(self, host_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/hosts/{host_id}/suspend", json={"reason": reason})

    def reactivate_host(self, host_id: str) -> dict | None:
        return self._post(f"/api/admin/hosts/{host_id}/reactivate")

    def get_host_wallet(self, host_id: str) -> dict | None:
        return self._get(f"/api/admin/hosts/{host_id}/wallet")

    # ── Verifications ──────────────────────────────────────

    def get_verifications(self, status: str = "pending", page: int = 1, per_page: int = 20) -> dict | None:
        return self._get("/api/admin/verifications", params={
            "status": status, "page": page, "per_page": per_page
        })

    def get_verification(self, verification_id: str) -> dict | None:
        return self._get(f"/api/admin/verifications/{verification_id}")

    def approve_verification(self, verification_id: str) -> dict | None:
        return self._post(f"/api/admin/verifications/{verification_id}/approve")

    def reject_verification(self, verification_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/verifications/{verification_id}/reject", json={"reason": reason})


host_api = HostAPIClient()
