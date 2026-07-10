"""
HTTP client for calling Host-TiraNa API endpoints.
Used by Admin dashboard to fetch rooms, bookings, reviews, etc.
Includes retry logic for resilience against weak/offline scenarios.
"""

import httpx
import asyncio
import logging
from typing import Optional, Dict, Any, List
from ..config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class HostAPIClient:
    """Client for calling Host-TiraNa admin proxy endpoints."""

    def __init__(self):
        self.base_url = settings.HOST_API_BASE_URL.rstrip("/")
        self.timeout = 8.0
        self.max_retries = 2
        self.headers = {
            "Content-Type": "application/json",
        }

    async def _request(self, method: str, endpoint: str, params: Optional[Dict] = None, data: Optional[Dict] = None) -> Optional[Dict]:
        """Make HTTP request with retry logic."""
        url = f"{self.base_url}{endpoint}"
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    if method == "GET":
                        response = await client.get(url, params=params, headers=self.headers)
                    elif method == "POST":
                        response = await client.post(url, json=data, headers=self.headers)
                    elif method == "DELETE":
                        response = await client.delete(url, headers=self.headers)
                    else:
                        return None

                    response.raise_for_status()
                    return response.json()

            except httpx.ConnectError as e:
                last_error = e
                if attempt < self.max_retries:
                    wait = 0.5 * (attempt + 1)
                    logger.warning(f"Host API connect error (attempt {attempt + 1}/{self.max_retries + 1}): {endpoint} - retrying in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    logger.warning(f"Host API unavailable after {self.max_retries + 1} attempts: {endpoint}")

            except httpx.TimeoutException as e:
                last_error = e
                if attempt < self.max_retries:
                    wait = 0.5 * (attempt + 1)
                    logger.warning(f"Host API timeout (attempt {attempt + 1}/{self.max_retries + 1}): {endpoint} - retrying in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    logger.warning(f"Host API timeout after {self.max_retries + 1} attempts: {endpoint}")

            except httpx.HTTPStatusError as e:
                logger.error(f"Host API HTTP {e.response.status_code}: {endpoint}")
                return None

            except Exception as e:
                logger.error(f"Host API error: {endpoint} - {str(e)}")
                return None

        return None

    async def _get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        return await self._request("GET", endpoint, params=params)

    async def _post(self, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        return await self._request("POST", endpoint, data=data)

    async def _delete(self, endpoint: str) -> Optional[Dict]:
        return await self._request("DELETE", endpoint)

    def _unwrap(self, result: Optional[Dict]) -> Optional[Dict]:
        """Unwrap Host API response from success/data envelope."""
        if result and isinstance(result, dict) and "data" in result:
            return result["data"]
        return result

    # ─── Stats ─────────────────────────────────────────────────

    async def get_stats(self) -> Dict[str, Any]:
        result = await self._get("/api/admin/stats")
        data = self._unwrap(result)
        return data or {"total_hosts": 0, "total_properties": 0, "total_bookings": 0, "total_revenue": 0}

    async def get_revenue_stats(self, period: str = "monthly") -> Dict[str, Any]:
        result = await self._get("/api/admin/stats/revenue", {"period": period})
        data = self._unwrap(result)
        return data or {"revenue": [], "total": 0}

    async def get_booking_stats(self, period: str = "monthly") -> Dict[str, Any]:
        result = await self._get("/api/admin/stats/bookings", {"period": period})
        data = self._unwrap(result)
        return data or {"bookings": [], "total": 0}

    # ─── Rooms ─────────────────────────────────────────────────

    async def get_rooms(self, status: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/rooms", params)
        data = self._unwrap(result)
        return data.get("rooms", []) if data else []

    async def get_room(self, room_id: int) -> Optional[Dict]:
        result = await self._get(f"/api/admin/rooms/{room_id}")
        data = self._unwrap(result)
        return data.get("room") if data else None

    async def hide_room(self, room_id: int) -> bool:
        result = await self._post(f"/api/admin/rooms/{room_id}/hide")
        return result is not None

    async def show_room(self, room_id: int) -> bool:
        result = await self._post(f"/api/admin/rooms/{room_id}/show")
        return result is not None

    async def approve_room(self, room_id: int) -> bool:
        result = await self._post(f"/api/admin/rooms/{room_id}/approve")
        return result is not None

    async def reject_room(self, room_id: int, reason: str = "") -> bool:
        result = await self._post(f"/api/admin/rooms/{room_id}/reject", {"reason": reason})
        return result is not None

    # ─── Bookings ──────────────────────────────────────────────

    async def get_bookings(self, status: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/bookings", params)
        data = self._unwrap(result)
        return data.get("bookings", []) if data else []

    async def get_booking(self, booking_id: int) -> Optional[Dict]:
        result = await self._get(f"/api/admin/bookings/{booking_id}")
        data = self._unwrap(result)
        return data.get("booking") if data else None

    async def get_booking_timeline(self, booking_id: int) -> List[Dict]:
        result = await self._get(f"/api/admin/bookings/{booking_id}/timeline")
        data = self._unwrap(result)
        return data.get("timeline", []) if data else []

    # ─── Payments ──────────────────────────────────────────────

    async def get_payments(self, status: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/payments", params)
        data = self._unwrap(result)
        return data.get("payments", []) if data else []

    async def get_payment(self, payment_id: int) -> Optional[Dict]:
        result = await self._get(f"/api/admin/payments/{payment_id}")
        data = self._unwrap(result)
        return data.get("payment") if data else None

    # ─── Reviews ───────────────────────────────────────────────

    async def get_reviews(self, skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        result = await self._get("/api/admin/reviews", params)
        data = self._unwrap(result)
        return data.get("reviews", []) if data else []

    async def hide_review(self, review_id: int) -> bool:
        result = await self._post(f"/api/admin/reviews/{review_id}/hide")
        return result is not None

    async def show_review(self, review_id: int) -> bool:
        result = await self._post(f"/api/admin/reviews/{review_id}/show")
        return result is not None

    # ─── Withdrawals ───────────────────────────────────────────

    async def get_withdrawals(self, skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        result = await self._get("/api/admin/withdrawals", params)
        data = self._unwrap(result)
        return data.get("withdrawals", []) if data else []

    async def approve_withdrawal(self, withdrawal_id: int) -> bool:
        result = await self._post(f"/api/admin/withdrawals/{withdrawal_id}/approve")
        return result is not None

    async def reject_withdrawal(self, withdrawal_id: int) -> bool:
        result = await self._post(f"/api/admin/withdrawals/{withdrawal_id}/reject")
        return result is not None

    # ─── Verifications ─────────────────────────────────────────

    async def get_verifications(self, status: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/verifications", params)
        data = self._unwrap(result)
        return data.get("verifications", []) if data else []

    async def approve_verification(self, verification_id: int) -> bool:
        result = await self._post(f"/api/admin/verifications/{verification_id}/approve")
        return result is not None

    async def reject_verification(self, verification_id: int, reason: str = "") -> bool:
        result = await self._post(f"/api/admin/verifications/{verification_id}/reject", {"reason": reason})
        return result is not None

    # ─── Hosts & Guests ────────────────────────────────────────

    async def get_host(self, external_id: int) -> Optional[Dict]:
        result = await self._get(f"/api/admin/hosts/{external_id}")
        data = self._unwrap(result)
        return data.get("host") if data else None

    async def get_host_wallet(self, external_id: int) -> Optional[Dict]:
        result = await self._get(f"/api/admin/hosts/{external_id}/wallet")
        data = self._unwrap(result)
        return data.get("wallet") if data else None

    async def get_guest(self, external_id: int) -> Optional[Dict]:
        result = await self._get(f"/api/admin/guests/{external_id}")
        data = self._unwrap(result)
        return data.get("guest") if data else None

    async def get_hosts(self, search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if search:
            params["search"] = search
        result = await self._get("/api/admin/hosts", params)
        data = self._unwrap(result)
        return data if data else {"users": [], "total": 0}

    async def delete_host(self, host_id: int) -> bool:
        result = await self._delete(f"/api/admin/hosts/{host_id}")
        return result is not None


# Singleton instance
host_api_client = HostAPIClient()


async def get_host_api_client():
    return host_api_client
