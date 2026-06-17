"""
Entry point for running the app directly or via a WSGI server
(gunicorn, uwsgi).

Local dev:    python wsgi.py
Production:   gunicorn wsgi:app
"""

import os
from dotenv import load_dotenv

load_dotenv()

from app import create_app

app = create_app(os.environ.get("FLASK_ENV", "development"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
