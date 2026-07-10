"""
Admin routes — called by Admin-TiraNa backend to fetch host data.
"""

from datetime import datetime
from flask import request, current_app
from flask_mail import Message
from sqlalchemy import func
from app.blueprints.admin import admin_bp
from app.models.host import Host, HostProfile, HostKycDocument
from app.models.property import Property, PropertyLocation, PropertyImage
from app.extensions import db, mail
from app.utils.response import success_response, error_response


@admin_bp.route("/hosts", methods=["GET"])
def list_hosts():
    search = request.args.get("search", "").strip()
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 50, type=int)

    query = db.session.query(Host, HostProfile).outerjoin(
        HostProfile, Host.id == HostProfile.host_id
    )

    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Host.email.ilike(like_pattern),
                HostProfile.full_name.ilike(like_pattern),
            )
        )

    total = query.count()
    rows = query.order_by(Host.created_at.desc()).offset(skip).limit(limit).all()

    users = []
    for host, profile in rows:
        users.append({
            "id": host.id,
            "username": (profile.full_name if profile else host.email.split("@")[0]),
            "email": host.email,
            "status": host.status,
            "is_verified": bool(host.email_verified),
            "created_at": host.created_at.isoformat() if host.created_at else None,
        })

    return success_response(data={"users": users, "total": total})


@admin_bp.route("/hosts/<int:host_id>", methods=["DELETE"])
def delete_host(host_id):
    host = Host.query.get(host_id)
    if not host:
        return error_response("Host not found.", status=404)

    db.session.delete(host)
    db.session.commit()

    return success_response(message="Host deleted successfully.")


@admin_bp.route("/verifications", methods=["GET"])
def list_verifications():
    status_filter = request.args.get("status", "").strip()
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 50, type=int)

    query = db.session.query(Host, HostProfile).outerjoin(
        HostProfile, Host.id == HostProfile.host_id
    )

    if status_filter:
        query = query.filter(Host.status == status_filter)

    total = query.count()
    rows = query.order_by(Host.created_at.desc()).offset(skip).limit(limit).all()

    verifications = []
    for host, profile in rows:
        docs = HostKycDocument.query.filter_by(host_id=host.id).all()
        doc_map = {d.document_type: d for d in docs}

        verifications.append({
            "id": host.id,
            "host_id": host.id,
            "name": profile.full_name if profile else host.email.split("@")[0],
            "email": host.email,
            "type": "host",
            "status": host.status,
            "email_verified": bool(host.email_verified),
            "id_card_url": doc_map.get("id_card").document_url if doc_map.get("id_card") else "",
            "selfie_url": doc_map.get("selfie_with_id").document_url if doc_map.get("selfie_with_id") else "",
            "review_notes": next((d.review_notes for d in docs if d.review_notes), ""),
            "submitted_at": min((d.submitted_at for d in docs if d.submitted_at), default=None),
            "reviewed_at": next((d.reviewed_at for d in docs if d.reviewed_at), None),
        })

    return success_response(data={"verifications": verifications, "total": total})


@admin_bp.route("/verifications/<int:host_id>/approve", methods=["POST"])
def approve_verification(host_id):
    host = Host.query.get(host_id)
    if not host:
        return error_response("Host not found.", status=404)

    host.status = "active"
    host.email_verified = 1

    docs = HostKycDocument.query.filter_by(host_id=host_id).all()
    for doc in docs:
        doc.status = "approved"
        doc.reviewed_at = datetime.utcnow()

    name = host.profile.full_name if host.profile else host.email
    _send_approval_email(host.email, name)

    db.session.commit()
    return success_response(message="Host verified.")


@admin_bp.route("/verifications/<int:host_id>/reject", methods=["POST"])
def reject_verification(host_id):
    host = Host.query.get(host_id)
    if not host:
        return error_response("Host not found.", status=404)

    data = request.get_json() or {}
    reason = data.get("reason", "Your verification was rejected.")

    docs = HostKycDocument.query.filter_by(host_id=host_id).all()
    for doc in docs:
        doc.status = "rejected"
        doc.review_notes = reason
        doc.reviewed_at = datetime.utcnow()

    name = host.profile.full_name if host.profile else host.email
    _send_rejection_email(host.email, name, reason)

    host.status = "inactive"

    db.session.commit()
    return success_response(message="Host rejected.")


def _send_approval_email(email, name):
    html = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#F7F4EF; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#1C3A2F; padding:28px 32px;">
                <span style="color:#F7F4EF; font-size:20px; font-weight:700;">TiraNa</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                <h1 style="margin:0 0 12px 0; color:#1C3A2F; font-size:22px; font-weight:700;">Verification Approved</h1>
                <p style="margin:0 0 16px 0; color:#4B5563; font-size:15px; line-height:1.6;">Hi {name},</p>
                <p style="margin:0 0 16px 0; color:#4B5563; font-size:15px; line-height:1.6;">Your host account has been verified. You can now list properties and receive bookings.</p>
                <p style="margin:0; color:#4B5563; font-size:15px; line-height:1.6;">Thank you for being part of TiraNa!</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F7F4EF; padding:20px 32px; text-align:center;">
                <p style="margin:0; color:#9CA3AF; font-size:12px;">— TiraNa Trust &amp; Safety Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
    msg = Message(subject="TiraNa - Verification Approved", recipients=[email], html=html)
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error("Failed to send approval email to %s: %s", email, e)


def _send_rejection_email(email, name, reason):
    html = f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#F7F4EF; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF; padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#1C3A2F; padding:28px 32px;">
                <span style="color:#F7F4EF; font-size:20px; font-weight:700;">TiraNa</span>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;">
                <h1 style="margin:0 0 12px 0; color:#1C3A2F; font-size:22px; font-weight:700;">Verification Rejected</h1>
                <p style="margin:0 0 16px 0; color:#4B5563; font-size:15px; line-height:1.6;">Hi {name},</p>
                <p style="margin:0 0 16px 0; color:#4B5563; font-size:15px; line-height:1.6;">Unfortunately, your host account verification was not approved.</p>
                <div style="background-color:#FEF2F2; border-radius:10px; padding:16px; margin:16px 0; border-left:4px solid #DC2626;">
                  <p style="margin:0; color:#991B1B; font-size:14px; font-weight:600;">Reason:</p>
                  <p style="margin:4px 0 0 0; color:#991B1B; font-size:14px;">{reason}</p>
                </div>
                <p style="margin:16px 0 0 0; color:#4B5563; font-size:15px; line-height:1.6;">Your account has been removed. You may register again with new documents.</p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#F7F4EF; padding:20px 32px; text-align:center;">
                <p style="margin:0; color:#9CA3AF; font-size:12px;">— TiraNa Trust &amp; Safety Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""
    msg = Message(subject="TiraNa - Verification Rejected", recipients=[email], html=html)
    try:
        mail.send(msg)
    except Exception as e:
        current_app.logger.error("Failed to send rejection email to %s: %s", email, e)


@admin_bp.route("/properties", methods=["GET"])
def list_properties():
    status = request.args.get("status", "").strip()
    search = request.args.get("search", "").strip()
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 50, type=int)

    query = db.session.query(Property, Host, HostProfile).join(
        Host, Property.host_id == Host.id
    ).outerjoin(
        HostProfile, Host.id == HostProfile.host_id
    )

    if status:
        query = query.filter(Property.status == status)

    if search:
        like_pattern = f"%{search}%"
        query = query.filter(
            db.or_(
                Property.title.ilike(like_pattern),
                Host.email.ilike(like_pattern),
                HostProfile.full_name.ilike(like_pattern),
            )
        )

    total = query.count()
    rows = query.order_by(Property.created_at.desc()).offset(skip).limit(limit).all()

    properties = []
    for prop, host, profile in rows:
        cover = PropertyImage.query.filter_by(property_id=prop.id, is_cover=1).first()
        if not cover:
            cover = PropertyImage.query.filter_by(property_id=prop.id).order_by(PropertyImage.display_order).first()

        loc = PropertyLocation.query.filter_by(property_id=prop.id).first()

        properties.append({
            "id": prop.id,
            "name": prop.title,
            "host_name": profile.full_name if profile else host.email.split("@")[0],
            "host_email": host.email,
            "price_per_night": float(prop.base_price) if prop.base_price else 0,
            "status": prop.status,
            "property_type": prop.property_type,
            "max_guests": prop.max_guests,
            "bedrooms": prop.bedrooms,
            "beds": prop.beds,
            "bathrooms": float(prop.bathrooms) if prop.bathrooms else 0,
            "location": f"{loc.city}, {loc.province}" if loc else "",
            "cover_photo": cover.image_url if cover else None,
            "created_at": prop.created_at.isoformat() if prop.created_at else None,
        })

    return success_response(data={"properties": properties, "total": total})


@admin_bp.route("/properties/<int:property_id>/status", methods=["POST"])
def update_property_status(property_id):
    prop = Property.query.get(property_id)
    if not prop:
        return error_response("Property not found.", status=404)

    data = request.get_json() or {}
    new_status = data.get("status", "active")

    if new_status not in ("active", "inactive", "suspended"):
        return error_response("Invalid status.", status=400)

    prop.status = new_status
    db.session.commit()

    return success_response(message=f"Property status updated to {new_status}.")
