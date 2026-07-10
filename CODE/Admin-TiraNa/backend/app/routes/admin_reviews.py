"""
Admin Reviews routes.
Fetches reviews from Client API for moderation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db
from ..models import AdminAccount
from ..middleware.admin_auth import get_current_admin
from ..services.client_api_client import client_api_client

router = APIRouter(prefix="/admin/reviews", tags=["Admin Reviews"])


@router.get("/")
async def list_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query("", description="Search by reviewer or comment"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of reviews from Client API for moderation."""
    try:
        reviews = await client_api_client.get_reviews(skip=skip, limit=limit)
        
        # Filter by search if provided
        if search:
            search_lower = search.lower()
            reviews = [
                r for r in reviews 
                if search_lower in (r.get('user_name', '') or '').lower() 
                or search_lower in (r.get('comment', '') or '').lower()
            ]
        
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
async def count_reviews(
    search: Optional[str] = Query("", description="Search by reviewer or comment"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Count reviews from Client API."""
    try:
        reviews = await client_api_client.get_reviews(skip=0, limit=1000)
        
        if search:
            search_lower = search.lower()
            reviews = [
                r for r in reviews 
                if search_lower in (r.get('user_name', '') or '').lower() 
                or search_lower in (r.get('comment', '') or '').lower()
            ]
        
        return {"count": len(reviews)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{review_id}/hide")
async def hide_review(
    review_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Hide a review via Client API."""
    try:
        success = await client_api_client.hide_review(review_id)
        if success:
            return {"message": f"Review {review_id} hidden successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to hide review")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{review_id}/show")
async def show_review(
    review_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Show a hidden review via Client API."""
    try:
        success = await client_api_client.show_review(review_id)
        if success:
            return {"message": f"Review {review_id} shown successfully"}
        else:
            raise HTTPException(status_code=400, detail="Failed to show review")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
