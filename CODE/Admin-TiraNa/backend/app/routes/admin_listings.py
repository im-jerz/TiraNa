"""
Admin Listings routes.
Fetches property listings from Host API for moderation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db
from ..models import AdminAccount
from ..middleware.admin_auth import get_current_admin
from ..services.host_api_client import host_api_client

router = APIRouter(prefix="/admin/listings", tags=["Admin Listings"])


@router.get("/")
async def list_listings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query("", description="Filter by status"),
    search: Optional[str] = Query("", description="Search by title or host"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of property listings from Host API for moderation."""
    try:
        # Fetch from Host API
        rooms = await host_api_client.get_rooms(status=status, skip=skip, limit=limit)
        
        # Transform room data to match frontend expectations
        # Frontend expects: title, host_email, price_per_night, status, id, photo_url, etc.
        listings = []
        for room in rooms:
            listings.append({
                "id": room.get("id"),
                "title": room.get("name"),  # Map 'name' to 'title'
                "host_id": room.get("host_id"),
                "host_name": room.get("host_name"),
                "host_email": room.get("host_email"),
                "price_per_night": room.get("price_per_night"),
                "status": room.get("status", "pending"),
                "photo_url": room.get("photo_url"),
                "location": room.get("location"),
                "description": room.get("description"),
                "property_type": room.get("property_type"),
                "max_guests": room.get("max_guests"),
                "bedrooms": room.get("bedrooms"),
                "beds": room.get("beds"),
                "bathrooms": room.get("bathrooms"),
                "created_at": room.get("created_at"),
            })
        
        # Filter by search if provided
        if search:
            search_lower = search.lower()
            listings = [
                l for l in listings 
                if search_lower in (l.get('title', '') or '').lower() 
                or search_lower in (l.get('host_name', '') or '').lower()
                or search_lower in (l.get('host_email', '') or '').lower()
            ]
        
        return listings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
async def count_listings(
    status: Optional[str] = Query("", description="Filter by status"),
    search: Optional[str] = Query("", description="Search by title or host"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Count property listings from Host API."""
    try:
        rooms = await host_api_client.get_rooms(status=status, skip=0, limit=1000)
        
        # Apply same search filter as list endpoint
        if search:
            search_lower = search.lower()
            rooms = [
                r for r in rooms 
                if search_lower in (r.get('name', '') or '').lower() 
                or search_lower in (r.get('host_name', '') or '').lower()
                or search_lower in (r.get('host_email', '') or '').lower()
            ]
        
        return {"count": len(rooms)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{listing_id}/approve")
async def approve_listing(
    listing_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Approve a property listing via Host API."""
    try:
        success = await host_api_client.approve_room(listing_id)
        if success:
            return {"message": f"Listing {listing_id} approved successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to approve listing")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{listing_id}/reject")
async def reject_listing(
    listing_id: int,
    reason: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Reject a property listing via Host API."""
    try:
        success = await host_api_client.reject_room(listing_id, reason)
        if success:
            return {"message": f"Listing {listing_id} rejected", "reason": reason}
        else:
            raise HTTPException(status_code=400, detail="Failed to reject listing")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{listing_id}/suspend")
async def suspend_listing(
    listing_id: int,
    reason: str,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Suspend an active property listing via Host API."""
    try:
        # Host API doesn't have suspend yet, but we can use hide_room as alternative
        success = await host_api_client.hide_room(listing_id)
        if success:
            return {"message": f"Listing {listing_id} suspended", "reason": reason}
        else:
            raise HTTPException(status_code=400, detail="Failed to suspend listing")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
