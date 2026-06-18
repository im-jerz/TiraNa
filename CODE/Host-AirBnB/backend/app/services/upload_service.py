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

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
PROPERTY_UPLOAD_ROOT = os.path.normpath(
    os.path.join(_THIS_DIR, "..", "..", "..", "frontend", "src", "assets", "uploads")
)


def save_kyc_document(file_storage, folder: str) -> str:
    """
    Saves an uploaded KYC document and returns its public URL.

    Dev implementation: stores under instance/uploads/<folder>/ and
    returns a relative path served by Flask's static handler.
    Production: upload to Cloudinary/S3 and return the secure_url.
    """
    filename = secure_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"

    upload_dir = os.path.join(current_app.instance_path, "uploads", folder)
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, unique_name)
    file_storage.save(filepath)

    return f"/uploads/{folder}/{unique_name}"


def save_property_photo(file_storage, property_id) -> str:
    """
    Saves a property/room photo and returns its public URL.

    Dev implementation: stores the physical file under
    frontend/src/assets/uploads/properties/<property_id>/, and returns
    "/uploads/properties/<property_id>/<filename>" — a path served by
    the Flask static route registered for PROPERTY_UPLOAD_ROOT in
    app/__init__.py. The frontend's <img src> can point straight at
    this URL (proxied through Vite or hit directly on the API origin).

    Production: upload to Cloudinary/S3 and return the secure_url —
    only this function's body needs to change.
    """
    filename = secure_filename(file_storage.filename)
    unique_name = f"{uuid.uuid4().hex}_{filename}"

    upload_dir = os.path.join(PROPERTY_UPLOAD_ROOT, "properties", str(property_id))
    os.makedirs(upload_dir, exist_ok=True)

    filepath = os.path.join(upload_dir, unique_name)
    file_storage.save(filepath)

    return f"/uploads/properties/{property_id}/{unique_name}"


def delete_property_photo(image_url: str) -> None:
    """
    Removes a previously saved property photo from disk given its
    "/uploads/properties/<id>/<filename>" URL. Silently no-ops if the
    file is already gone (e.g. double-delete, manual cleanup).
    """
    if not image_url or not image_url.startswith("/uploads/properties/"):
        return
    relative = image_url[len("/uploads/properties/"):]
    filepath = os.path.join(PROPERTY_UPLOAD_ROOT, "properties", relative)
    filepath = os.path.normpath(filepath)
    if filepath.startswith(PROPERTY_UPLOAD_ROOT) and os.path.isfile(filepath):
        os.remove(filepath)


def cleanup_property_folder(property_id) -> None:
    """Removes a property's upload folder once it's empty (e.g. after delete)."""
    folder = os.path.join(PROPERTY_UPLOAD_ROOT, "properties", str(property_id))
    folder = os.path.normpath(folder)
    if folder.startswith(PROPERTY_UPLOAD_ROOT) and os.path.isdir(folder) and not os.listdir(folder):
        os.rmdir(folder)
