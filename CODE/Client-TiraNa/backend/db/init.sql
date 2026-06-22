CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username STRING NOT NULL UNIQUE,
  email STRING NOT NULL UNIQUE,
  password STRING NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS personal_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  first_name STRING DEFAULT '',
  middle_name STRING DEFAULT '',
  last_name STRING DEFAULT '',
  phone_number STRING DEFAULT '',
  language STRING DEFAULT 'en',
  bio STRING DEFAULT '',
  avatar_url STRING DEFAULT '',
  id_verified BOOLEAN DEFAULT false,
  id_front_url STRING DEFAULT '',
  id_back_url STRING DEFAULT '',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES client_users(id),
  email STRING NOT NULL,
  code STRING NOT NULL,
  type STRING NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user_type_created
  ON verification_codes (user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_codes_cleanup
  ON verification_codes (used, expires_at, created_at);

ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS first_name STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS middle_name STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS last_name STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS phone_number STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS language STRING DEFAULT 'en';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS bio STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS avatar_url STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS id_front_url STRING DEFAULT '';
ALTER TABLE personal_information ADD COLUMN IF NOT EXISTS id_back_url STRING DEFAULT '';

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES client_users(id) ON DELETE SET NULL,
  receiver_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  type STRING NOT NULL,
  title STRING NOT NULL,
  message STRING NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_receiver
  ON notifications (receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (receiver_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  property_id STRING NOT NULL,
  check_in TIMESTAMP NOT NULL,
  check_out TIMESTAMP NOT NULL,
  adults INT NOT NULL DEFAULT 1,
  children INT NOT NULL DEFAULT 0,
  infants INT NOT NULL DEFAULT 0,
  total_price DECIMAL NOT NULL,
  payment_method STRING NOT NULL,
  status STRING NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user
  ON bookings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_property_status
  ON bookings (property_id, status, user_id);



CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  property_id STRING NOT NULL,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT now(),
  accuracy INT DEFAULT NULL,
  check_in INT DEFAULT NULL,
  cleanliness INT DEFAULT NULL,
  communication INT DEFAULT NULL,
  location INT DEFAULT NULL,
  value INT DEFAULT NULL,
  UNIQUE (booking_id),
  INDEX idx_reviews_property (property_id, created_at DESC),
  INDEX idx_reviews_user (user_id, created_at DESC)
);
