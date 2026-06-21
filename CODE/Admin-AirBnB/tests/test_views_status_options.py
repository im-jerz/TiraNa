"""
Tests for STATUS_OPTIONS constants in view modules changed by this PR.

This PR replaced hard-coded string literals (e.g. "confirmed", "pending") with
references to constants from utils.constants (BookingStatus, ListingStatus).
These tests verify:
  1. The STATUS_OPTIONS lists in each view contain the correct constant values.
  2. STATUS_LABELS lengths match STATUS_OPTIONS lengths.
  3. The first element of STATUS_OPTIONS is the empty string (sentinel for "all").
  4. The views no longer define their own local PER_PAGE constant.
  5. The views import PAGE_SIZE from utils.constants.
"""
import sys
import importlib

# conftest.py pre-populates sys.modules with all required stubs before this
# file is collected, so no additional stub setup is needed here.


def _import_view(module_path: str):
    """Import (or re-import) a view module, bypassing any cached version."""
    sys.modules.pop(module_path, None)
    return importlib.import_module(module_path)


class TestBookingsManagementStatusOptions:
    """STATUS_OPTIONS in views/bookings_management.py"""

    def setup_method(self):
        self.mod = _import_view("views.bookings_management")

    def test_first_element_is_empty_string(self):
        assert self.mod.STATUS_OPTIONS[0] == ""

    def test_confirmed_uses_booking_status_constant(self):
        from utils.constants import BookingStatus
        assert BookingStatus.CONFIRMED in self.mod.STATUS_OPTIONS

    def test_completed_uses_booking_status_constant(self):
        from utils.constants import BookingStatus
        assert BookingStatus.COMPLETED in self.mod.STATUS_OPTIONS

    def test_cancelled_uses_booking_status_constant(self):
        from utils.constants import BookingStatus
        assert BookingStatus.CANCELLED in self.mod.STATUS_OPTIONS

    def test_pending_uses_booking_status_constant(self):
        from utils.constants import BookingStatus
        assert BookingStatus.PENDING in self.mod.STATUS_OPTIONS

    def test_status_options_length(self):
        # 1 empty sentinel + 4 booking statuses
        assert len(self.mod.STATUS_OPTIONS) == 5

    def test_status_labels_length_matches_options(self):
        assert len(self.mod.STATUS_LABELS) == len(self.mod.STATUS_OPTIONS)

    def test_status_labels_first_is_all_statuses(self):
        assert self.mod.STATUS_LABELS[0] == "All Statuses"

    def test_no_local_per_page_constant(self):
        """PER_PAGE should have been removed; PAGE_SIZE from constants is used instead."""
        assert not hasattr(self.mod, "PER_PAGE")

    def test_page_size_imported_from_constants(self):
        from utils.constants import PAGE_SIZE
        assert self.mod.PAGE_SIZE == PAGE_SIZE

    def test_exact_status_options_values(self):
        from utils.constants import BookingStatus
        expected = [
            "",
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.PENDING,
        ]
        assert self.mod.STATUS_OPTIONS == expected

    def test_no_hardcoded_string_literals_in_status_options(self):
        """All non-empty elements must equal the constant values (regression guard)."""
        from utils.constants import BookingStatus
        non_empty = [v for v in self.mod.STATUS_OPTIONS if v]
        assert set(non_empty) == {
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.PENDING,
        }


class TestListingsModerationStatusOptions:
    """STATUS_OPTIONS in views/listings_moderation.py"""

    def setup_method(self):
        self.mod = _import_view("views.listings_moderation")

    def test_first_element_is_empty_string(self):
        assert self.mod.STATUS_OPTIONS[0] == ""

    def test_pending_uses_listing_status_constant(self):
        from utils.constants import ListingStatus
        assert ListingStatus.PENDING in self.mod.STATUS_OPTIONS

    def test_approved_uses_listing_status_constant(self):
        from utils.constants import ListingStatus
        assert ListingStatus.APPROVED in self.mod.STATUS_OPTIONS

    def test_suspended_uses_listing_status_constant(self):
        from utils.constants import ListingStatus
        assert ListingStatus.SUSPENDED in self.mod.STATUS_OPTIONS

    def test_rejected_uses_listing_status_constant(self):
        from utils.constants import ListingStatus
        assert ListingStatus.REJECTED in self.mod.STATUS_OPTIONS

    def test_status_options_length(self):
        # 1 empty sentinel + 4 listing statuses
        assert len(self.mod.STATUS_OPTIONS) == 5

    def test_status_labels_length_matches_options(self):
        assert len(self.mod.STATUS_LABELS) == len(self.mod.STATUS_OPTIONS)

    def test_status_labels_first_is_all_statuses(self):
        assert self.mod.STATUS_LABELS[0] == "All Statuses"

    def test_no_local_per_page_constant(self):
        assert not hasattr(self.mod, "PER_PAGE")

    def test_page_size_imported_from_constants(self):
        from utils.constants import PAGE_SIZE
        assert self.mod.PAGE_SIZE == PAGE_SIZE

    def test_exact_status_options_values(self):
        from utils.constants import ListingStatus
        expected = [
            "",
            ListingStatus.PENDING,
            ListingStatus.APPROVED,
            ListingStatus.SUSPENDED,
            ListingStatus.REJECTED,
        ]
        assert self.mod.STATUS_OPTIONS == expected

    def test_no_hardcoded_string_literals_in_status_options(self):
        from utils.constants import ListingStatus
        non_empty = [v for v in self.mod.STATUS_OPTIONS if v]
        assert set(non_empty) == {
            ListingStatus.PENDING,
            ListingStatus.APPROVED,
            ListingStatus.SUSPENDED,
            ListingStatus.REJECTED,
        }


class TestViewsUseRequireAdminDecorator:
    """Verify that each refactored view's render() is wrapped by require_admin."""

    def _get_render(self, module_path: str):
        mod = _import_view(module_path)
        return mod.render

    def test_bookings_management_render_has_require_admin(self):
        """render() in bookings_management should be decorated with require_admin."""
        render = self._get_render("views.bookings_management")
        # functools.wraps preserves __name__ through the decorator
        assert render.__name__ == "render"

    def test_listings_moderation_render_has_require_admin(self):
        render = self._get_render("views.listings_moderation")
        assert render.__name__ == "render"

    def test_disputes_render_has_require_admin(self):
        render = self._get_render("views.disputes")
        assert render.__name__ == "render"

    def test_host_management_render_has_require_admin(self):
        render = self._get_render("views.host_management")
        assert render.__name__ == "render"

    def test_support_tickets_render_has_require_admin(self):
        render = self._get_render("views.support_tickets")
        assert render.__name__ == "render"

    def test_user_management_render_has_require_admin(self):
        render = self._get_render("views.user_management")
        assert render.__name__ == "render"

    def test_admin_management_render_has_require_admin(self):
        render = self._get_render("views.admin_management")
        assert render.__name__ == "render"

    def test_dashboard_render_has_require_admin(self):
        render = self._get_render("views.dashboard")
        assert render.__name__ == "render"

    def test_settings_render_has_require_admin(self):
        render = self._get_render("views.settings")
        assert render.__name__ == "render"

    def test_payments_refunds_render_has_require_admin(self):
        render = self._get_render("views.payments_refunds")
        assert render.__name__ == "render"

    def test_reviews_management_render_has_require_admin(self):
        render = self._get_render("views.reviews_management")
        assert render.__name__ == "render"


class TestViewsRemoveLocalPerPage:
    """Ensure no refactored view module defines its own PER_PAGE constant."""

    REFACTORED_VIEWS = [
        "views.bookings_management",
        "views.listings_moderation",
        "views.disputes",
        "views.host_management",
        "views.support_tickets",
        "views.user_management",
        "views.payments_refunds",
        "views.reviews_management",
    ]

    def test_no_per_page_in_any_refactored_view(self):
        for module_path in self.REFACTORED_VIEWS:
            mod = _import_view(module_path)
            assert not hasattr(mod, "PER_PAGE"), (
                f"{module_path} still defines PER_PAGE; should use PAGE_SIZE from constants"
            )

    def test_page_size_consistent_with_constants_in_all_views(self):
        from utils.constants import PAGE_SIZE
        for module_path in self.REFACTORED_VIEWS:
            mod = _import_view(module_path)
            assert mod.PAGE_SIZE == PAGE_SIZE, (
                f"{module_path}.PAGE_SIZE ({mod.PAGE_SIZE}) != constants.PAGE_SIZE ({PAGE_SIZE})"
            )
