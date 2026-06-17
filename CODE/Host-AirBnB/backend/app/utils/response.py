"""
Consistent JSON response helpers used across all blueprints.

Every endpoint returns the same envelope shape so the frontend's
axiosInstance.js can handle responses generically:

    { "success": true,  "message": "...", "data": {...} }
    { "success": false, "message": "...", "errors": {...} }
"""

from flask import jsonify


def success_response(message="", data=None, status=200):
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def error_response(message="", errors=None, status=400):
    body = {"success": False, "message": message}
    if errors is not None:
        body["errors"] = errors
    return jsonify(body), status
