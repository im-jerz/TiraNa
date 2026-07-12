"""
ORM models for PROPERTIES, PROPERTY_LOCATIONS, PROPERTY_RULES,
AMENITIES, PROPERTY_AMENITIES, PROPERTY_IMAGES, and
AVAILABILITY_CALENDAR.

Matches Section 2.2 ("Properties & Listings") of host_dashboard_design.md,
and verified column-for-column against host_database_schema.sql (the
actual Oracle DDL). AVAILABILITY_CALENDAR is modeled here so the table
exists once db.create_all() runs, but no blueprint reads/writes it yet —
that's booking/availability logic for a later phase.
"""

from datetime import datetime
from app.extensions import db


class Property(db.Model):
    __tablename__ = "PROPERTIES"

    PROPERTY_TYPES = ("entire_place", "private_room", "shared_room")
    STATUSES = ("active", "inactive", "suspended")
    CANCELLATION_POLICIES = ("flexible", "moderate", "strict")

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    host_id = db.Column(db.Integer, db.ForeignKey("HOSTS.id", ondelete="CASCADE"), nullable=False, index=True)

    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    property_type = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50))
    status = db.Column(db.String(30), nullable=False, default="active")

    max_guests = db.Column(db.Integer, nullable=False, default=1)
    bedrooms = db.Column(db.Integer, default=0)
    beds = db.Column(db.Integer, default=0)
    bathrooms = db.Column(db.Numeric(3, 1), default=0)

    base_price = db.Column(db.Numeric(10, 2), nullable=False)
    cleaning_fee = db.Column(db.Numeric(10, 2), default=0)
    min_nights = db.Column(db.Integer, default=1)
    max_nights = db.Column(db.Integer)

    cancellation_policy = db.Column(db.String(20), nullable=False, default="flexible")
    instant_book = db.Column(db.Integer, default=0)  # 0/1

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    host = db.relationship("Host", backref=db.backref("properties", cascade="all, delete-orphan"))
    location = db.relationship(
        "PropertyLocation", backref="property", uselist=False, cascade="all, delete-orphan"
    )
    rules = db.relationship("PropertyRule", backref="property", cascade="all, delete-orphan")
    images = db.relationship(
        "PropertyImage", backref="property", cascade="all, delete-orphan",
        order_by="PropertyImage.display_order",
    )
    amenity_links = db.relationship(
        "PropertyAmenity", backref="property", cascade="all, delete-orphan"
    )
    availability = db.relationship(
        "AvailabilityCalendar", backref="property", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Property {self.title} ({self.status})>"


class PropertyLocation(db.Model):
    __tablename__ = "PROPERTY_LOCATIONS"

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("PROPERTIES.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )
    street = db.Column(db.String(255))
    city = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100))
    zip_code = db.Column(db.String(20))
    country = db.Column(db.String(100), default="Philippines")
    latitude = db.Column(db.Numeric(10, 6))
    longitude = db.Column(db.Numeric(10, 6))

    def __repr__(self):
        return f"<PropertyLocation {self.city}, {self.province}>"


class PropertyRule(db.Model):
    __tablename__ = "PROPERTY_RULES"

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("PROPERTIES.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rule_key = db.Column(db.String(50), nullable=False)
    rule_value = db.Column(db.String(255), nullable=False)

    __table_args__ = (db.UniqueConstraint("property_id", "rule_key", name="uq_property_rule"),)

    def __repr__(self):
        return f"<PropertyRule {self.rule_key}={self.rule_value}>"


class Amenity(db.Model):
    __tablename__ = "AMENITIES"

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    icon = db.Column(db.String(50))

    def __repr__(self):
        return f"<Amenity {self.name}>"


class PropertyAmenity(db.Model):
    __tablename__ = "PROPERTY_AMENITIES"

    property_id = db.Column(db.Integer, db.ForeignKey("PROPERTIES.id", ondelete="CASCADE"), primary_key=True)
    amenity_id = db.Column(db.Integer, db.ForeignKey("AMENITIES.id", ondelete="CASCADE"), primary_key=True)

    amenity = db.relationship("Amenity")

    def __repr__(self):
        return f"<PropertyAmenity property={self.property_id} amenity={self.amenity_id}>"


class PropertyImage(db.Model):
    __tablename__ = "PROPERTY_IMAGES"

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    property_id = db.Column(
        db.Integer, db.ForeignKey("PROPERTIES.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_url = db.Column(db.String(500), nullable=False)
    display_order = db.Column(db.Integer, default=0)
    is_cover = db.Column(db.Integer, default=0)  # 0/1
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<PropertyImage {self.image_url} (cover={bool(self.is_cover)})>"


class AvailabilityCalendar(db.Model):
    """
    One row per date per property — present in host_database_schema.sql
    (Section 2.2) but not yet wired to a blueprint. Defined here so
    db.create_all() / the .sql-based setup stay in sync; the
    availability/booking-blocking logic itself is a later phase.
    """

    __tablename__ = "AVAILABILITY_CALENDAR"

    STATUSES = ("available", "booked", "blocked")

    id = db.Column(db.Integer, db.Identity(), primary_key=True)
    property_id = db.Column(db.Integer, db.ForeignKey("PROPERTIES.id", ondelete="CASCADE"), nullable=False)
    date_value = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default="available")
    block_reason = db.Column(db.String(100))
    min_nights_override = db.Column(db.Integer)
    price_override = db.Column(db.Numeric(10, 2))

    __table_args__ = (
        db.UniqueConstraint("property_id", "date_value", name="uq_property_date"),
    )

    def __repr__(self):
        return f"<AvailabilityCalendar property={self.property_id} {self.date_value} {self.status}>"
