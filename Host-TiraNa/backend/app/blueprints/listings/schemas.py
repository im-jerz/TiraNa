from flask import request
from marshmallow import Schema, fields

from app.models.property import Property


def _resolve_url(path):
    if not path:
        return ""
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = request.host_url.rstrip("/")
    return f"{base}{path}"

PROPERTY_TYPE_LABELS = {
    "entire_place": "Entire place",
    "private_room": "Private room",
    "shared_room": "Shared room",
}


class HostProfileSchema(Schema):
    id = fields.Integer()
    name = fields.Method("get_name")
    avatar = fields.Method("get_avatar")
    joined = fields.Method("get_joined")
    bio = fields.Method("get_bio")
    isSuperhost = fields.Method("is_superhost")
    listingsCount = fields.Method("get_listings_count")

    def get_name(self, obj):
        profile = obj.profile
        return profile.full_name if profile else "Host"

    def get_avatar(self, obj):
        profile = obj.profile
        return _resolve_url(profile.avatar_url) if profile and profile.avatar_url else ""

    def get_joined(self, obj):
        return str(obj.created_at.year) if obj.created_at else "2024"

    def get_bio(self, obj):
        profile = obj.profile
        return profile.bio if profile and profile.bio else ""

    def is_superhost(self, obj):
        profile = obj.profile
        return bool(profile and profile.is_superhost)

    def get_listings_count(self, obj):
        return Property.query.filter_by(host_id=obj.id, status="active").count()


class ListingItemSchema(Schema):
    id = fields.Integer(attribute="id")
    title = fields.String()
    name = fields.Method("get_name")
    location = fields.Method("get_location")
    price = fields.Float(attribute="base_price")
    rating = fields.Method("get_rating")
    reviews = fields.Method("get_review_count")
    reviewsCount = fields.Method("get_review_count")
    superhost = fields.Method("is_superhost")
    hostId = fields.Method("get_host_id")
    image = fields.Method("get_cover_photo")
    type = fields.Method("get_type_label")
    guests = fields.Integer(attribute="max_guests")

    def get_name(self, obj):
        return obj.title

    def get_location(self, obj):
        if obj.location:
            parts = [p for p in [obj.location.city, obj.location.province] if p]
            return ", ".join(parts)
        return ""

    def get_rating(self, obj):
        return 0.0

    def get_review_count(self, obj):
        return 0

    def is_superhost(self, obj):
        profile = obj.host.profile if obj.host else None
        return bool(profile and profile.is_superhost)

    def get_host_id(self, obj):
        return obj.host.id if obj.host else None

    def get_cover_photo(self, obj):
        cover = next((img for img in obj.images if img.is_cover), None)
        url = cover.image_url if cover else (obj.images[0].image_url if obj.images else None)
        return _resolve_url(url)

    def get_type_label(self, obj):
        return PROPERTY_TYPE_LABELS.get(
            obj.property_type,
            obj.property_type.replace("_", " ").title() if obj.property_type else "",
        )


class ListingDetailSchema(ListingItemSchema):
    bedrooms = fields.Integer()
    beds = fields.Integer()
    baths = fields.Float(attribute="bathrooms")
    description = fields.String()
    cleaningFee = fields.Float(attribute="cleaning_fee")
    serviceFee = fields.Method("get_service_fee")
    images = fields.Method("get_images")
    amenities = fields.Method("get_amenity_names")
    host = fields.Method("get_host_info")
    reviews = fields.Method("get_reviews")
    ratingBreakdown = fields.Method("get_rating_breakdown")
    highlights = fields.Method("get_highlights")

    cancellation_policy = fields.String()
    min_nights = fields.Integer()
    max_nights = fields.Integer()

    def get_service_fee(self, obj):
        return 0.0

    def get_images(self, obj):
        ordered = sorted(obj.images, key=lambda img: img.display_order)
        return [_resolve_url(img.image_url) for img in ordered]

    def get_amenity_names(self, obj):
        return [
            link.amenity.name
            for link in obj.amenity_links
            if not link.amenity.name.startswith("custom:")
        ]

    def get_host_info(self, obj):
        profile = obj.host.profile if obj.host else None
        return {
            "id": obj.host.id if obj.host else None,
            "name": profile.full_name if profile else "Host",
            "avatar": _resolve_url(profile.avatar_url) if profile and profile.avatar_url else "",
            "joined": str(obj.host.created_at.year) if obj.host and obj.host.created_at else "2024",
            "bio": profile.bio if profile and profile.bio else "",
            "isSuperhost": bool(profile and profile.is_superhost),
        }

    def get_reviews(self, obj):
        return []

    def get_highlights(self, obj):
        labels = {
            "entire_place": "Entire place",
            "private_room": "Private room",
            "shared_room": "Shared room",
        }
        return {
            "guests": obj.max_guests,
            "bedrooms": obj.bedrooms,
            "beds": obj.beds,
            "baths": float(obj.bathrooms) if obj.bathrooms else 0,
            "type": labels.get(obj.property_type, obj.property_type.replace("_", " ").title()),
        }

    def get_rating_breakdown(self, obj):
        return {
            "cleanliness": 0,
            "accuracy": 0,
            "communication": 0,
            "location": 0,
            "checkIn": 0,
            "value": 0,
        }
