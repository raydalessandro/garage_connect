-- ============================================
-- GARAGE CONNECT - SUPABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. WORKSHOPS (Officine)
-- ============================================

CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Info base
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  
  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1976D2',
  secondary_color VARCHAR(7) DEFAULT '#424242',
  
  -- Contact
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  website TEXT,
  
  -- Subscription
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  customer_limit INTEGER DEFAULT 20,
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_workshops_slug ON workshops(slug);
CREATE INDEX idx_workshops_active ON workshops(active);

-- ============================================
-- 2. CUSTOMERS (Motociclisti)
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  
  -- Auth (managed by Supabase Auth)
  auth_user_id UUID UNIQUE,
  email VARCHAR(255) NOT NULL,
  
  -- Profile
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- Bike info
  bike_brand VARCHAR(100),
  bike_model VARCHAR(100),
  bike_year INTEGER,
  plate_number VARCHAR(50),
  current_km INTEGER DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workshop_id, email)
);

-- Indexes
CREATE INDEX idx_customers_workshop ON customers(workshop_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_auth ON customers(auth_user_id);

-- ============================================
-- 3. TRIPS (Viaggi)
-- ============================================

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  
  -- Trip data
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  distance FLOAT NOT NULL,
  duration FLOAT,
  notes TEXT,
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_customer ON trips(customer_id);
CREATE INDEX idx_trips_workshop ON trips(workshop_id);
CREATE INDEX idx_trips_date ON trips(start_date DESC);
CREATE INDEX idx_trips_shared ON trips(is_shared) WHERE is_shared = true;

-- ============================================
-- 4. TRIP_PHOTOS (Foto viaggi)
-- ============================================

CREATE TABLE trip_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  photo_url TEXT NOT NULL,
  caption TEXT,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_trip_photos_trip ON trip_photos(trip_id);

-- ============================================
-- 5. MAINTENANCE (Manutenzioni)
-- ============================================

CREATE TABLE maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  
  -- Service data
  date DATE NOT NULL,
  km INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('service', 'oil', 'tires', 'brakes', 'chain', 'battery', 'other')),
  description TEXT,
  cost FLOAT,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES customers(id),
  
  -- Reminders
  next_service_km INTEGER,
  next_service_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maintenance_customer ON maintenance(customer_id);
CREATE INDEX idx_maintenance_workshop ON maintenance(workshop_id);
CREATE INDEX idx_maintenance_date ON maintenance(date DESC);

-- ============================================
-- 6. RESTAURANTS (Database condiviso)
-- ============================================

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  added_by UUID REFERENCES customers(id),
  
  -- Restaurant data
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('pizza', 'traditional', 'quick', 'gourmet', 'bar', 'other')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Geo
  lat FLOAT,
  lng FLOAT,
  
  notes TEXT,
  
  -- Community
  likes_count INTEGER DEFAULT 0,
  visited_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_restaurants_workshop ON restaurants(workshop_id);
CREATE INDEX idx_restaurants_type ON restaurants(type);
CREATE INDEX idx_restaurants_rating ON restaurants(rating DESC);

-- ============================================
-- 7. COMMUNITY_POSTS (Feed sociale)
-- ============================================

CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Post data
  type VARCHAR(50) CHECK (type IN ('trip_share', 'photo', 'question', 'event')),
  content TEXT,
  media_url TEXT,
  
  -- If trip share
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_posts_workshop ON community_posts(workshop_id);
CREATE INDEX idx_posts_customer ON community_posts(customer_id);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);

-- ============================================
-- 8. COMMENTS (Commenti)
-- ============================================

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_created ON comments(created_at ASC);

-- ============================================
-- 9. LIKES (Mi piace)
-- ============================================

CREATE TABLE likes (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type VARCHAR(20) CHECK (target_type IN ('trip', 'post', 'restaurant', 'comment')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (customer_id, target_id, target_type)
);

-- Index
CREATE INDEX idx_likes_target ON likes(target_id, target_type);

-- ============================================
-- 10. APPOINTMENTS (Appuntamenti)
-- ============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Appointment data
  date DATE NOT NULL,
  time TIME NOT NULL,
  service_type VARCHAR(100),
  notes TEXT,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_workshop ON appointments(workshop_id);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_date ON appointments(date, time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - CUSTOMERS
-- ============================================

-- Customers can read their workshop data
CREATE POLICY "Customers read own workshop"
ON customers FOR SELECT
USING (
  auth_user_id = auth.uid()
  OR
  workshop_id IN (
    SELECT workshop_id FROM customers WHERE auth_user_id = auth.uid()
  )
);

-- Customers can update their own profile
CREATE POLICY "Customers update own profile"
ON customers FOR UPDATE
USING (auth_user_id = auth.uid());

-- ============================================
-- RLS POLICIES - TRIPS
-- ============================================

-- Customers see their own trips + shared trips from workshop
CREATE POLICY "Customers access trips"
ON trips FOR SELECT
USING (
  customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  OR
  (
    is_shared = true
    AND workshop_id IN (SELECT workshop_id FROM customers WHERE auth_user_id = auth.uid())
  )
);

-- Customers insert own trips
CREATE POLICY "Customers insert own trips"
ON trips FOR INSERT
WITH CHECK (customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- Customers update own trips
CREATE POLICY "Customers update own trips"
ON trips FOR UPDATE
USING (customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- Customers delete own trips
CREATE POLICY "Customers delete own trips"
ON trips FOR DELETE
USING (customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- ============================================
-- RLS POLICIES - MAINTENANCE
-- ============================================

CREATE POLICY "Customers access own maintenance"
ON maintenance FOR SELECT
USING (customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

CREATE POLICY "Customers insert own maintenance"
ON maintenance FOR INSERT
WITH CHECK (customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- ============================================
-- RLS POLICIES - RESTAURANTS
-- ============================================

CREATE POLICY "Customers access workshop restaurants"
ON restaurants FOR SELECT
USING (
  workshop_id IN (SELECT workshop_id FROM customers WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Customers insert restaurants"
ON restaurants FOR INSERT
WITH CHECK (
  added_by = (SELECT id FROM customers WHERE auth_user_id = auth.uid())
);

-- ============================================
-- RLS POLICIES - COMMUNITY POSTS
-- ============================================

CREATE POLICY "Customers access workshop posts"
ON community_posts FOR SELECT
USING (
  workshop_id IN (SELECT workshop_id FROM customers WHERE auth_user_id = auth.uid())
);

CREATE POLICY "Customers insert posts"
ON community_posts FOR INSERT
WITH CHECK (
  customer_id = (SELECT id FROM customers WHERE auth_user_id = auth.uid())
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update likes_count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'trip' THEN
      UPDATE trips SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'post' THEN
      UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'restaurant' THEN
      UPDATE restaurants SET likes_count = likes_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'trip' THEN
      UPDATE trips SET likes_count = likes_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'post' THEN
      UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'restaurant' THEN
      UPDATE restaurants SET likes_count = likes_count - 1 WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert demo workshop
INSERT INTO workshops (name, slug, owner_email, logo_url, primary_color, secondary_color, address, city, phone, email, website, plan)
VALUES (
  'Aroni Moto',
  'aroni-moto',
  'info@aronimoto.it',
  'https://www.aronimoto.it/images/logo.png',
  '#E30613',
  '#1A1A1A',
  'Via Example 123',
  'Città',
  '+39 123 456 7890',
  'info@aronimoto.it',
  'https://www.aronimoto.it',
  'pro'
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets (run this in Supabase dashboard)
-- 1. Create bucket: 'avatars' (public)
-- 2. Create bucket: 'trip-photos' (public)
-- 3. Create bucket: 'workshop-logos' (public)

-- Storage policies will be added via Supabase dashboard

-- ============================================
-- DONE!
-- ============================================

-- Your database is ready!
-- Next steps:
-- 1. Copy Supabase URL and anon key
-- 2. Add to .env.local in both apps
-- 3. Start developing!
