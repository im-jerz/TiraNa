"""
Admin routes — called by Admin-TiraNa backend to fetch host data.
"""

from datetime import datetime
from flask import request, current_app
from flask_mail import Message
from sqlalchemy import func
from app.blueprints.admin import admin_bp
from app.models.host import Host, HostProfile, HostKycDocument
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

    hosts_with_docs = (
        db.session.query(Host, HostProfile)
        .outerjoin(HostProfile, Host.id == HostProfile.host_id)
        .order_by(Host.created_at.desc())
        .all()
    )

    verifications = []
    for host, profile in hosts_with_docs:
        docs = HostKycDocument.query.filter_by(host_id=host.id).all()
        if not docs:
            continue

        doc_statuses = [d.status for d in docs]

        if all(s == "approved" for s in doc_statuses):
            overall_status = "approved"
        elif any(s == "rejected" for s in doc_statuses):
            overall_status = "rejected"
        else:
            overall_status = "pending"

        if status_filter and overall_status != status_filter:
            continue

        doc_map = {d.document_type: d for d in docs}

        verifications.append({
            "id": host.id,
            "host_id": host.id,
            "name": profile.full_name if profile else host.email.split("@")[0],
            "email": host.email,
            "type": "host",
            "status": overall_status,
            "id_card_url": doc_map.get("id_card").document_url if doc_map.get("id_card") else "",
            "selfie_url": doc_map.get("selfie_with_id").document_url if doc_map.get("selfie_with_id") else "",
            "review_notes": next((d.review_notes for d in docs if d.review_notes), ""),
            "submitted_at": min((d.submitted_at for d in docs if d.submitted_at), default=None),
            "reviewed_at": next((d.reviewed_at for d in docs if d.reviewed_at), None),
        })

    total = len(verifications)
    verifications = verifications[skip:skip + limit]

    return success_response(data={"verifications": verifications, "total": total})


@admin_bp.route("/verifications/<int:host_id>/approve", methods=["POST"])
def approve_verification(host_id):
    host = Host.query.get(host_id)
    if not host:
        return error_response("Host not found.", status=404)

    docs = HostKycDocument.query.filter_by(host_id=host_id).all()
    for doc in docs:
        doc.status = "approved"
        doc.reviewed_at = datetime.utcnow()

    host.email_verified = 1
    host.status = "active"

    name = host.profile.full_name if host.profile else host.email
    _send_approval_email(host.email, name)

    db.session.commit()
    return success_response(message="Verification approved.")


@admin_bp.route("/verifications/<int:host_id>/reject", methods=["POST"])
def reject_verification(host_id):
    host = Host.query.get(host_id)
    if not host:
        return error_response("Host not found.", status=404)

    data = request.get_json() or {}
    reason = data.get("reason", "Your verification was rejected.")

    name = host.profile.full_name if host.profile else host.email
    _send_rejection_email(host.email, name, reason)

    db.session.delete(host)
    db.session.commit()
    return success_response(message="Verification rejected and account deleted.")


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
