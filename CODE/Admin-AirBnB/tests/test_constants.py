"""
Tests for utils/constants.py

Covers the PAGE_SIZE constant and all status/priority/payment constant classes
introduced in this PR.
"""
import pytest

from utils.constants import (
    PAGE_SIZE,
    TicketStatus,
    DisputeStatus,
    BookingStatus,
    ListingStatus,
    UserStatus,
    HostStatus,
    TicketPriority,
    PaymentStatus,
)


class TestPageSize:
    def test_page_size_value(self):
        assert PAGE_SIZE == 20

    def test_page_size_is_positive_integer(self):
        assert isinstance(PAGE_SIZE, int)
        assert PAGE_SIZE > 0

    def test_page_size_suitable_for_pagination(self):
        # Verify it produces sane pagination math
        total = 45
        total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        assert total_pages == 3

    def test_page_size_exact_multiple(self):
        # When total is exactly PAGE_SIZE, exactly 1 page is needed
        total = PAGE_SIZE
        total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        assert total_pages == 1

    def test_page_size_single_item(self):
        # A single item should yield 1 page
        total = 1
        total_pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
        assert total_pages == 1


class TestTicketStatus:
    def test_open(self):
        assert TicketStatus.OPEN == "open"

    def test_in_progress(self):
        assert TicketStatus.IN_PROGRESS == "in_progress"

    def test_resolved(self):
        assert TicketStatus.RESOLVED == "resolved"

    def test_all_values_are_strings(self):
        for val in (TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED]
        assert len(values) == len(set(values))

    def test_no_extra_attributes_are_functions(self):
        # Ensure status attributes are plain strings, not callables
        assert not callable(TicketStatus.OPEN)


class TestDisputeStatus:
    def test_open(self):
        assert DisputeStatus.OPEN == "open"

    def test_investigating(self):
        assert DisputeStatus.INVESTIGATING == "investigating"

    def test_resolved(self):
        assert DisputeStatus.RESOLVED == "resolved"

    def test_dismissed(self):
        assert DisputeStatus.DISMISSED == "dismissed"

    def test_all_values_are_strings(self):
        for val in (
            DisputeStatus.OPEN,
            DisputeStatus.INVESTIGATING,
            DisputeStatus.RESOLVED,
            DisputeStatus.DISMISSED,
        ):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [
            DisputeStatus.OPEN,
            DisputeStatus.INVESTIGATING,
            DisputeStatus.RESOLVED,
            DisputeStatus.DISMISSED,
        ]
        assert len(values) == len(set(values))


class TestBookingStatus:
    def test_confirmed(self):
        assert BookingStatus.CONFIRMED == "confirmed"

    def test_completed(self):
        assert BookingStatus.COMPLETED == "completed"

    def test_cancelled(self):
        assert BookingStatus.CANCELLED == "cancelled"

    def test_pending(self):
        assert BookingStatus.PENDING == "pending"

    def test_all_values_are_strings(self):
        for val in (
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.PENDING,
        ):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [
            BookingStatus.CONFIRMED,
            BookingStatus.COMPLETED,
            BookingStatus.CANCELLED,
            BookingStatus.PENDING,
        ]
        assert len(values) == len(set(values))


class TestListingStatus:
    def test_pending(self):
        assert ListingStatus.PENDING == "pending"

    def test_approved(self):
        assert ListingStatus.APPROVED == "approved"

    def test_suspended(self):
        assert ListingStatus.SUSPENDED == "suspended"

    def test_rejected(self):
        assert ListingStatus.REJECTED == "rejected"

    def test_all_values_are_strings(self):
        for val in (
            ListingStatus.PENDING,
            ListingStatus.APPROVED,
            ListingStatus.SUSPENDED,
            ListingStatus.REJECTED,
        ):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [
            ListingStatus.PENDING,
            ListingStatus.APPROVED,
            ListingStatus.SUSPENDED,
            ListingStatus.REJECTED,
        ]
        assert len(values) == len(set(values))


class TestUserStatus:
    def test_active(self):
        assert UserStatus.ACTIVE == "active"

    def test_banned(self):
        assert UserStatus.BANNED == "banned"

    def test_values_are_strings(self):
        assert isinstance(UserStatus.ACTIVE, str)
        assert isinstance(UserStatus.BANNED, str)

    def test_values_are_unique(self):
        assert UserStatus.ACTIVE != UserStatus.BANNED


class TestHostStatus:
    def test_active(self):
        assert HostStatus.ACTIVE == "active"

    def test_suspended(self):
        assert HostStatus.SUSPENDED == "suspended"

    def test_pending(self):
        assert HostStatus.PENDING == "pending"

    def test_all_values_are_strings(self):
        for val in (HostStatus.ACTIVE, HostStatus.SUSPENDED, HostStatus.PENDING):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [HostStatus.ACTIVE, HostStatus.SUSPENDED, HostStatus.PENDING]
        assert len(values) == len(set(values))


class TestTicketPriority:
    def test_urgent(self):
        assert TicketPriority.URGENT == "urgent"

    def test_high(self):
        assert TicketPriority.HIGH == "high"

    def test_medium(self):
        assert TicketPriority.MEDIUM == "medium"

    def test_low(self):
        assert TicketPriority.LOW == "low"

    def test_all_values_are_strings(self):
        for val in (
            TicketPriority.URGENT,
            TicketPriority.HIGH,
            TicketPriority.MEDIUM,
            TicketPriority.LOW,
        ):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [
            TicketPriority.URGENT,
            TicketPriority.HIGH,
            TicketPriority.MEDIUM,
            TicketPriority.LOW,
        ]
        assert len(values) == len(set(values))

    def test_priority_ordering_by_name(self):
        # Verify the four priority levels exist and are all different
        priorities = {TicketPriority.URGENT, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW}
        assert len(priorities) == 4


class TestPaymentStatus:
    def test_completed(self):
        assert PaymentStatus.COMPLETED == "completed"

    def test_refunded(self):
        assert PaymentStatus.REFUNDED == "refunded"

    def test_failed(self):
        assert PaymentStatus.FAILED == "failed"

    def test_all_values_are_strings(self):
        for val in (PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.FAILED):
            assert isinstance(val, str)

    def test_values_are_unique(self):
        values = [PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.FAILED]
        assert len(values) == len(set(values))


class TestCrossModuleConsistency:
    """Verify shared status strings that appear in multiple classes are consistent."""

    def test_open_status_consistent_across_ticket_and_dispute(self):
        assert TicketStatus.OPEN == DisputeStatus.OPEN == "open"

    def test_resolved_status_consistent_across_ticket_and_dispute(self):
        assert TicketStatus.RESOLVED == DisputeStatus.RESOLVED == "resolved"

    def test_pending_status_shared_by_booking_listing_host(self):
        assert BookingStatus.PENDING == ListingStatus.PENDING == HostStatus.PENDING == "pending"

    def test_active_status_shared_by_user_and_host(self):
        assert UserStatus.ACTIVE == HostStatus.ACTIVE == "active"

    def test_completed_status_shared_by_booking_and_payment(self):
        assert BookingStatus.COMPLETED == PaymentStatus.COMPLETED == "completed"