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

    # ── Listings ───────────────────────────────────────────

    def get_listings(self, status: str = "", search: str = "", page: int = 1, per_page: int = 20) -> dict | None:
        return self._get("/api/admin/listings", params={
            "status": status, "search": search, "page": page, "per_page": per_page
        })

    def get_listing(self, listing_id: str) -> dict | None:
        return self._get(f"/api/admin/listings/{listing_id}")

    def approve_listing(self, listing_id: str) -> dict | None:
        return self._post(f"/api/admin/listings/{listing_id}/approve")

    def reject_listing(self, listing_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/listings/{listing_id}/reject", json={"reason": reason})

    def suspend_listing(self, listing_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/listings/{listing_id}/suspend", json={"reason": reason})

    # ── Bookings ───────────────────────────────────────────

    def get_bookings(self, status: str = "", page: int = 1, per_page: int = 20) -> dict | None:
        return self._get("/api/admin/bookings", params={
            "status": status, "page": page, "per_page": per_page
        })

    def get_booking(self, booking_id: str) -> dict | None:
        return self._get(f"/api/admin/bookings/{booking_id}")

    def get_booking_timeline(self, booking_id: str) -> list | None:
        return self._get(f"/api/admin/bookings/{booking_id}/timeline")

    def cancel_booking(self, booking_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/bookings/{booking_id}/cancel", json={"reason": reason})

    # ── Payments ───────────────────────────────────────────

    def get_payments(self, booking_id: str = "", page: int = 1, per_page: int = 20) -> dict | None:
        params: dict = {"page": page, "per_page": per_page}
        if booking_id:
            params["booking_id"] = booking_id
        return self._get("/api/admin/payments", params=params)

    def get_payment(self, payment_id: str) -> dict | None:
        return self._get(f"/api/admin/payments/{payment_id}")

    def process_refund(self, payment_id: str, amount: float = 0, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/payments/{payment_id}/refund", json={
            "amount": amount, "reason": reason
        })

    # ── Reviews ────────────────────────────────────────────

    def get_reviews(self, listing_id: str = "", page: int = 1, per_page: int = 20) -> dict | None:
        params: dict = {"page": page, "per_page": per_page}
        if listing_id:
            params["listing_id"] = listing_id
        return self._get("/api/admin/reviews", params=params)

    def get_review(self, review_id: str) -> dict | None:
        return self._get(f"/api/admin/reviews/{review_id}")

    def hide_review(self, review_id: str) -> dict | None:
        return self._get(f"/api/admin/reviews/{review_id}/hide")

    def show_review(self, review_id: str) -> dict | None:
        return self._get(f"/api/admin/reviews/{review_id}/show")

    # ── Withdrawals ────────────────────────────────────────

    def get_withdrawals(self, page: int = 1, per_page: int = 20) -> dict | None:
        return self._get("/api/admin/withdrawals", params={
            "page": page, "per_page": per_page
        })

    def approve_withdrawal(self, withdrawal_id: str) -> dict | None:
        return self._post(f"/api/admin/withdrawals/{withdrawal_id}/approve")

    def reject_withdrawal(self, withdrawal_id: str, reason: str = "") -> dict | None:
        return self._post(f"/api/admin/withdrawals/{withdrawal_id}/reject", json={"reason": reason})


host_api = HostAPIClient()
