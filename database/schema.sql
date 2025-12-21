-- Point to Point Database Schema
-- Run this in the Supabase SQL Editor

-- =====================
-- Enable PostGIS Extension (required for geospatial features)
-- =====================
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================
-- ROUTES/EVENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- WAYPOINTS TABLE (imported from CSV)
-- =====================
CREATE TABLE IF NOT EXISTS waypoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    points INTEGER DEFAULT 1,
    icon VARCHAR(50) DEFAULT 'checkpoint',
    category VARCHAR(50),
    directions_note TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waypoints_location ON waypoints USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_waypoints_route ON waypoints(route_id);

-- =====================
-- CHALLENGES TABLE (imported from CSV)
-- =====================
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 1,
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_route ON challenges(route_id);

-- =====================
-- USERS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    avatar_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =====================
-- ROUTE PARTICIPANTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS route_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, route_id)
);

CREATE INDEX IF NOT EXISTS idx_route_participants_user ON route_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_route_participants_route ON route_participants(route_id);

-- =====================
-- WAYPOINT COMPLETIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS waypoint_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    waypoint_id UUID REFERENCES waypoints(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    completion_lat DECIMAL(10, 7),
    completion_lng DECIMAL(10, 7),
    UNIQUE(user_id, waypoint_id)
);

CREATE INDEX IF NOT EXISTS idx_waypoint_completions_user ON waypoint_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_waypoint_completions_waypoint ON waypoint_completions(waypoint_id);

-- =====================
-- CHALLENGE COMPLETIONS TABLE (with photos)
-- =====================
CREATE TABLE IF NOT EXISTS challenge_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_challenge_completions_user ON challenge_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_completions_challenge ON challenge_completions(challenge_id);

-- =====================
-- LIVE LOCATIONS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS live_locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    heading FLOAT,
    speed FLOAT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_locations ON live_locations USING GIST(location);

-- =====================
-- PROXIMITY CHECK FUNCTION (15 meters)
-- =====================
CREATE OR REPLACE FUNCTION complete_waypoint(
    p_user_id UUID,
    p_waypoint_id UUID,
    p_user_lat DECIMAL,
    p_user_lng DECIMAL
)
RETURNS JSONB AS $$
DECLARE
    v_distance FLOAT;
    v_route_id UUID;
    v_points INTEGER;
    v_waypoint_name VARCHAR;
BEGIN
    -- Calculate distance
    SELECT
        ST_Distance(
            ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
            location
        ),
        route_id,
        points,
        name
    INTO v_distance, v_route_id, v_points, v_waypoint_name
    FROM waypoints
    WHERE id = p_waypoint_id;

    -- Check if waypoint exists
    IF v_route_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Waypoint not found'
        );
    END IF;

    -- Check 15 meter radius
    IF v_distance > 15 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Too far from waypoint',
            'distance', round(v_distance::numeric, 1),
            'required', 15
        );
    END IF;

    -- Record completion
    INSERT INTO waypoint_completions (user_id, waypoint_id, route_id, completion_lat, completion_lng)
    VALUES (p_user_id, p_waypoint_id, v_route_id, p_user_lat, p_user_lng);

    -- Update score
    UPDATE route_participants
    SET score = score + v_points
    WHERE user_id = p_user_id AND route_id = v_route_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_earned', v_points,
        'waypoint_name', v_waypoint_name,
        'distance', round(v_distance::numeric, 1)
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- CHALLENGE COMPLETION FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION complete_challenge(
    p_user_id UUID,
    p_challenge_id UUID,
    p_photo_url TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_route_id UUID;
    v_points INTEGER;
    v_title VARCHAR;
BEGIN
    -- Get challenge info
    SELECT route_id, points, title
    INTO v_route_id, v_points, v_title
    FROM challenges
    WHERE id = p_challenge_id;

    -- Check if challenge exists
    IF v_route_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Challenge not found'
        );
    END IF;

    -- Record completion
    INSERT INTO challenge_completions (user_id, challenge_id, route_id, photo_url)
    VALUES (p_user_id, p_challenge_id, v_route_id, p_photo_url);

    -- Update score
    UPDATE route_participants
    SET score = score + v_points
    WHERE user_id = p_user_id AND route_id = v_route_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_earned', v_points,
        'challenge_title', v_title
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already completed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- UPDATE LIVE LOCATION FUNCTION (upsert)
-- =====================
CREATE OR REPLACE FUNCTION update_live_location(
    p_user_id UUID,
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_heading FLOAT DEFAULT NULL,
    p_speed FLOAT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO live_locations (user_id, latitude, longitude, heading, speed, updated_at)
    VALUES (p_user_id, p_lat, p_lng, p_heading, p_speed, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
        latitude = p_lat,
        longitude = p_lng,
        heading = p_heading,
        speed = p_speed,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- LEADERBOARD VIEW
-- =====================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    u.id as user_id,
    u.username,
    u.avatar_url,
    rp.route_id,
    rp.score,
    RANK() OVER (PARTITION BY rp.route_id ORDER BY rp.score DESC) as rank,
    (SELECT COUNT(*) FROM waypoint_completions wc WHERE wc.user_id = u.id AND wc.route_id = rp.route_id) as waypoints_completed,
    (SELECT COUNT(*) FROM challenge_completions cc WHERE cc.user_id = u.id AND cc.route_id = rp.route_id) as challenges_completed
FROM users u
JOIN route_participants rp ON u.id = rp.user_id;

-- =====================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE waypoint_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_locations ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, anyone can register (insert)
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);
CREATE POLICY "Anyone can register" ON users
    FOR INSERT WITH CHECK (true);

-- Routes: Anyone can read active routes
CREATE POLICY "Active routes are viewable" ON routes
    FOR SELECT USING (is_active = true);

-- Waypoints: Anyone can read waypoints for active routes
CREATE POLICY "Waypoints viewable for active routes" ON waypoints
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM routes WHERE routes.id = waypoints.route_id AND routes.is_active = true)
    );

-- Challenges: Anyone can read challenges for active routes
CREATE POLICY "Challenges viewable for active routes" ON challenges
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM routes WHERE routes.id = challenges.route_id AND routes.is_active = true)
    );

-- Route participants: Anyone can read, anyone can join
CREATE POLICY "Participants viewable by all" ON route_participants
    FOR SELECT USING (true);
CREATE POLICY "Anyone can join routes" ON route_participants
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own participation" ON route_participants
    FOR UPDATE USING (true);

-- Waypoint completions: Anyone can read, anyone can complete
CREATE POLICY "Completions viewable by all" ON waypoint_completions
    FOR SELECT USING (true);
CREATE POLICY "Anyone can complete waypoints" ON waypoint_completions
    FOR INSERT WITH CHECK (true);

-- Challenge completions: Anyone can read, anyone can complete
CREATE POLICY "Challenge completions viewable by all" ON challenge_completions
    FOR SELECT USING (true);
CREATE POLICY "Anyone can complete challenges" ON challenge_completions
    FOR INSERT WITH CHECK (true);

-- Live locations: Anyone can read, anyone can update
CREATE POLICY "Live locations viewable by all" ON live_locations
    FOR SELECT USING (true);
CREATE POLICY "Anyone can update location" ON live_locations
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own location" ON live_locations
    FOR UPDATE USING (true);

-- =====================
-- STORAGE BUCKET POLICIES (run after creating bucket)
-- =====================
-- Note: Create the 'challenge-photos' bucket in Supabase Storage first
-- Then run these policies:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('challenge-photos', 'challenge-photos', true);

-- CREATE POLICY "Challenge photos are publicly viewable"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'challenge-photos');

-- CREATE POLICY "Anyone can upload challenge photos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'challenge-photos');

-- =====================
-- SAMPLE DATA (Optional - for testing)
-- =====================

-- Insert a sample route
-- INSERT INTO routes (name, description, start_date, end_date, is_active)
-- VALUES ('Central Carnage 2025', 'Epic 3-day motorcycle adventure through central Vietnam', '2025-01-15', '2025-01-17', true);
