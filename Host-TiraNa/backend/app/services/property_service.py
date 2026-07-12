"""
Business logic for the Properties blueprint.

Routes stay thin — they validate input via Marshmallow schemas,
delegate to these service functions, and translate results into
HTTP responses via app.utils.response. Mirrors the pattern used by
app/services/auth_service.py.
"""

from app.extensions import db
from app.models.property import (
    Property,
    PropertyLocation,
    PropertyRule,
    Amenity,
    PropertyAmenity,
    PropertyImage,
)
from app.services.upload_service import save_property_photo, delete_property_photo, cleanup_property_folder


class PropertyError(Exception):
    """Raised for expected property-flow failures (not found, not owned, etc.)."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status

def _get_owned_property(property_id: int, host_id: int) -> Property:
    prop = Property.query.get(int(property_id))
    if prop is None:
        raise PropertyError("Property not found.", status=404)
    if prop.host_id != host_id:
        raise PropertyError("You don't have access to this property.", status=403)
    return prop


def _get_or_create_amenity(name: str) -> Amenity:
    amenity = Amenity.query.filter_by(name=name).first()
    if amenity is None:
        amenity = Amenity(name=name)
        db.session.add(amenity)
        db.session.flush()
    return amenity


def _sync_amenities(prop: Property, amenities_data: dict) -> None:
    PropertyAmenity.query.filter_by(property_id=prop.id).delete()

    names = list(amenities_data.get("selected", []))
    names += [f"custom:{c}" for c in amenities_data.get("custom", [])]

    for name in names:
        amenity = _get_or_create_amenity(name)
        db.session.add(PropertyAmenity(property_id=prop.id, amenity_id=amenity.id))


def _sync_rules(prop: Property, rules_data: dict, weekend_price=None) -> None:
    PropertyRule.query.filter_by(property_id=prop.id).delete()

    rule_rows = {
        "checkin_time": rules_data.get("checkin_time", "14:00"),
        "checkout_time": rules_data.get("checkout_time", "11:00"),
        "smoking": "true" if rules_data.get("smoking") else "false",
        "pets": "true" if rules_data.get("pets") else "false",
        "parties": "true" if rules_data.get("parties") else "false",
    }
    if rules_data.get("additional"):
        rule_rows["additional"] = rules_data["additional"]
    if weekend_price is not None:
        rule_rows["weekend_price"] = str(weekend_price)

    for key, value in rule_rows.items():
        db.session.add(PropertyRule(property_id=prop.id, rule_key=key, rule_value=value))


def _save_photos(prop: Property, photo_files: list) -> None:
    """Appends newly uploaded photos after any already on the property."""
    if not photo_files:
        return
    start_order = len(prop.images)
    for idx, file_storage in enumerate(photo_files):
        url = save_property_photo(file_storage, prop.id)
        is_cover = 1 if (start_order + idx == 0) else 0
        db.session.add(
            PropertyImage(
                property_id=prop.id,
                image_url=url,
                display_order=start_order + idx,
                is_cover=is_cover,
            )
        )

def list_properties(host_id: int, status_filter: str = None, sort: str = "recent"):
    query = Property.query.filter_by(host_id=host_id)

    if status_filter and status_filter != "all":
        query = query.filter_by(status=status_filter)

    if sort == "price_high":
        query = query.order_by(Property.base_price.desc())
    elif sort == "price_low":
        query = query.order_by(Property.base_price.asc())
    else:
        query = query.order_by(Property.created_at.desc())

    return query.all()


def get_property_detail(property_id: int, host_id: int) -> Property:
    return _get_owned_property(property_id, host_id)

def create_property(host_id: int, payload: dict, photo_files: list) -> Property:
    if len(photo_files) < 5:
        raise PropertyError("Add at least 5 photos.", status=422)
    if len(photo_files) > 20:
        raise PropertyError("Maximum of 20 photos allowed.", status=422)

    basics = payload["basics"]
    location = payload["location"]
    capacity = payload["capacity"]
    pricing = payload["pricing"]

    prop = Property(
        host_id=host_id,
        title=basics["title"],
        description=basics["description"],
        property_type=basics["property_type"],
        category=basics["category"],
        status="active",
        max_guests=capacity["max_guests"],
        bedrooms=capacity.get("bedrooms", 0),
        beds=capacity.get("beds", 1),
        bathrooms=capacity.get("bathrooms", 1),
        base_price=pricing["base_price"],
        cleaning_fee=pricing.get("cleaning_fee", 0),
        min_nights=pricing.get("min_nights", 1),
        max_nights=pricing.get("max_nights", 30),
        cancellation_policy=payload["cancellation_policy"],
    )
    db.session.add(prop)
    db.session.flush()

    db.session.add(
        PropertyLocation(
            property_id=prop.id,
            street=location["street"],
            city=location["city"],
            province=location["province"],
            zip_code=location["zip_code"],
            country=location.get("country", "Philippines"),
            latitude=location.get("lat"),
            longitude=location.get("lng"),
        )
    )

    _sync_amenities(prop, payload.get("amenities", {}))
    _sync_rules(prop, payload["rules"], weekend_price=pricing.get("weekend_price"))
    _save_photos(prop, photo_files)

    db.session.commit()
    return prop


def update_property(property_id: int, host_id: int, payload: dict, photo_files: list) -> Property:
    prop = _get_owned_property(property_id, host_id)

    basics = payload["basics"]
    location = payload["location"]
    capacity = payload["capacity"]
    pricing = payload["pricing"]

    prop.title = basics["title"]
    prop.description = basics["description"]
    prop.property_type = basics["property_type"]
    prop.category = basics["category"]
    prop.max_guests = capacity["max_guests"]
    prop.bedrooms = capacity.get("bedrooms", 0)
    prop.beds = capacity.get("beds", 1)
    prop.bathrooms = capacity.get("bathrooms", 1)
    prop.base_price = pricing["base_price"]
    prop.cleaning_fee = pricing.get("cleaning_fee", 0)
    prop.min_nights = pricing.get("min_nights", 1)
    prop.max_nights = pricing.get("max_nights", 30)
    prop.cancellation_policy = payload["cancellation_policy"]

    if prop.location:
        loc = prop.location
        loc.street = location["street"]
        loc.city = location["city"]
        loc.province = location["province"]
        loc.zip_code = location["zip_code"]
        loc.country = location.get("country", "Philippines")
        loc.latitude = location.get("lat")
        loc.longitude = location.get("lng")
    else:
        db.session.add(
            PropertyLocation(
                property_id=prop.id,
                street=location["street"],
                city=location["city"],
                province=location["province"],
                zip_code=location["zip_code"],
                country=location.get("country", "Philippines"),
                latitude=location.get("lat"),
                longitude=location.get("lng"),
            )
        )

    _sync_amenities(prop, payload.get("amenities", {}))
    _sync_rules(prop, payload["rules"], weekend_price=pricing.get("weekend_price"))

    _save_photos(prop, photo_files)

    db.session.commit()
    return prop

def set_property_status(property_id: int, host_id: int, new_status: str) -> Property:
    prop = _get_owned_property(property_id, host_id)

    if prop.status not in ("active", "inactive"):
        raise PropertyError(
            f"Cannot change status while listing is '{prop.status}'.", status=409
        )

    prop.status = new_status
    db.session.commit()
    return prop


def delete_property(property_id: int, host_id: int) -> None:
    prop = _get_owned_property(property_id, host_id)

    photo_urls = [img.image_url for img in prop.images]

    db.session.delete(prop)
    db.session.commit()

    for url in photo_urls:
        delete_property_photo(url)
    cleanup_property_folder(property_id)
