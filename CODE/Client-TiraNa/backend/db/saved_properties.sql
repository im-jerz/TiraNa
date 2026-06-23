CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES client_users(id) ON DELETE CASCADE,
  property_id STRING NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user
  ON saved_properties (user_id, created_at DESC);
