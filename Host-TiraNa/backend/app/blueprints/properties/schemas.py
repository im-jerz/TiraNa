"""
Marshmallow request/response schemas for the Properties blueprint.

Input schemas mirror the frontend's draft shape exactly
(frontend/src/pages/properties/propertyDraft.js emptyPropertyDraft()),
since AddEditProperty.jsx submits one JSON `payload` field shaped like:

    {
      "basics": {...}, "location": {...}, "capacity": {...},
      "amenities": {...}, "rules": {...}, "pricing": {...},
      "cancellation_policy": "moderate"
    }

Output schemas mirror frontend/src/data/mockProperties.js so swapping
USE_MOCK to false on the frontend requires no shape changes there.
"""

from marshmallow import Schema, fields, validates, validates_schema, pre_load, ValidationError

PROPERTY_TYPES = ("entire_place", "private_room", "shared_room")
STATUSES = ("active", "inactive", "suspended")
CANCELLATION_POLICIES = ("flexible", "moderate", "strict")
TOGGLEABLE_STATUSES = ("active", "inactive")


class BasicsInputSchema(Schema):
    property_type = fields.String(required=True)
    title = fields.String(required=True)
    description = fields.String(required=True)
    category = fields.String(required=True)

    @validates("property_type")
    def validate_property_type(self, value, **kwargs):
        if value not in PROPERTY_TYPES:
            raise ValidationError(f"Must be one of: {', '.join(PROPERTY_TYPES)}.")

    @validates("title")
    def validate_title(self, value, **kwargs):
        if len(value.strip()) < 5:
            raise ValidationError("Title needs at least 5 characters.")

    @validates("description")
    def validate_description(self, value, **kwargs):
        if len(value.strip()) < 30:
            raise ValidationError("Description needs at least 30 characters.")


class LocationInputSchema(Schema):
    street = fields.String(required=True)
    city = fields.String(required=True)
    province = fields.String(required=True)
    zip_code = fields.String(required=True)
    country = fields.String(load_default="Philippines")
    lat = fields.Float(allow_none=True, load_default=None)
    lng = fields.Float(allow_none=True, load_default=None)

    @validates("street")
    def validate_street(self, value, **kwargs):
        if not value.strip():
            raise ValidationError("Street address is required.")

    @validates("city")
    def validate_city(self, value, **kwargs):
        if not value.strip():
            raise ValidationError("City is required.")


class CapacityInputSchema(Schema):
    max_guests = fields.Integer(required=True)
    bedrooms = fields.Integer(load_default=0)
    beds = fields.Integer(load_default=1)
    bathrooms = fields.Float(load_default=1)

    @validates("max_guests")
    def validate_max_guests(self, value, **kwargs):
        if value < 1:
            raise ValidationError("At least 1 guest is required.")


class AmenitiesInputSchema(Schema):
    selected = fields.List(fields.String(), load_default=list)
    custom = fields.List(fields.String(), load_default=list)


class RulesInputSchema(Schema):
    checkin_time = fields.String(required=True)
    checkout_time = fields.String(required=True)
    smoking = fields.Boolean(load_default=False)
    pets = fields.Boolean(load_default=False)
    parties = fields.Boolean(load_default=False)
    additional = fields.String(load_default="")


class PricingInputSchema(Schema):
    base_price = fields.Float(required=True)
    cleaning_fee = fields.Float(load_default=0)
    weekend_price = fields.Float(allow_none=True, load_default=None)
    min_nights = fields.Integer(load_default=1)
    max_nights = fields.Integer(load_default=30)

    @pre_load
    def blank_optional_numbers_to_default(self, data, **kwargs):
        """
        The frontend's pricing inputs are controlled text fields that
        default to "" when left blank (see propertyDraft.js's
        emptyPropertyDraft() and StepPricing.jsx). marshmallow's Float
        field rejects "" outright ("Not a valid number."), so an
        untouched optional field would fail validation even though
        the host did nothing wrong. Treat "" the same as "omitted" for
        every optional numeric field here before type coercion runs.
        """
        data = dict(data)
        for key in ("cleaning_fee", "weekend_price", "min_nights", "max_nights"):
            if data.get(key) == "":
                data.pop(key)
        return data

    @validates("base_price")
    def validate_base_price(self, value, **kwargs):
        if value <= 0:
            raise ValidationError("Enter a nightly price greater than 0.")

    @validates_schema
    def validate_nights_range(self, data, **kwargs):
        if data.get("min_nights", 1) > data.get("max_nights", 30):
            raise ValidationError("Minimum nights can't exceed maximum nights.", field_name="min_nights")


class PropertyPayloadSchema(Schema):
    """The full `payload` JSON field submitted alongside multipart photos."""

    basics = fields.Nested(BasicsInputSchema, required=True)
    location = fields.Nested(LocationInputSchema, required=True)
    capacity = fields.Nested(CapacityInputSchema, required=True)
    amenities = fields.Nested(AmenitiesInputSchema, load_default=dict)
    rules = fields.Nested(RulesInputSchema, required=True)
    pricing = fields.Nested(PricingInputSchema, required=True)
    cancellation_policy = fields.String(required=True)

    @validates("cancellation_policy")
    def validate_cancellation_policy(self, value, **kwargs):
        if value not in CANCELLATION_POLICIES:
            raise ValidationError(f"Must be one of: {', '.join(CANCELLATION_POLICIES)}.")


class StatusUpdateSchema(Schema):
    status = fields.String(required=True)

    @validates("status")
    def validate_status(self, value, **kwargs):
        if value not in TOGGLEABLE_STATUSES:
            raise ValidationError(f"Status must be one of: {', '.join(TOGGLEABLE_STATUSES)}.")


class AddressOutputSchema(Schema):
    street = fields.String()
    city = fields.String()
    province = fields.String()
    zip_code = fields.String()
    country = fields.String()
    lat = fields.Float(attribute="latitude", allow_none=True)
    lng = fields.Float(attribute="longitude", allow_none=True)


class PropertyListItemSchema(Schema):
    """Shape used by GET /api/host/properties — matches mockProperties.js."""

    property_id = fields.Integer(attribute="id")
    title = fields.String()
    property_type = fields.String()
    category = fields.String()
    status = fields.String()
    base_price = fields.Float()
    cleaning_fee = fields.Float()
    cancellation_policy = fields.String()
    bedrooms = fields.Integer()
    beds = fields.Integer()
    bathrooms = fields.Float()
    max_guests = fields.Integer()
    address = fields.Method("get_address")
    cover_photo = fields.Method("get_cover_photo")
    rating_avg = fields.Float(allow_none=True)
    review_count = fields.Integer()
    upcoming_bookings = fields.Integer()
    created_at = fields.Function(lambda obj: obj.created_at.strftime("%Y-%m-%d") if obj.created_at else None)

    def get_address(self, obj):
        if obj.location:
            return {"city": obj.location.city, "province": obj.location.province}
        return {"city": "", "province": ""}

    def get_cover_photo(self, obj):
        cover = next((img for img in obj.images if img.is_cover), None)
        if cover:
            return cover.image_url
        return obj.images[0].image_url if obj.images else None


class PropertyDetailSchema(PropertyListItemSchema):
    """Shape used by GET /api/host/properties/:id — adds full edit-form data."""

    description = fields.String()
    min_nights = fields.Integer()
    max_nights = fields.Integer()
    address = fields.Method("get_full_address")
    photos = fields.Method("get_photos")
    amenities = fields.Method("get_amenities")
    rules = fields.Method("get_rules")

    def get_full_address(self, obj):
        if obj.location:
            return {
                "street": obj.location.street or "",
                "city": obj.location.city,
                "province": obj.location.province or "",
                "zip_code": obj.location.zip_code or "",
                "country": obj.location.country or "Philippines",
                "lat": float(obj.location.latitude) if obj.location.latitude is not None else None,
                "lng": float(obj.location.longitude) if obj.location.longitude is not None else None,
            }
        return {"street": "", "city": "", "province": "", "zip_code": "", "country": "Philippines"}

    def get_photos(self, obj):
        ordered = sorted(obj.images, key=lambda img: img.display_order)
        return [
            {"id": img.id, "url": img.image_url, "is_cover": bool(img.is_cover)}
            for img in ordered
        ]

    def get_amenities(self, obj):
        selected = [link.amenity.name for link in obj.amenity_links if not link.amenity.name.startswith("custom:")]
        custom = [
            link.amenity.name.split("custom:", 1)[1]
            for link in obj.amenity_links
            if link.amenity.name.startswith("custom:")
        ]
        return {"selected": selected, "custom": custom}

    def get_rules(self, obj):
        rules = {r.rule_key: r.rule_value for r in obj.rules}
        return {
            "checkin_time": rules.get("checkin_time", "14:00"),
            "checkout_time": rules.get("checkout_time", "11:00"),
            "smoking": rules.get("smoking") == "true",
            "pets": rules.get("pets") == "true",
            "parties": rules.get("parties") == "true",
            "additional": rules.get("additional", ""),
            "weekend_price": rules.get("weekend_price"),
        }
