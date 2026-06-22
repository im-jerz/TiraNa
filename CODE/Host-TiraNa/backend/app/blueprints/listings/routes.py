from flask import request
from sqlalchemy import or_, func

from app.blueprints.listings import listings_bp
from app.blueprints.listings.schemas import (
    ListingItemSchema,
    ListingDetailSchema,
)
from app.extensions import db
from app.models.property import Property, PropertyLocation
from app.utils.response import success_response, error_response


@listings_bp.route("", methods=["GET"])
def list_listings():
    location = request.args.get("location", "").strip()
    sort = request.args.get("sort", "")

    query = Property.query.filter_by(status="active")

    if location:
        like = f"%{location}%"
        query = (
            query.join(PropertyLocation, PropertyLocation.property_id == Property.id)
            .filter(
                or_(
                    PropertyLocation.city.ilike(like),
                    PropertyLocation.province.ilike(like),
                    PropertyLocation.street.ilike(like),
                )
            )
        )

    if sort == "price_asc":
        query = query.order_by(Property.base_price.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.base_price.desc())
    elif sort == "rating":
        query = query.order_by(Property.base_price.asc())
    else:
        query = query.order_by(Property.created_at.desc())

    properties = query.all()
    data = ListingItemSchema(many=True).dump(properties)
    return success_response(data={"properties": data})


@listings_bp.route("/stats", methods=["GET"])
def listings_stats():
    total_listings = Property.query.filter_by(status="active").count()

    total_guests = (
        db.session.query(func.coalesce(func.sum(Property.max_guests), 0))
        .filter(Property.status == "active")
        .scalar()
    )

    average_rating = 0.0
    total_reviews = 0

    return success_response(
        data={
            "total_listings": total_listings,
            "average_rating": average_rating,
            "total_reviews": total_reviews,
            "total_guests": total_guests,
        }
    )


@listings_bp.route("/locations", methods=["GET"])
def list_locations():
    rows = (
        db.session.query(PropertyLocation.city, PropertyLocation.province)
        .join(Property, PropertyLocation.property_id == Property.id)
        .filter(Property.status == "active")
        .distinct()
        .all()
    )
    seen = set()
    locations = []
    for city, province in rows:
        for name in [city, province]:
            if name and name.strip() and name.strip() not in seen:
                seen.add(name.strip())
                locations.append(name.strip())
    locations.sort()
    return success_response(data={"locations": locations})


@listings_bp.route("/featured", methods=["GET"])
def featured_listings():
    properties = (
        Property.query
        .filter_by(status="active")
        .order_by(Property.created_at.desc())
        .limit(6)
        .all()
    )
    data = ListingItemSchema(many=True).dump(properties)
    return success_response(data={"properties": data})


@listings_bp.route("/<int:property_id>", methods=["GET"])
def listing_detail(property_id):
    prop = Property.query.get(int(property_id))
    if prop is None or prop.status != "active":
        return error_response("Property not found.", status=404)

    return success_response(data={"property": ListingDetailSchema().dump(prop)})
