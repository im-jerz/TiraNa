"""
Notifications routes — host dashboard.

Internal (called by Client backend, no JWT):
    POST /api/notifications/internal          create a notification for a host

Host-facing (JWT required):
    GET  /api/notifications                   list notifications (paginated)
    GET  /api/notifications/unread-count      count of unread notifications
    PUT  /api/notifications/<id>/read         mark one as read
    PUT  /api/notifications/read-all          mark all as read
    DELETE /api/notifications/<id>            delete one notification
"""

from flask import request, g
from app.blueprints.notifications import notifications_bp
from app.middleware.auth_middleware import host_required
from app.extensions import db
from app.utils.response import success_response, error_response
from app.models.notification import Notification


# ─── Internal endpoint (called by the Client/Node backend) ───────────────────

@notifications_bp.route("/internal", methods=["POST"])
def create_notification():
    """
    Called internally by the Client backend after a booking or review event.
    No JWT — secured by network trust (same internal network / docker compose).

    Expected JSON body:
        {
            "host_id":      <int>,
            "type":         "new_booking" | "new_review" | "booking_cancelled" | ...,
            "title":        <str>,
            "body":         <str>,
            "related_type": "booking" | "review" | "payment",   # optional
            "related_id":   <string>                            # optional, can be UUID or int
        }
    """
    data = request.get_json(silent=True) or {}

    host_id      = data.get("host_id")
    notif_type   = data.get("type")
    title        = data.get("title")
    body         = data.get("body")
    related_type = data.get("related_type")
    related_id   = data.get("related_id")

    if not host_id or not notif_type or not title or not body:
        return error_response("host_id, type, title, and body are required.", status=400)

    notif = Notification(
        host_id=host_id,
        type=notif_type,
        title=title,
        body=body,
        related_type=related_type,
        related_id=related_id,
    )
    db.session.add(notif)
    db.session.commit()

    return success_response(data=notif.to_dict(), status=201)


# ─── Host-facing endpoints ────────────────────────────────────────────────────

@notifications_bp.route("", methods=["GET"])
@host_required
def list_notifications():
    """Return paginated notifications for the authenticated host."""
    page     = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 20)), 100)

    pagination = (
        Notification.query
        .filter_by(host_id=g.current_host.id)
        .order_by(Notification.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )

    return success_response(data={
        "notifications": [n.to_dict() for n in pagination.items],
        "total":      pagination.total,
        "page":       page,
        "per_page":   per_page,
        "pages":      pagination.pages,
    })


@notifications_bp.route("/unread-count", methods=["GET"])
@host_required
def unread_count():
    """Return the count of unread notifications for the authenticated host."""
    count = Notification.query.filter_by(
        host_id=g.current_host.id, is_read=False
    ).count()
    return success_response(data={"unread_count": count})


@notifications_bp.route("/<int:notif_id>/read", methods=["PUT"])
@host_required
def mark_read(notif_id):
    """Mark a single notification as read."""
    notif = Notification.query.filter_by(
        id=notif_id, host_id=g.current_host.id
    ).first()

    if notif is None:
        return error_response("Notification not found.", status=404)

    notif.is_read = True
    db.session.commit()
    return success_response(data=notif.to_dict())


@notifications_bp.route("/read-all", methods=["PUT"])
@host_required
def mark_all_read():
    """Mark all notifications for the authenticated host as read."""
    updated = (
        Notification.query
        .filter_by(host_id=g.current_host.id, is_read=False)
        .update({"is_read": True})
    )
    db.session.commit()
    return success_response(data={"marked_read": updated})


@notifications_bp.route("/<int:notif_id>", methods=["DELETE"])
@host_required
def delete_notification(notif_id):
    """Delete a single notification."""
    notif = Notification.query.filter_by(
        id=notif_id, host_id=g.current_host.id
    ).first()

    if notif is None:
        return error_response("Notification not found.", status=404)

    db.session.delete(notif)
    db.session.commit()
    return success_response(data={"deleted_id": notif_id})