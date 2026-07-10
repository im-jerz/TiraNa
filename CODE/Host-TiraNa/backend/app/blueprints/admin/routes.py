"""
Admin proxy blueprint for Host-TiraNa.

Exposes read/manage endpoints the Admin-TiraNa dashboard consumes via its
Host API client. These endpoints are intentionally public (no host JWT) so
the internal Admin backend can aggregate data — they live on the isolated
tirana-network and are not exposed to the public internet.

Data ownership note:
  * Host DB has HOSTS, HOST_PROFILES, PROPERTIES, HOST_KYC_DOCUMENTS,
    PAYOUT_ACCOUNTS, OTP_VERIFICATIONS. Bookings / payments / reviews live
    on the Client (CockroachDB) backend, so those endpoints here return
    empty results.
"""

from flask import Blueprint, request, current_app
from sqlalchemy import func

from app.extensions import db
from app.models.host import (
    Host,
    HostProfile,
    HostKycDocument,
    PayoutAccount,
    OtpVerification,
)
from app.models.property import Property, PropertyImage, PropertyLocation
from app.utils.response import success_response, error_response


admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ─── Serializers ───────────────────────────────────────────────

def _iso(dt):
    return dt.isoformat() if dt else None


def _profile_map():
    profiles = HostProfile.query.all()
    return {p.host_id: p for p in profiles}


def serialize_host_user(host, profile=None):
    return {
        "id": host.id,
        "username": host.email,
        "email": host.email,
        "status": (host.status or "active").strip(),
        "is_verified": bool(host.email_verified),
        "created_at": _iso(host.created_at),
        "full_name": profile.full_name if profile else None,
        "phone": profile.phone if profile else None,
    }


def serialize_room(prop, host=None, profile=None, cover_url=None, location=None):
    return {
        "id": prop.id,
        "name": prop.title,
        "host_name": profile.full_name if profile else (host.email if host else None),
        "host_email": host.email if host else None,
        "price_per_night": float(prop.base_price) if prop.base_price is not None else None,
        "status": prop.status,
        "photo_url": cover_url,
        "location": (f"{location.city}, {location.province}" if location else None),
        "description": prop.description,
        "property_type": prop.property_type,
        "max_guests": prop.max_guests,
        "bedrooms": prop.bedrooms,
        "beds": prop.beds,
        "bathrooms": float(prop.bathrooms) if prop.bathrooms is not None else None,
    }


def serialize_host_verification(host, docs, profile=None):
    id_doc = next((d for d in docs if d.document_type != "selfie_with_id"), None)
    selfie_doc = next((d for d in docs if d.document_type == "selfie_with_id"), None)
    if any(d.status == "rejected" for d in docs):
        vstatus = "rejected"
    elif any(d.status == "pending" for d in docs):
        vstatus = "pending"
    else:
        vstatus = "approved"
    return {
        "id": str(host.id) if host else str(docs[0].host_id),
        "name": profile.full_name if profile else (host.email if host else None),
        "email": host.email if host else None,
        "type": "host",
        "status": vstatus,
        "phone": profile.phone if profile else None,
        "id_url": id_doc.document_url if id_doc else None,
        "id_back_url": None,
        "selfie_url": selfie_doc.document_url if selfie_doc else None,
        "created_at": _iso(min((d.submitted_at for d in docs if d.submitted_at), default=None)),
    }


def serialize_withdrawal(pa, host=None, profile=None):
    return {
        "id": pa.id,
        "host_name": profile.full_name if profile else (host.email if host else None),
        "host_email": host.email if host else None,
        "amount": 0,
        "method": pa.account_type,
        "status": "verified" if pa.is_verified else "pending",
        "created_at": _iso(pa.created_at),
        "account_name": pa.account_name,
        "account_number": pa.account_number,
        "bank_name": pa.bank_name,
    }


# ─── Hosts ─────────────────────────────────────────────────────

@admin_bp.get("/hosts")
def list_hosts():
    try:
        skip = int(request.args.get("skip", 0))
        limit = min(int(request.args.get("limit", 50)), 200)
        search = (request.args.get("search") or "").strip()
    except ValueError:
        return error_response("Invalid pagination parameters.", status=400)

    query = Host.query
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Host.email.ilike(like), Host.status.ilike(like))
        )
    total = query.count()
    hosts = query.order_by(Host.created_at.desc()).offset(skip).limit(limit).all()
    profiles = _profile_map()
    users = [serialize_host_user(h, profiles.get(h.id)) for h in hosts]
    return success_response(data={"users": users, "total": total})


@admin_bp.get("/hosts/<int:external_id>")
def get_host(external_id):
    host = Host.query.get(external_id)
    if not host:
        return error_response("Host not found.", status=404)
    profile = HostProfile.query.filter_by(host_id=host.id).first()
    return success_response(data={"host": serialize_host_user(host, profile)})


@admin_bp.get("/hosts/<int:external_id>/wallet")
def get_host_wallet(external_id):
    host = Host.query.get(external_id)
    if not host:
        return error_response("Host not found.", status=404)
    accounts = PayoutAccount.query.filter_by(host_id=host.id).all()
    wallet = [
        {
            "id": a.id,
            "account_type": a.account_type,
            "account_name": a.account_name,
            "account_number": a.account_number,
            "bank_name": a.bank_name,
            "is_verified": bool(a.is_verified),
            "is_default": bool(a.is_default),
            "created_at": _iso(a.created_at),
        }
        for a in accounts
    ]
    return success_response(data={"wallet": wallet})


@admin_bp.delete("/hosts/<int:host_id>")
def delete_host(host_id):
    host = Host.query.get(host_id)
    if not host:
        return error_response("Host not found.", status=404)
    try:
        db.session.delete(host)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Delete host failed: %s", e)
        return error_response("Could not delete host.", status=500)
    return success_response(message="Host deleted successfully.")


# ─── Rooms / Properties ────────────────────────────────────────

@admin_bp.get("/rooms")
def list_rooms():
    try:
        skip = int(request.args.get("skip", 0))
        limit = min(int(request.args.get("limit", 50)), 200)
        status = request.args.get("status")
    except ValueError:
        return error_response("Invalid pagination parameters.", status=400)

    query = Property.query
    if status:
        query = query.filter(Property.status == status)
    total = query.count()
    props = query.order_by(Property.created_at.desc()).offset(skip).limit(limit).all()
    profiles = _profile_map()
    rooms = []
    for p in props:
        host = Host.query.get(p.host_id)
        cover = PropertyImage.query.filter_by(property_id=p.id, is_cover=1).first()
        if not cover:
            cover = PropertyImage.query.filter_by(property_id=p.id).first()
        location = PropertyLocation.query.filter_by(property_id=p.id).first()
        rooms.append(
            serialize_room(
                p,
                host=host,
                profile=profiles.get(p.host_id),
                cover_url=cover.image_url if cover else None,
                location=location,
            )
        )
    return success_response(data={"rooms": rooms, "total": total})


@admin_bp.get("/rooms/<int:room_id>")
def get_room(room_id):
    p = Property.query.get(room_id)
    if not p:
        return error_response("Room not found.", status=404)
    host = Host.query.get(p.host_id)
    cover = PropertyImage.query.filter_by(property_id=p.id, is_cover=1).first()
    if not cover:
        cover = PropertyImage.query.filter_by(property_id=p.id).first()
    location = PropertyLocation.query.filter_by(property_id=p.id).first()
    return success_response(
        data={
            "room": serialize_room(
                p,
                host=host,
                profile=_profile_map().get(p.host_id),
                cover_url=cover.image_url if cover else None,
                location=location,
            )
        }
    )


@admin_bp.post("/rooms/<int:room_id>/hide")
def hide_room(room_id):
    return _set_room_status(room_id, "inactive")


@admin_bp.post("/rooms/<int:room_id>/show")
def show_room(room_id):
    return _set_room_status(room_id, "active")


@admin_bp.post("/rooms/<int:room_id>/approve")
def approve_room(room_id):
    return _set_room_status(room_id, "active")


@admin_bp.post("/rooms/<int:room_id>/reject")
def reject_room(room_id):
    return _set_room_status(room_id, "suspended")


def _set_room_status(room_id, status):
    p = Property.query.get(room_id)
    if not p:
        return error_response("Room not found.", status=404)
    p.status = status
    db.session.commit()
    return success_response(message=f"Room {status}.", data={"status": status})


# ─── Verifications (Host KYC) ──────────────────────────────────

@admin_bp.get("/verifications")
def list_verifications():
    try:
        skip = int(request.args.get("skip", 0))
        limit = min(int(request.args.get("limit", 50)), 200)
        status = (request.args.get("status") or "").strip()
    except ValueError:
        return error_response("Invalid pagination parameters.", status=400)

    docs = HostKycDocument.query.all()
    profiles = _profile_map()

    by_host = {}
    for d in docs:
        by_host.setdefault(d.host_id, []).append(d)

    verifications = []
    for host_id, host_docs in by_host.items():
        host = Host.query.get(host_id)
        verifications.append(serialize_host_verification(host, host_docs, profiles.get(host_id)))

    if status:
        verifications = [v for v in verifications if v["status"] == status]

    total = len(verifications)
    verifications.sort(key=lambda v: v.get("created_at") or "", reverse=True)
    verifications = verifications[skip:skip + limit]
    return success_response(data={"verifications": verifications, "total": total})


@admin_bp.get("/verifications/<int:verification_id>")
def get_verification(verification_id):
    docs = HostKycDocument.query.filter_by(host_id=verification_id).all()
    if not docs:
        return error_response("Verification not found.", status=404)
    host = Host.query.get(verification_id)
    return success_response(
        data={"verification": serialize_host_verification(host, docs, _profile_map().get(verification_id))}
    )


@admin_bp.post("/verifications/<int:verification_id>/approve")
def approve_verification(verification_id):
    return _set_verification_status(verification_id, "approved")


@admin_bp.post("/verifications/<int:verification_id>/reject")
def reject_verification(verification_id):
    return _set_verification_status(verification_id, "rejected")


def _set_verification_status(verification_id, status):
    docs = HostKycDocument.query.filter_by(host_id=verification_id).all()
    if not docs:
        return error_response("Verification not found.", status=404)
    for d in docs:
        d.status = status
    if status == "approved":
        host = Host.query.get(verification_id)
        if host:
            host.status = "active"
    db.session.commit()
    return success_response(message=f"Verification {status}.", data={"status": status})


# ─── Withdrawals (Host payout accounts) ───────────────────────

@admin_bp.get("/withdrawals")
def list_withdrawals():
    try:
        skip = int(request.args.get("skip", 0))
        limit = min(int(request.args.get("limit", 50)), 200)
        status = request.args.get("status")
    except ValueError:
        return error_response("Invalid pagination parameters.", status=400)

    query = PayoutAccount.query
    accounts = query.order_by(PayoutAccount.created_at.desc()).offset(skip).limit(limit).all()
    profiles = _profile_map()
    withdrawals = []
    for a in accounts:
        host = Host.query.get(a.host_id)
        w = serialize_withdrawal(a, host=host, profile=profiles.get(a.host_id))
        if status and w["status"] != status:
            continue
        withdrawals.append(w)
    return success_response(data={"withdrawals": withdrawals, "total": len(withdrawals)})


@admin_bp.post("/withdrawals/<int:withdrawal_id>/approve")
def approve_withdrawal(withdrawal_id):
    a = PayoutAccount.query.get(withdrawal_id)
    if not a:
        return error_response("Withdrawal not found.", status=404)
    a.is_verified = 1
    db.session.commit()
    return success_response(message="Withdrawal approved.", data={"status": "verified"})


@admin_bp.post("/withdrawals/<int:withdrawal_id>/reject")
def reject_withdrawal(withdrawal_id):
    a = PayoutAccount.query.get(withdrawal_id)
    if not a:
        return error_response("Withdrawal not found.", status=404)
    a.is_verified = 0
    db.session.commit()
    return success_response(message="Withdrawal rejected.", data={"status": "pending"})


# ─── Stats ─────────────────────────────────────────────────────

@admin_bp.get("/stats")
def host_stats():
    total_hosts = Host.query.count()
    total_properties = Property.query.count()
    active_listings = Property.query.filter(Property.status == "active").count()
    return success_response(
        data={
            "total_hosts": total_hosts,
            "total_properties": total_properties,
            "active_listings": active_listings,
            "total_bookings": 0,
            "total_revenue": 0,
        }
    )


@admin_bp.get("/stats/revenue")
def host_revenue_stats():
    return success_response(data={"revenue": [], "total": 0})


@admin_bp.get("/stats/bookings")
def host_booking_stats():
    return success_response(data={"bookings": [], "total": 0})


# ─── Sections owned by the Client backend (empty stubs) ────────

@admin_bp.get("/bookings")
def list_bookings():
    return success_response(data={"bookings": [], "total": 0})


@admin_bp.get("/bookings/<booking_id>")
def get_booking(booking_id):
    return error_response("Bookings are managed by the Client backend.", status=404)


@admin_bp.get("/bookings/<booking_id>/timeline")
def get_booking_timeline(booking_id):
    return error_response("Bookings are managed by the Client backend.", status=404)


@admin_bp.get("/payments")
def list_payments():
    return success_response(data={"payments": [], "total": 0})


@admin_bp.get("/payments/<payment_id>")
def get_payment(payment_id):
    return error_response("Payments are managed by the Client backend.", status=404)


@admin_bp.get("/reviews")
def list_reviews():
    return success_response(data={"reviews": []})


@admin_bp.post("/reviews/<review_id>/hide")
def hide_review(review_id):
    return error_response("Reviews are managed by the Client backend.", status=404)


@admin_bp.post("/reviews/<review_id>/show")
def show_review(review_id):
    return error_response("Reviews are managed by the Client backend.", status=404)


@admin_bp.get("/guests/<external_id>")
def get_guest(external_id):
    return error_response("Guests are managed by the Client backend.", status=404)
