"""
ORM model for REVIEWS and BOOKINGS (client-side tables).

These tables live in the same Oracle DB but store guest/client data.
Reviews are tied to bookings (one review per booking) and to a property
owned by the host.

Schema mirrors the SQL sent in the project spec:
  reviews (id, booking_id, user_id, property_id, rating, review_text,
           accuracy, check_in, cleanliness, communication, location,
           value, created_at)
  bookings (id, user_id, property_id, check_in, check_out, adults,
            children, infants, total_price, payment_method, status,
            created_at)
  client_users (id, username, email, ...)
  personal_information (id, user_id, first_name, last_name, avatar_url, ...)
"""

from datetime import datetime
from app.extensions import db


class ClientUser(db.Model):
    """Guest/client users — read-only from the host dashboard."""

    __tablename__ = "CLIENT_USERS"

    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    personal_info = db.relationship(
        "ClientPersonalInfo", backref="user", uselist=False
    )

    def __repr__(self):
        return f"<ClientUser {self.email}>"


class ClientPersonalInfo(db.Model):
    """personal_information table — stores guest display name + avatar."""

    __tablename__ = "PERSONAL_INFORMATION"

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey("CLIENT_USERS.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    first_name = db.Column(db.String(100), default="")
    last_name = db.Column(db.String(100), default="")
    avatar_url = db.Column(db.String(500), default="")

    def full_name(self):
        parts = [self.first_name or "", self.last_name or ""]
        name = " ".join(p for p in parts if p).strip()
        return name or None

    def __repr__(self):
        return f"<ClientPersonalInfo {self.user_id}>"


class Booking(db.Model):
    """bookings table — one booking per guest per property stay."""

    __tablename__ = "BOOKINGS"

    STATUSES = (
        "pending", "confirmed", "completed",
        "cancelled", "refund_requested", "refund_completed",
    )

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(
        db.String(36), db.ForeignKey("CLIENT_USERS.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id = db.Column(db.String(100), nullable=False)
    check_in = db.Column(db.DateTime, nullable=False)
    check_out = db.Column(db.DateTime, nullable=False)
    adults = db.Column(db.Integer, default=1)
    children = db.Column(db.Integer, default=0)
    infants = db.Column(db.Integer, default=0)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(30), nullable=False, default="pending")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    guest = db.relationship("ClientUser", foreign_keys=[user_id])
    review = db.relationship(
        "Review", backref="booking", uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Booking {self.id[:8]} status={self.status}>"


class Review(db.Model):
    """reviews table — one review per completed booking."""

    __tablename__ = "REVIEWS"

    id = db.Column(db.String(36), primary_key=True)
    booking_id = db.Column(
        db.String(36), db.ForeignKey("BOOKINGS.id", ondelete="CASCADE"),
        nullable=False, unique=True,
    )
    user_id = db.Column(
        db.String(36), db.ForeignKey("CLIENT_USERS.id", ondelete="CASCADE"),
        nullable=False,
    )
    property_id = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Numeric(3, 1), nullable=False)
    review_text = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Subcategory ratings (1-5 int, nullable)
    accuracy = db.Column(db.Integer)
    check_in = db.Column(db.Integer)
    cleanliness = db.Column(db.Integer)
    communication = db.Column(db.Integer)
    location = db.Column(db.Integer)
    value = db.Column(db.Integer)

    guest = db.relationship("ClientUser", foreign_keys=[user_id])

    def __repr__(self):
        return f"<Review {self.id[:8]} rating={self.rating}>"