"""
Tests for utils/toast.py

Covers the four toast helper functions:
- toast_success: should call st.success with SVG icon + message
- toast_error:   should call st.error with SVG icon + message
- toast_info:    should call st.info with the raw message
- toast_warning: should call st.warning with the raw message
"""
import sys
import pytest
from unittest.mock import MagicMock, call, patch


class TestToastSuccess:
    def setup_method(self):
        self.st_mock = sys.modules["streamlit"]
        self.st_mock.success = MagicMock()
        self.st_mock.error = MagicMock()
        self.st_mock.info = MagicMock()
        self.st_mock.warning = MagicMock()

    def test_calls_st_success(self):
        from utils.toast import toast_success
        toast_success("Operation done")
        self.st_mock.success.assert_called_once()

    def test_message_included_in_call(self):
        from utils.toast import toast_success
        toast_success("Everything worked!")
        args, kwargs = self.st_mock.success.call_args
        assert "Everything worked!" in args[0]

    def test_uses_unsafe_allow_html(self):
        from utils.toast import toast_success
        toast_success("msg")
        _, kwargs = self.st_mock.success.call_args
        assert kwargs.get("unsafe_allow_html") is True

    def test_contains_svg_markup(self):
        """The success message should embed an SVG icon."""
        from utils.toast import toast_success
        toast_success("done")
        args, _ = self.st_mock.success.call_args
        assert "<svg" in args[0]

    def test_does_not_call_error(self):
        from utils.toast import toast_success
        toast_success("ok")
        self.st_mock.error.assert_not_called()

    def test_empty_message(self):
        """toast_success should not raise on an empty string."""
        from utils.toast import toast_success
        toast_success("")
        self.st_mock.success.assert_called_once()

    def test_message_with_special_characters(self):
        """Messages with HTML-like content should still be passed through."""
        from utils.toast import toast_success
        toast_success("<b>Bold</b>")
        args, _ = self.st_mock.success.call_args
        assert "<b>Bold</b>" in args[0]


class TestToastError:
    def setup_method(self):
        self.st_mock = sys.modules["streamlit"]
        self.st_mock.success = MagicMock()
        self.st_mock.error = MagicMock()
        self.st_mock.info = MagicMock()
        self.st_mock.warning = MagicMock()

    def test_calls_st_error(self):
        from utils.toast import toast_error
        toast_error("Something went wrong")
        self.st_mock.error.assert_called_once()

    def test_message_included_in_call(self):
        from utils.toast import toast_error
        toast_error("Failure!")
        args, kwargs = self.st_mock.error.call_args
        assert "Failure!" in args[0]

    def test_uses_unsafe_allow_html(self):
        from utils.toast import toast_error
        toast_error("err")
        _, kwargs = self.st_mock.error.call_args
        assert kwargs.get("unsafe_allow_html") is True

    def test_contains_svg_markup(self):
        """The error message should embed an SVG icon."""
        from utils.toast import toast_error
        toast_error("bad")
        args, _ = self.st_mock.error.call_args
        assert "<svg" in args[0]

    def test_does_not_call_success(self):
        from utils.toast import toast_error
        toast_error("fail")
        self.st_mock.success.assert_not_called()

    def test_empty_message(self):
        from utils.toast import toast_error
        toast_error("")
        self.st_mock.error.assert_called_once()


class TestToastInfo:
    def setup_method(self):
        self.st_mock = sys.modules["streamlit"]
        self.st_mock.success = MagicMock()
        self.st_mock.error = MagicMock()
        self.st_mock.info = MagicMock()
        self.st_mock.warning = MagicMock()

    def test_calls_st_info(self):
        from utils.toast import toast_info
        toast_info("Just so you know")
        self.st_mock.info.assert_called_once_with("Just so you know")

    def test_passes_message_verbatim(self):
        """toast_info should pass the message directly without wrapping in HTML."""
        from utils.toast import toast_info
        msg = "Plain info message"
        toast_info(msg)
        args, kwargs = self.st_mock.info.call_args
        assert args[0] == msg

    def test_does_not_call_warning_or_error(self):
        from utils.toast import toast_info
        toast_info("info")
        self.st_mock.warning.assert_not_called()
        self.st_mock.error.assert_not_called()

    def test_empty_message(self):
        from utils.toast import toast_info
        toast_info("")
        self.st_mock.info.assert_called_once_with("")


class TestToastWarning:
    def setup_method(self):
        self.st_mock = sys.modules["streamlit"]
        self.st_mock.success = MagicMock()
        self.st_mock.error = MagicMock()
        self.st_mock.info = MagicMock()
        self.st_mock.warning = MagicMock()

    def test_calls_st_warning(self):
        from utils.toast import toast_warning
        toast_warning("Be careful")
        self.st_mock.warning.assert_called_once_with("Be careful")

    def test_passes_message_verbatim(self):
        """toast_warning should pass the message directly without wrapping in HTML."""
        from utils.toast import toast_warning
        msg = "Watch out!"
        toast_warning(msg)
        args, kwargs = self.st_mock.warning.call_args
        assert args[0] == msg

    def test_does_not_call_error_or_success(self):
        from utils.toast import toast_warning
        toast_warning("warn")
        self.st_mock.error.assert_not_called()
        self.st_mock.success.assert_not_called()

    def test_empty_message(self):
        from utils.toast import toast_warning
        toast_warning("")
        self.st_mock.warning.assert_called_once_with("")


class TestToastDistinctMethods:
    """Ensure each toast function routes to the correct st method."""

    def setup_method(self):
        self.st_mock = sys.modules["streamlit"]
        self.st_mock.success = MagicMock()
        self.st_mock.error = MagicMock()
        self.st_mock.info = MagicMock()
        self.st_mock.warning = MagicMock()

    def test_success_only_calls_st_success(self):
        from utils.toast import toast_success
        toast_success("x")
        assert self.st_mock.success.call_count == 1
        assert self.st_mock.error.call_count == 0
        assert self.st_mock.info.call_count == 0
        assert self.st_mock.warning.call_count == 0

    def test_error_only_calls_st_error(self):
        from utils.toast import toast_error
        toast_error("x")
        assert self.st_mock.success.call_count == 0
        assert self.st_mock.error.call_count == 1
        assert self.st_mock.info.call_count == 0
        assert self.st_mock.warning.call_count == 0

    def test_info_only_calls_st_info(self):
        from utils.toast import toast_info
        toast_info("x")
        assert self.st_mock.success.call_count == 0
        assert self.st_mock.error.call_count == 0
        assert self.st_mock.info.call_count == 1
        assert self.st_mock.warning.call_count == 0

    def test_warning_only_calls_st_warning(self):
        from utils.toast import toast_warning
        toast_warning("x")
        assert self.st_mock.success.call_count == 0
        assert self.st_mock.error.call_count == 0
        assert self.st_mock.info.call_count == 0
        assert self.st_mock.warning.call_count == 1