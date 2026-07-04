from flask import request, jsonify
from app.blueprints.admin import admin_bp
from app.middleware.internal_auth import internal_api_required
from app.models.property import Property
from app.models.host import Host, HostProfile, HostKycDocument
from app.extensions import db
from app.utils.response import success_response, error_response
import requests
import os

CLIENT_API_URL = os.getenv("CLIENT_API_URL", "http://localhost:5000")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "tirana-internal-secret-key")

@admin_bp.route("/stats", methods=["GET"])
@internal_api_required
def get_stats():
    total_hosts = Host.query.count()
    total_properties = Property.query.count()
    
    # Try to get stats from client backend
    try:
        response = requests.get(
            f"{CLIENT_API_URL}/api/stats/summary",
            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            timeout=5
        )
        client_stats = response.json().get("data", {}) if response.status_code == 200 else {}
    except Exception:
        client_stats = {}

    return success_response(data={
        "total_hosts": total_hosts,
        "total_properties": total_properties,
        "total_bookings": client_stats.get("total_bookings", 0),
        "total_revenue": client_stats.get("total_revenue", 0)
    })

@admin_bp.route("/rooms", methods=["GET"])
@internal_api_required
def get_rooms():
    status = request.args.get("status")
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 50))
    
    query = Property.query
    if status:
        query = query.filter_by(status=status)
    
    properties = query.offset(skip).limit(limit).all()
    # Simplified room data for admin
    rooms_data = [{
        "id": p.id,
        "name": p.title,
        "host_id": p.host_id,
        "host_name": p.host.profile.full_name if p.host and p.host.profile else None,
        "host_email": p.host.email if p.host else None,
        "price_per_night": float(p.base_price),
        "status": p.status,
        "photo_url": p.images[0].image_url if p.images else None,
        "location": f"{p.location.city}, {p.location.province}" if p.location else None,
        "description": p.description,
        "property_type": p.property_type,
        "max_guests": p.max_guests,
        "bedrooms": p.bedrooms,
        "beds": p.beds,
        "bathrooms": float(p.bathrooms) if p.bathrooms else None,
        "created_at": p.created_at.isoformat() if p.created_at else None
    } for p in properties]
    
    return success_response(data={"rooms": rooms_data})

@admin_bp.route("/rooms/<int:room_id>/approve", methods=["POST"])
@internal_api_required
def approve_room(room_id):
    prop = Property.query.get_or_404(room_id)
    prop.status = "active"
    db.session.commit()
    return success_response(message="Room approved successfully")

@admin_bp.route("/rooms/<int:room_id>/reject", methods=["POST"])
@internal_api_required
def reject_room(room_id):
    prop = Property.query.get_or_404(room_id)
    prop.status = "rejected"
    db.session.commit()
    return success_response(message="Room rejected")

@admin_bp.route("/bookings", methods=["GET"])
@internal_api_required
def get_bookings():
    # Get all property IDs to pass to client backend
    try:
        properties = Property.query.with_entities(Property.id).all()
        property_ids = ",".join(str(p.id) for p in properties)
    except Exception:
        property_ids = ""

    params = request.args.copy()
    if property_ids:
        params.setdefault("property_ids", property_ids)

    try:
        response = requests.get(
            f"{CLIENT_API_URL}/api/host/property-bookings",
            params=params,
            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            timeout=5
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return error_response(str(e), status=500)

@admin_bp.route("/reviews", methods=["GET"])
@internal_api_required
def get_reviews():
    # Get all property IDs to pass to client backend
    try:
        properties = Property.query.with_entities(Property.id).all()
        property_ids = ",".join(str(p.id) for p in properties)
    except Exception:
        property_ids = ""

    params = request.args.copy()
    if property_ids:
        params.setdefault("property_ids", property_ids)

    # Proxy to client backend
    try:
        response = requests.get(
            f"{CLIENT_API_URL}/api/host/property-reviews",
            params=params,
            headers={"X-Internal-API-Key": INTERNAL_API_KEY},
            timeout=5
        )
        return jsonify(response.json()), response.status_code
    except Exception as e:
        return error_response(str(e), status=500)

# ─── Verifications ─────────────────────────────────────────────

@admin_bp.route("/verifications", methods=["GET"])
@internal_api_required
def get_verifications():
    status = request.args.get("status", "")
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 50))

    query = Host.query

    if status:
        query = query.filter_by(status=status)
    else:
        # Default: show hosts awaiting verification and those who submitted KYC
        query = query.filter(Host.status.in_(["awaiting_verification", "pending"]))

    hosts = query.order_by(Host.created_at.desc()).offset(skip).limit(limit).all()

    verifications = []
    for h in hosts:
        name = h.profile.full_name if h.profile else None
        phone = h.profile.phone if h.profile else None

        # Get KYC documents
        kyc_docs = HostKycDocument.query.filter_by(host_id=h.id).all()
        id_url = None
        selfie_url = None
        kyc_status = "pending"
        for doc in kyc_docs:
            if doc.document_type == "id_card" or doc.document_type == "passport" or doc.document_type == "drivers_license":
                id_url = doc.document_url
                kyc_status = doc.status
            elif doc.document_type == "selfie_with_id":
                selfie_url = doc.document_url

        verifications.append({
            "id": h.id,
            "name": name,
            "email": h.email,
            "type": "host",
            "status": h.status if h.status != "awaiting_verification" else "pending",
            "phone": phone,
            "id_url": id_url,
            "selfie_url": selfie_url,
            "created_at": h.created_at.isoformat() if h.created_at else None
        })

    return success_response(data={"verifications": verifications})

@admin_bp.route("/verifications/<int:verification_id>", methods=["GET"])
@internal_api_required
def get_verification(verification_id):
    host = Host.query.get_or_404(verification_id)
    
    name = host.profile.full_name if host.profile else None
    phone = host.profile.phone if host.profile else None

    kyc_docs = HostKycDocument.query.filter_by(host_id=host.id).all()
    id_url = None
    selfie_url = None
    kyc_status = "pending"
    for doc in kyc_docs:
        if doc.document_type in ("id_card", "passport", "drivers_license"):
            id_url = doc.document_url
            kyc_status = doc.status
        elif doc.document_type == "selfie_with_id":
            selfie_url = doc.document_url

    verification = {
        "id": host.id,
        "name": name,
        "email": host.email,
        "type": "host",
        "status": host.status if host.status != "awaiting_verification" else "pending",
        "phone": phone,
        "id_url": id_url,
        "selfie_url": selfie_url,
        "kyc_documents": [
            {
                "id": doc.id,
                "document_type": doc.document_type,
                "document_url": doc.document_url,
                "status": doc.status,
                "review_notes": doc.review_notes,
                "submitted_at": doc.submitted_at.isoformat() if doc.submitted_at else None
            }
            for doc in kyc_docs
        ],
        "created_at": host.created_at.isoformat() if host.created_at else None
    }

    return success_response(data={"verification": verification})

@admin_bp.route("/verifications/<int:verification_id>/approve", methods=["POST"])
@internal_api_required
def approve_verification(verification_id):
    host = Host.query.get_or_404(verification_id)
    host.status = "active"
    host.email_verified = 1
    db.session.commit()
    return success_response(message="Verification approved")

@admin_bp.route("/verifications/<int:verification_id>/reject", methods=["POST"])
@internal_api_required
def reject_verification(verification_id):
    host = Host.query.get_or_404(verification_id)
    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "Verification rejected by admin")
    host.status = "inactive"
    db.session.commit()

    # Update KYC documents
    HostKycDocument.query.filter_by(host_id=host.id, status="pending").update(
        {"status": "rejected", "review_notes": reason}
    )
    db.session.commit()
    return success_response(message="Verification rejected")


# ─── Hosts / Users ─────────────────────────────────────────────

@admin_bp.route("/hosts", methods=["GET"])
@internal_api_required
def list_hosts():
    skip = int(request.args.get("skip", 0))
    limit = int(request.args.get("limit", 50))
    search = request.args.get("search", "")

    query = Host.query
    if search:
        query = query.join(HostProfile, isouter=True).filter(
            db.or_(
                Host.email.ilike(f"%{search}%"),
                HostProfile.full_name.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    hosts = query.order_by(Host.created_at.desc()).offset(skip).limit(limit).all()

    hosts_data = []
    for h in hosts:
        hosts_data.append({
            "id": h.id,
            "username": h.profile.full_name if h.profile else h.email,
            "email": h.email,
            "status": h.status,
            "is_verified": h.email_verified == 1,
            "created_at": h.created_at.isoformat() if h.created_at else None,
        })

    return success_response(data={"users": hosts_data, "total": total})


@admin_bp.route("/hosts/<int:host_id>", methods=["DELETE"])
@internal_api_required
def delete_host(host_id):
    host = Host.query.get_or_404(host_id)
    db.session.delete(host)
    db.session.commit()
    return success_response(message="Host deleted successfully")
