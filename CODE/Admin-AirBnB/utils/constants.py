PAGE_SIZE = 20

class TicketStatus:
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

class DisputeStatus:
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class BookingStatus:
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    PENDING = "pending"

class ListingStatus:
    PENDING = "pending"
    APPROVED = "approved"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class UserStatus:
    ACTIVE = "active"
    BANNED = "banned"

class HostStatus:
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"

class TicketPriority:
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class PaymentStatus:
    COMPLETED = "completed"
    REFUNDED = "refunded"
    FAILED = "failed"
