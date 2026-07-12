export const STEP_DEFS = [
  { key: "basics", label: "Basics" },
  { key: "location", label: "Location" },
  { key: "capacity", label: "Capacity" },
  { key: "amenities", label: "Amenities" },
  { key: "rules", label: "House Rules" },
  { key: "photos", label: "Photos" },
  { key: "pricing", label: "Pricing" },
  { key: "cancellation", label: "Cancellation" },
  { key: "review", label: "Review" },
];

export function emptyPropertyDraft() {
  return {
    basics: {
      property_type: "",
      title: "",
      description: "",
      category: "",
    },
    location: {
      street: "",
      city: "",
      province: "",
      zip_code: "",
      country: "Philippines",
      lat: null,
      lng: null,
    },
    capacity: {
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
    },
    amenities: {
      selected: [],
      custom: [],
    },
    rules: {
      checkin_time: "14:00",
      checkout_time: "11:00",
      smoking: false,
      pets: false,
      parties: false,
      additional: "",
    },
    photos: {
      files: [], // { id, url, name }
      coverId: null,
    },
    pricing: {
      base_price: "",
      cleaning_fee: "",
      weekend_price: "",
      min_nights: 1,
      max_nights: 30,
    },
    cancellation: {
      policy: "moderate",
    },
  };
}

export function validateStep(stepKey, draft) {
  const errors = {};
  switch (stepKey) {
    case "basics": {
      const b = draft.basics;
      if (!b.property_type) errors.property_type = "Choose a property type.";
      if (!b.title || b.title.trim().length < 5) errors.title = "Title needs at least 5 characters.";
      if (!b.description || b.description.trim().length < 30)
        errors.description = "Add a bit more detail (at least 30 characters).";
      if (!b.category) errors.category = "Choose a category.";
      break;
    }
    case "location": {
      const l = draft.location;
      if (!l.street.trim()) errors.street = "Street address is required.";
      if (!l.city.trim()) errors.city = "City is required.";
      if (!l.province.trim()) errors.province = "Province is required.";
      if (!l.zip_code.trim()) errors.zip_code = "ZIP code is required.";
      break;
    }
    case "capacity": {
      const c = draft.capacity;
      if (c.max_guests < 1) errors.max_guests = "At least 1 guest.";
      break;
    }
    case "amenities":
      break;
    case "rules":
      if (!draft.rules.checkin_time) errors.checkin_time = "Set a check-in time.";
      if (!draft.rules.checkout_time) errors.checkout_time = "Set a check-out time.";
      break;
    case "photos":
      if (draft.photos.files.length < 5) errors.files = "Add at least 5 photos.";
      break;
    case "pricing": {
      const pr = draft.pricing;
      if (!pr.base_price || Number(pr.base_price) <= 0) errors.base_price = "Enter a nightly price.";
      if (Number(pr.min_nights) > Number(pr.max_nights)) errors.min_nights = "Minimum can't exceed maximum nights.";
      break;
    }
    case "cancellation":
      if (!draft.cancellation.policy) errors.policy = "Choose a cancellation policy.";
      break;
    default:
      break;
  }
  return errors;
}

export function validateAll(draft) {
  const result = {};
  for (const step of STEP_DEFS) {
    if (step.key === "review") continue;
    const errs = validateStep(step.key, draft);
    if (Object.keys(errs).length) result[step.key] = errs;
  }
  return result;
}
