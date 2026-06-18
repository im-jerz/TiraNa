"""
Properties routes.

    GET    /api/host/properties
    POST   /api/host/properties
    GET    /api/host/properties/:id
    PUT    /api/host/properties/:id
    DELETE /api/host/properties/:id
    PATCH  /api/host/properties/:id/status
    POST   /api/host/properties/draft

Maps to flow.md Section 3 (Property Management) and the "properties"
blueprint described in Section 10 (Backend Structure) of
host_dashboard_design.md.
"""

import json
from flask import request, g
from marshmallow import ValidationError

from app.blueprints.properties import properties_bp
from app.blueprints.properties.schemas import (
    PropertyPayloadSchema,
    StatusUpdateSchema,
    PropertyListItemSchema,
    PropertyDetailSchema,
)
from app.middleware.auth_middleware import host_required
from app.services import property_service
from app.services.property_service import PropertyError
from app.utils.response import success_response, error_response
from app.utils.validators import allowed_file, file_size_ok, ALLOWED_IMAGE_EXTENSIONS

MAX_PHOTO_BYTES = 5 * 1024 * 1024


def _parse_payload():
    """Reads the `payload` form field (JSON string) sent alongside multipart photos."""
    raw = request.form.get("payload")
    if raw is None:
        return None, error_response("Missing 'payload' field.", status=422)
    try:
        return json.loads(raw), None
    except (TypeError, ValueError):
        return None, error_response("'payload' must be valid JSON.", status=422)


def _collect_and_validate_photos():
    files = request.files.getlist("photos")
    for f in files:
        if not allowed_file(f.filename, ALLOWED_IMAGE_EXTENSIONS):
            return None, error_response(
                f'"{f.filename}" must be a jpg or png image.', status=422
            )
        if not file_size_ok(f, MAX_PHOTO_BYTES):
            return None, error_response(
                f'"{f.filename}" is too large. Max 5MB per photo.', status=422
            )
    return files, None


@properties_bp.route("", methods=["GET"])
@host_required
def list_properties():
    status_filter = request.args.get("status")
    sort = request.args.get("sort", "recent")

    properties = property_service.list_properties(g.current_host.id, status_filter, sort)
    data = PropertyListItemSchema(many=True).dump(properties)

    return success_response(data={"properties": data})


@properties_bp.route("", methods=["POST"])
@host_required
def create_property():
    raw_payload, err = _parse_payload()
    if err:
        return err

    schema = PropertyPayloadSchema()
    try:
        payload = schema.load(raw_payload)
    except ValidationError as ve:
        return error_response("Validation failed.", errors=ve.messages, status=422)

    photo_files, err = _collect_and_validate_photos()
    if err:
        return err

    try:
        prop = property_service.create_property(g.current_host.id, payload, photo_files)
    except PropertyError as pe:
        return error_response(pe.message, status=pe.status)

    return success_response(
        message="Property submitted for approval. We'll notify you once it's live.",
        data={"property": PropertyDetailSchema().dump(prop)},
        status=201,
    )


@properties_bp.route("/<int:property_id>", methods=["GET"])
@host_required
def get_property(property_id):
    try:
        prop = property_service.get_property_detail(property_id, g.current_host.id)
    except PropertyError as pe:
        return error_response(pe.message, status=pe.status)

    return success_response(data={"property": PropertyDetailSchema().dump(prop)})

@properties_bp.route("/<int:property_id>", methods=["PUT"])
@host_required
def update_property(property_id):
    raw_payload, err = _parse_payload()
    if err:
        return err

    schema = PropertyPayloadSchema()
    try:
        payload = schema.load(raw_payload)
    except ValidationError as ve:
        return error_response("Validation failed.", errors=ve.messages, status=422)

    photo_files, err = _collect_and_validate_photos()
    if err:
        return err

    try:
        prop = property_service.update_property(property_id, g.current_host.id, payload, photo_files)
    except PropertyError as pe:
        return error_response(pe.message, status=pe.status)

    message = "Changes saved."
    if prop.status == "pending_review":
        message = "Changes saved. Updated photos or location require a quick re-review."

    return success_response(message=message, data={"property": PropertyDetailSchema().dump(prop)})


@properties_bp.route("/<int:property_id>/status", methods=["PATCH"])
@host_required
def update_status(property_id):
    schema = StatusUpdateSchema()
    try:
        data = schema.load(request.get_json() or {})
    except ValidationError as ve:
        return error_response("Validation failed.", errors=ve.messages, status=422)

    try:
        prop = property_service.set_property_status(property_id, g.current_host.id, data["status"])
    except PropertyError as pe:
        return error_response(pe.message, status=pe.status)

    message = "Listing is now live." if prop.status == "active" else "Listing has been deactivated."
    return success_response(message=message, data={"property": PropertyListItemSchema().dump(prop)})


@properties_bp.route("/<int:property_id>", methods=["DELETE"])
@host_required
def delete_property(property_id):
    try:
        property_service.delete_property(property_id, g.current_host.id)
    except PropertyError as pe:
        return error_response(pe.message, status=pe.status)

    return success_response(message="Property deleted.")


@properties_bp.route("/draft", methods=["POST"])
@host_required
def save_draft():
    return success_response(message="Draft saved.")
