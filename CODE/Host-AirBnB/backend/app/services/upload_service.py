"""
Upload helper for KYC documents (and, in later phases, property images).

This is a minimal local-disk implementation for development. Swap the
body of `save_kyc_document` for a Cloudinary or S3 upload call in
production — see Config.CLOUDINARY_* settings in config.py.
"""

import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app


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
