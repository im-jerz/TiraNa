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
    hidden: Optional[str] = Query("", description="Filter by visibility: 'true' for hidden, 'false' for visible"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Get list of reviews from Client API for moderation."""
    try:
        reviews = await client_api_client.get_reviews(skip=skip, limit=limit, hidden=hidden, search=search)
        return {"data": reviews, "total": len(reviews)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
async def count_reviews(
    search: Optional[str] = Query("", description="Search by reviewer or comment"),
    hidden: Optional[str] = Query("", description="Filter by visibility"),
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Count reviews from Client API."""
    try:
        reviews = await client_api_client.get_reviews(skip=0, limit=1000, hidden=hidden, search=search)
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
        success = await client_api_client.toggle_review_visibility(review_id)
        if success:
            return {"message": f"Review {review_id} visibility toggled"}
        else:
            raise HTTPException(status_code=404, detail="Review not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{review_id}/show")
async def show_review(
    review_id: int,
    current_admin: AdminAccount = Depends(get_current_admin)
):
    """Show a hidden review via Client API."""
    try:
        success = await client_api_client.toggle_review_visibility(review_id)
        if success:
            return {"message": f"Review {review_id} visibility toggled"}
        else:
            raise HTTPException(status_code=404, detail="Review not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
