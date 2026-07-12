import base64
import logging
from decimal import Decimal
from typing import Any, Dict, Optional

import httpx
from fastapi import Depends

from ..config import get_settings

logger = logging.getLogger(__name__)

PAYMONGO_BASE_URL = "https://api.paymongo.com/v1"

PAYMONGO_REFUND_REASONS = {"duplicate", "fraudulent", "requested_by_customer"}
DEFAULT_REFUND_REASON = "requested_by_customer"


class PayMongoNotConfigured(Exception):
    """Raised when the PayMongo secret key is empty / missing."""


class PayMongoAPIError(Exception):
    """Raised when PayMongo returns a non-2xx response."""

    def __init__(self, status_code: int, message: str, payload: Any = None):
        self.status_code = status_code
        self.message = message
        self.payload = payload
        super().__init__(f"PayMongo API error {status_code}: {message}")


class PayMongoClient:
    """Thin httpx wrapper around the PayMongo REST API.

    Reads credentials from environment variables via config.
    """

    def __init__(self):
        settings = get_settings()
        self.secret_key = settings.PAYMONGO_SECRET_KEY
        self.webhook_secret = settings.PAYMONGO_WEBHOOK_SECRET
        self.timeout = 15.0

    @property
    def is_configured(self) -> bool:
        return bool(self.secret_key)

    def _auth_header(self) -> Dict[str, str]:
        token = base64.b64encode(f"{self.secret_key}:".encode()).decode("ascii")
        return {
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _request(self, method: str, path: str, json: Optional[dict] = None) -> dict:
        if not self.is_configured:
            raise PayMongoNotConfigured("paymongo_secret_key is not configured")

        url = f"{PAYMONGO_BASE_URL}{path}"
        with httpx.Client(headers=self._auth_header(), timeout=self.timeout) as client:
            try:
                response = client.request(method, url, json=json)
            except httpx.HTTPError as exc:
                logger.warning("PayMongo network error: %s", exc)
                raise PayMongoAPIError(0, f"Network error talking to PayMongo: {exc}") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"raw": response.text}

        if response.status_code >= 400:
            err = (payload.get("errors") or [{}])[0]
            detail = err.get("detail") or err.get("title") or response.text or "Unknown error"
            raise PayMongoAPIError(response.status_code, detail, payload)

        return payload

    def create_refund(
        self,
        payment_id: str,
        amount_php: Decimal,
        reason: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> dict:
        """Issue a refund against an existing PayMongo payment.

        Amount is converted from PHP (decimal) to centavos (int) per PayMongo convention.
        `reason` is one of PayMongo's enumerated values; `notes` is free-text.
        """
        if not payment_id:
            raise ValueError("payment_id is required")

        paymongo_reason = reason if reason in PAYMONGO_REFUND_REASONS else DEFAULT_REFUND_REASON

        body: Dict[str, Any] = {
            "data": {
                "attributes": {
                    "amount": int((Decimal(amount_php) * 100).to_integral_value()),
                    "payment_id": payment_id,
                    "reason": paymongo_reason,
                }
            }
        }
        if notes:
            body["data"]["attributes"]["notes"] = notes[:255]  # PayMongo field limit

        response = self._request("POST", "/refunds", json=body)
        return response.get("data", {})

    def retrieve_refund(self, refund_id: str) -> dict:
        response = self._request("GET", f"/refunds/{refund_id}")
        return response.get("data", {})

    def retrieve_payment(self, payment_id: str) -> dict:
        response = self._request("GET", f"/payments/{payment_id}")
        return response.get("data", {})


def get_paymongo_client() -> PayMongoClient:
    """FastAPI dependency factory. Reads settings from environment."""
    return PayMongoClient()
