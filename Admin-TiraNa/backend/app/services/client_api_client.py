"""
HTTP client for calling Client-TiraNa internal API endpoints.
Includes retry logic for resilience against weak/offline scenarios.
"""

import httpx
import asyncio
import logging
from typing import Optional, Dict, Any, List
from ..config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


class ClientAPIClient:
    """Client for calling Client-TiraNa internal API endpoints."""

    def __init__(self):
        self.base_url = settings.CLIENT_API_BASE_URL.rstrip("/")
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
                    logger.warning(f"Client API connect error (attempt {attempt + 1}/{self.max_retries + 1}): {endpoint} - retrying in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    logger.warning(f"Client API unavailable after {self.max_retries + 1} attempts: {endpoint}")

            except httpx.TimeoutException as e:
                last_error = e
                if attempt < self.max_retries:
                    wait = 0.5 * (attempt + 1)
                    logger.warning(f"Client API timeout (attempt {attempt + 1}/{self.max_retries + 1}): {endpoint} - retrying in {wait}s")
                    await asyncio.sleep(wait)
                else:
                    logger.warning(f"Client API timeout after {self.max_retries + 1} attempts: {endpoint}")

            except httpx.HTTPStatusError as e:
                logger.error(f"Client API HTTP {e.response.status_code}: {endpoint}")
                return None

            except Exception as e:
                logger.error(f"Client API error: {endpoint} - {str(e)}")
                return None

        return None

    async def _get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict]:
        return await self._request("GET", endpoint, params=params)

    async def _post(self, endpoint: str, data: Optional[Dict] = None) -> Optional[Dict]:
        return await self._request("POST", endpoint, data=data)

    async def _delete(self, endpoint: str) -> Optional[Dict]:
        return await self._request("DELETE", endpoint)

    def _unwrap(self, result: Optional[Dict]) -> Optional[Dict]:
        if result and isinstance(result, dict) and "data" in result:
            return result["data"]
        return result

    # ─── Users ─────────────────────────────────────────────────

    async def get_users(self, search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if search:
            params["search"] = search
        result = await self._get("/api/admin/users", params)
        data = self._unwrap(result)
        return data.get("users", []) if data else []

    async def delete_user(self, user_id: str) -> bool:
        result = await self._request("DELETE", f"/api/admin/users/{user_id}")
        return result is not None

    # ─── Verifications ─────────────────────────────────────────

    async def get_verifications(self, status: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/verifications", params)
        data = self._unwrap(result)
        return data.get("verifications", []) if data else []

    async def approve_verification(self, verification_id: str) -> bool:
        result = await self._post(f"/api/admin/verifications/{verification_id}/approve")
        return result is not None

    async def reject_verification(self, verification_id: str, reason: str = "") -> bool:
        result = await self._post(f"/api/admin/verifications/{verification_id}/reject", {"reason": reason})
        return result is not None

    # ─── Bookings ──────────────────────────────────────────────

    async def get_bookings(self, status: str = "", search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        result = await self._get("/api/admin/bookings", params)
        return result.get("data", []) if result else []

    async def get_booking_count(self, status: str = "") -> int:
        params = {}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/bookings/count", params)
        return result.get("count", 0) if result else 0

    async def get_booking_trend(self, period: str = "monthly") -> List[Dict]:
        result = await self._get("/api/admin/bookings/trend", {"period": period})
        return result.get("data", []) if result else []

    # ─── Payments ──────────────────────────────────────────────

    async def get_payments(self, status: str = "", search: str = "", skip: int = 0, limit: int = 50) -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if status:
            params["status"] = status
        if search:
            params["search"] = search
        result = await self._get("/api/admin/payments", params)
        return result.get("data", []) if result else []

    async def get_payment_count(self, status: str = "") -> int:
        params = {}
        if status:
            params["status"] = status
        result = await self._get("/api/admin/payments/count", params)
        return result.get("count", 0) if result else 0

    async def get_revenue_stats(self) -> Dict[str, Any]:
        result = await self._get("/api/admin/payments/revenue")
        return result or {"total_revenue": 0, "total_refunded": 0}

    async def get_revenue_trend(self, period: str = "monthly") -> List[Dict]:
        result = await self._get("/api/admin/revenue/trend", {"period": period})
        return result.get("data", []) if result else []

    async def refund_payment(self, payment_id: str, amount: float, reason: str) -> bool:
        result = await self._post(f"/api/admin/payments/{payment_id}/refund", {
            "amount": amount,
            "reason": reason
        })
        return result is not None

    # ─── Reviews ───────────────────────────────────────────────

    async def get_reviews(self, skip: int = 0, limit: int = 50, hidden: str = "", search: str = "") -> List[Dict]:
        params = {"skip": skip, "limit": limit}
        if hidden:
            params["hidden"] = hidden
        if search:
            params["search"] = search
        result = await self._get("/api/admin/reviews", params)
        if result and isinstance(result, dict):
            return result.get("data", [])
        return []

    async def toggle_review_visibility(self, review_id: str) -> bool:
        result = await self._post(f"/api/admin/reviews/{review_id}/toggle-hide")
        return result is not None

    async def hide_review(self, review_id: str) -> bool:
        return await self.toggle_review_visibility(review_id)

    async def show_review(self, review_id: str) -> bool:
        return await self.toggle_review_visibility(review_id)


# Singleton instance
client_api_client = ClientAPIClient()


async def get_client_api_client():
    return client_api_client
