# app/services/upload_service.py
"""
Upload helper for KYC documents and property photos.

This is a minimal local-disk implementation for development. Swap the
body of these functions for a Cloudinary or S3 upload call in
production — see Config.CLOUDINARY_* settings in config.py.
"""

import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


def save_avatar(file_storage, host_id: int) -> str:
    """
    Saves an avatar photo and returns its public URL.

    Dev: stores under instance/uploads/avatars/<host_id>/ and returns
    a Flask-served path. Production: swap body for Cloudinary upload.
    """
    filename    = secure_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"

    upload_dir = os.path.join(current_app.instance_path, "uploads", "avatars", str(host_id))
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, unique_name)
    file_storage.save(filepath)

    return f"/uploads/avatars/{host_id}/{unique_name}"


def save_kyc_document(file_storage, folder: str) -> str:
    """
    Saves an uploaded KYC document and returns its public URL.

    Dev implementation: stores under instance/uploads/kyc/<folder>/ and
    returns a relative path served by Flask's static handler.
    Production: upload to Cloudinary/S3 and return the secure_url.
    """
    filename = secure_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"

    upload_dir = os.path.join(current_app.instance_path, "uploads", "kyc", folder)
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, unique_name)
    file_storage.save(filepath)

    return f"/uploads/kyc/{folder}/{unique_name}"


def save_property_photo(file_storage, property_id) -> str:
    """
    Saves a property/room photo and returns its public URL.

    Dev implementation: stores under
    instance/uploads/kyc/properties/<property_id>/, and returns
    "/uploads/kyc/properties/<property_id>/<filename>" — a path served by
    the Flask static route registered in app/__init__.py.

    Production: upload to Cloudinary/S3 and return the secure_url —
    only this function's body needs to change.
    """
    filename = secure_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"

    upload_dir = os.path.join(
        current_app.instance_path, "uploads", "kyc", "properties", str(property_id)
    )
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, unique_name)
    file_storage.save(filepath)

    return f"/uploads/kyc/properties/{property_id}/{unique_name}"


def delete_property_photo(image_url: str) -> None:
    """
    Removes a previously saved property photo from disk given its
    "/uploads/kyc/properties/<id>/<filename>" URL. Silently no-ops if the
    file is already gone (e.g. double-delete, manual cleanup).
    """
    if not image_url or not image_url.startswith("/uploads/kyc/properties/"):
        return
    relative = image_url[len("/uploads/kyc/properties/"):]
    upload_root = os.path.join(current_app.instance_path, "uploads", "kyc", "properties")
    filepath = os.path.normpath(os.path.join(upload_root, relative))
    if filepath.startswith(upload_root) and os.path.isfile(filepath):
        os.remove(filepath)


def cleanup_property_folder(property_id) -> None:
    """Removes a property's upload folder once it's empty (e.g. after delete)."""
    folder = os.path.join(
        current_app.instance_path, "uploads", "kyc", "properties", str(property_id)
    )
    folder = os.path.normpath(folder)
    upload_root = os.path.join(current_app.instance_path, "uploads", "kyc", "properties")
    if folder.startswith(upload_root) and os.path.isdir(folder) and not os.listdir(folder):
        os.rmdir(folder)