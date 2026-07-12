"""
Small standalone validators shared across blueprints.

Auth-specific field validation (email format, password strength, PH
phone numbers) lives in blueprints/auth/schemas.py. This module holds
generic file-upload helpers reusable by other modules too (e.g.
property photo uploads in a later phase).
"""

import os

ALLOWED_DOCUMENT_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png"}


def allowed_file(filename: str, allowed: set) -> bool:
    """Checks a filename's extension against an allowed set."""
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in allowed


def file_size_ok(file_storage, max_bytes: int) -> bool:
    """
    Checks a werkzeug FileStorage's size without permanently consuming
    the stream — seeks back to the start afterwards.
    """
    file_storage.stream.seek(0, os.SEEK_END)
    size = file_storage.stream.tell()
    file_storage.stream.seek(0)
    return size <= max_bytes
