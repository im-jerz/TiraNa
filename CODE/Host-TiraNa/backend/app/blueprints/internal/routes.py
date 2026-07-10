"""
Internal routes — called only by the Client backend (Node.js).
No JWT auth; secured by network trust (same Docker network).

    GET /api/internal/property-host/<property_id>
        Returns { host_id: <int> } for the given property.
        Used by the client backend to resolve which host to notify.
"""

from flask import jsonify
from app.blueprints.internal import internal_bp
from app.models.property import Property


@internal_bp.route("/property-host/<int:property_id>", methods=["GET"])
def property_host(property_id):
    """Return the host_id that owns a given property."""
    prop = Property.query.get(property_id)
    if prop is None:
        return jsonify({"error": "Property not found"}), 404
    return jsonify({"host_id": prop.host_id})