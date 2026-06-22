"""
Tests for utils/auth.py

Covers the `require_admin` decorator which:
1. Stops execution if `st.session_state["logged_in"]` is falsy
2. Fetches the admin from the DB using the session's admin_id
3. Stops execution if the admin is not found
4. Passes the admin as a keyword argument to the wrapped function when auth succeeds
"""
import sys
import pytest
from unittest.mock import MagicMock, patch, call


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_admin(admin_id="admin-123", full_name="Test Admin"):
    admin = MagicMock()
    admin.id = admin_id
    admin.full_name = full_name
    return admin


class StopCalled(Exception):
    """Raised by our st.stop() mock so tests can catch it cleanly."""


# ---------------------------------------------------------------------------
# Test class
# ---------------------------------------------------------------------------

class TestRequireAdmin:
    """Unit tests for the require_admin decorator."""

    def setup_method(self):
        """Reset mocks before each test."""
        # Get the mock streamlit module installed by conftest.py
        self.st_mock = sys.modules["streamlit"]
        # Replace st.stop with a raising mock for cleaner assertions
        self.st_mock.stop = MagicMock(side_effect=StopCalled("st.stop"))
        self.st_mock.warning = MagicMock()

        # Fresh session state dict for each test
        self.st_mock.session_state = {}

    # ------------------------------------------------------------------
    # Case 1: not logged in
    # ------------------------------------------------------------------

    def test_not_logged_in_calls_warning(self):
        """When 'logged_in' is missing/False, st.warning should be called."""
        from utils.auth import require_admin  # import after mocks are set up

        @require_admin
        def dummy_view(*, admin):
            return "rendered"

        self.st_mock.session_state = {"logged_in": False}

        with pytest.raises(StopCalled):
            dummy_view()

        self.st_mock.warning.assert_called_once_with(
            "Please sign in to access the dashboard."
        )

    def test_not_logged_in_missing_key_calls_warning(self):
        """When 'logged_in' key is absent, same warning should appear."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            return "rendered"

        self.st_mock.session_state = {}  # no 'logged_in' key

        with pytest.raises(StopCalled):
            dummy_view()

        self.st_mock.warning.assert_called_once_with(
            "Please sign in to access the dashboard."
        )

    def test_not_logged_in_calls_stop(self):
        """st.stop() must be called when the user is not logged in."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            return "rendered"

        self.st_mock.session_state = {"logged_in": False}

        with pytest.raises(StopCalled):
            dummy_view()

        self.st_mock.stop.assert_called_once()

    def test_not_logged_in_does_not_call_wrapped_function(self):
        """The wrapped function must NOT be called when authentication fails."""
        from utils.auth import require_admin

        inner = MagicMock()

        @require_admin
        def dummy_view(*, admin):
            inner()

        self.st_mock.session_state = {"logged_in": False}

        with pytest.raises(StopCalled):
            dummy_view()

        inner.assert_not_called()

    # ------------------------------------------------------------------
    # Case 2: logged in but admin not found in DB
    # ------------------------------------------------------------------

    def test_admin_not_found_calls_warning(self):
        """When the DB lookup returns None, st.warning('Admin not found') must fire."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            return "rendered"

        self.st_mock.session_state = {"logged_in": True, "admin_id": "nonexistent"}

        mock_db = MagicMock()
        mock_session_cls = MagicMock(return_value=mock_db)

        with (
            patch("utils.auth.SessionLocal", mock_session_cls),
            patch("utils.auth.get_admin_by_id", return_value=None),
        ):
            with pytest.raises(StopCalled):
                dummy_view()

        self.st_mock.warning.assert_called_once_with("Admin not found")

    def test_admin_not_found_calls_stop(self):
        """st.stop() must be called when the admin record is absent."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            return "rendered"

        self.st_mock.session_state = {"logged_in": True, "admin_id": "ghost"}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=None),
        ):
            with pytest.raises(StopCalled):
                dummy_view()

        self.st_mock.stop.assert_called_once()

    def test_admin_not_found_does_not_call_wrapped_function(self):
        """The wrapped function must NOT be called when the admin is missing."""
        from utils.auth import require_admin

        inner = MagicMock()

        @require_admin
        def dummy_view(*, admin):
            inner()

        self.st_mock.session_state = {"logged_in": True, "admin_id": "ghost"}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=None),
        ):
            with pytest.raises(StopCalled):
                dummy_view()

        inner.assert_not_called()

    def test_admin_not_found_db_session_is_closed(self):
        """Even when the admin is not found, the DB session must be closed."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            return "ok"

        self.st_mock.session_state = {"logged_in": True, "admin_id": "ghost"}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=None),
        ):
            with pytest.raises(StopCalled):
                dummy_view()

        mock_db.close.assert_called_once()

    # ------------------------------------------------------------------
    # Case 3: successful authentication
    # ------------------------------------------------------------------

    def test_success_calls_wrapped_function(self):
        """When both checks pass, the wrapped function should be called."""
        from utils.auth import require_admin

        inner = MagicMock(return_value="result")

        @require_admin
        def dummy_view(*, admin):
            return inner(admin=admin)

        admin_obj = _make_admin()
        self.st_mock.session_state = {"logged_in": True, "admin_id": admin_obj.id}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=admin_obj),
        ):
            dummy_view()

        inner.assert_called_once_with(admin=admin_obj)

    def test_success_injects_admin_kwarg(self):
        """The admin object from the DB must be passed as keyword argument `admin`."""
        from utils.auth import require_admin

        received = {}

        @require_admin
        def dummy_view(*, admin):
            received["admin"] = admin

        admin_obj = _make_admin(admin_id="admin-abc")
        self.st_mock.session_state = {"logged_in": True, "admin_id": "admin-abc"}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=admin_obj),
        ):
            dummy_view()

        assert received["admin"] is admin_obj

    def test_success_db_session_is_closed(self):
        """The DB session must be closed even on successful auth."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            return "ok"

        admin_obj = _make_admin()
        self.st_mock.session_state = {"logged_in": True, "admin_id": admin_obj.id}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=admin_obj),
        ):
            dummy_view()

        mock_db.close.assert_called_once()

    def test_success_get_admin_by_id_called_with_session_admin_id(self):
        """get_admin_by_id must be called with the admin_id from session state."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            pass

        admin_obj = _make_admin(admin_id="session-admin-id")
        self.st_mock.session_state = {"logged_in": True, "admin_id": "session-admin-id"}

        mock_db = MagicMock()
        mock_get = MagicMock(return_value=admin_obj)

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", mock_get),
        ):
            dummy_view()

        mock_get.assert_called_once_with(mock_db, "session-admin-id")

    def test_success_get_admin_by_id_empty_admin_id(self):
        """When admin_id is absent from session state, empty string is passed."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            pass

        # logged_in but no admin_id key
        self.st_mock.session_state = {"logged_in": True}

        mock_db = MagicMock()
        admin_obj = _make_admin()
        mock_get = MagicMock(return_value=admin_obj)

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", mock_get),
        ):
            dummy_view()

        mock_get.assert_called_once_with(mock_db, "")

    def test_success_stop_never_called(self):
        """st.stop() must NOT be called when authentication succeeds."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            pass

        admin_obj = _make_admin()
        self.st_mock.session_state = {"logged_in": True, "admin_id": admin_obj.id}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=admin_obj),
        ):
            dummy_view()

        self.st_mock.stop.assert_not_called()

    def test_success_warning_never_called(self):
        """st.warning() must NOT be called when authentication succeeds."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            pass

        admin_obj = _make_admin()
        self.st_mock.session_state = {"logged_in": True, "admin_id": admin_obj.id}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", return_value=admin_obj),
        ):
            dummy_view()

        self.st_mock.warning.assert_not_called()

    # ------------------------------------------------------------------
    # functools.wraps preservation
    # ------------------------------------------------------------------

    def test_decorator_preserves_function_name(self):
        """@require_admin must preserve the wrapped function's __name__."""
        from utils.auth import require_admin

        @require_admin
        def my_render_view(*, admin):
            pass

        assert my_render_view.__name__ == "my_render_view"

    def test_decorator_preserves_function_docstring(self):
        """@require_admin must preserve the wrapped function's __doc__."""
        from utils.auth import require_admin

        @require_admin
        def my_view(*, admin):
            """My view docstring."""

        assert my_view.__doc__ == "My view docstring."

    # ------------------------------------------------------------------
    # DB exception safety
    # ------------------------------------------------------------------

    def test_db_session_closed_even_when_get_admin_raises(self):
        """DB close() must be called even if get_admin_by_id raises an exception."""
        from utils.auth import require_admin

        @require_admin
        def dummy_view(*, admin):
            pass

        self.st_mock.session_state = {"logged_in": True, "admin_id": "some-id"}

        mock_db = MagicMock()

        with (
            patch("utils.auth.SessionLocal", MagicMock(return_value=mock_db)),
            patch("utils.auth.get_admin_by_id", side_effect=RuntimeError("DB error")),
        ):
            with pytest.raises(RuntimeError):
                dummy_view()

        mock_db.close.assert_called_once()