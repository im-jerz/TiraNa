"""
Pytest configuration for Admin-AirBnB tests.

Sets up sys.path and pre-installs mock modules for Streamlit and all heavy
dependencies so that application modules can be imported without a running
database, Streamlit server, or optional C-extension libraries.
"""
import sys
import os
import types
from unittest.mock import MagicMock

# Ensure CODE/Admin-AirBnB is on sys.path so imports like
# `from utils.constants import PAGE_SIZE` work inside the project.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# ---------------------------------------------------------------------------
# Helper: register a MagicMock stub only if the module is not yet present.
# ---------------------------------------------------------------------------

def _stub(module_name: str, mock: object = None):
    if module_name not in sys.modules:
        sys.modules[module_name] = mock if mock is not None else MagicMock()


# ---------------------------------------------------------------------------
# Mock streamlit *before* any application module is imported.
# ---------------------------------------------------------------------------
_st_mock = MagicMock()
# session_state needs to behave like a plain dict for .get() calls
_st_mock.session_state = {}
# st.stop() raises in real Streamlit; our tests catch SystemExit("st.stop called")
_st_mock.stop = MagicMock(side_effect=SystemExit("st.stop called"))
_stub("streamlit", _st_mock)

# ---------------------------------------------------------------------------
# Mock heavy / DB-dependent modules so they can be imported safely.
# ---------------------------------------------------------------------------
_stub("database")
_stub("sqlalchemy")
_stub("sqlalchemy.orm")

# dotenv – prevent load_dotenv from touching real files
_stub("dotenv")

# bcrypt is a C extension that may not be present in the test environment
_stub("bcrypt")

# Prevent config from trying to connect anywhere
_config_mock = MagicMock()
_config_mock.Config = MagicMock()
_stub("config", _config_mock)

# Stub psycopg2 which is not installed in the test env
_stub("psycopg2")
_stub("psycopg2.extras")

# Stub pandas (heavy import; only needed at view render time)
_stub("pandas")

# Stub plotly
_stub("plotly")
_stub("plotly.express")

# ---------------------------------------------------------------------------
# Stub services so that importing utils.auth (which imports auth_service)
# does not trigger bcrypt or other missing imports transitively.
# ---------------------------------------------------------------------------
_stub("services")
_stub("services.auth_service")
_stub("services.host_api")
_stub("services.audit_service")
_stub("services.sync_service")
_stub("services.support_service")
_stub("services.dispute_service")
_stub("services.activity_service")
_stub("services.settings_service")
_stub("services.email_service")

# ---------------------------------------------------------------------------
# Stub models
# ---------------------------------------------------------------------------
_stub("models")
_stub("models.admin_user")
_stub("models.otp_code")
_stub("models.login_attempt")
_stub("models.booking_copy")
_stub("models.payment_copy")
_stub("models.review_copy")
_stub("models.support_ticket")
_stub("models.ticket_message")
_stub("models.dispute")
_stub("models.system_setting")
_stub("models.activity_log")
_stub("models.audit_log")

# ---------------------------------------------------------------------------
# Stub views sub-packages using real module objects (so Python treats them as
# packages and allows `views.bookings_management` style imports).
# ---------------------------------------------------------------------------

def _make_package(name: str, parent_name: str = None):
    """Create and register a real types.ModuleType as a package stub."""
    mod = types.ModuleType(name)
    mod.__path__ = []          # marks it as a package to Python's importer
    mod.__package__ = name
    mod.__spec__ = None
    sys.modules[name] = mod
    if parent_name and parent_name in sys.modules:
        # attach as attribute on parent for dotted access
        attr = name.split(".")[-1]
        setattr(sys.modules[parent_name], attr, mod)
    return mod


_VIEWS_DIR = os.path.join(PROJECT_ROOT, "views")

if "views" not in sys.modules:
    views_pkg = _make_package("views")
    views_pkg.__path__ = [_VIEWS_DIR]
    views_pkg.__file__ = os.path.join(_VIEWS_DIR, "__init__.py")
else:
    sys.modules["views"].__path__ = [_VIEWS_DIR]

if "views.components" not in sys.modules:
    _COMPONENTS_DIR = os.path.join(_VIEWS_DIR, "components")
    comp_pkg = _make_package("views.components", "views")
    comp_pkg.__path__ = [_COMPONENTS_DIR]
    comp_pkg.__file__ = os.path.join(_COMPONENTS_DIR, "__init__.py")

# Stub the component modules that views import
_stub("views.components.sidebar")
_stub("views.components.master_detail")