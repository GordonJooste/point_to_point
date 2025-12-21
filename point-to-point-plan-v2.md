# Point to Point - Technical Architecture Plan (v2)

## Overview

**Point to Point** is a motorcycle adventure challenge app featuring real-time location tracking, proximity-based waypoint completion (15m accuracy), photo challenges, and a leaderboard system.

**Target:** 60-70 users over 2 weeks
**Cost:** $0-12 (all free tiers)
**Stack:** Next.js + Supabase + Google Maps (PWA)

---

## 1. Cost Summary

| Service | Cost |
|---------|------|
| Google Maps | $0 (under $200 free credit) |
| Supabase | $0 (free tier) |
| Vercel Hosting | $0 (free tier) |
| Domain (optional) | ~$12/year |
| **TOTAL** | **$0 - $12** |

---

## 2. Easy Setup via CSV Import

### The Workflow

```
1. Plan your route in Google Maps (get coordinates)
2. Fill in the Excel/CSV template
3. Upload CSV in the admin panel
4. Done! Waypoints and challenges appear in the app
```

### Getting Coordinates from Google Maps

**Method 1: Right-click**
1. Open Google Maps
2. Right-click on the location
3. Click the coordinates (e.g., "16.463700, 107.590900")
4. They're now copied to clipboard

**Method 2: Google My Maps (for many pins)**
1. Go to mymaps.google.com
2. Create a new map
3. Add all your pins
4. Export as KML → Convert to CSV online

---

## 3. CSV Templates

### 3.1 Waypoints Template (waypoints.csv)

These are the map pins that users need to physically visit.

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `name` | ✅ | Short name for the pin | "Bắc Sơn Viewpoint" |
| `description` | ✅ | What's here / instructions | "Amazing valley views. Look for the pagoda." |
| `latitude` | ✅ | GPS latitude (decimal) | 16.463700 |
| `longitude` | ✅ | GPS longitude (decimal) | 107.590900 |
| `points` | ✅ | Points awarded | 5 |
| `icon` | ❌ | Icon type (see list below) | "viewpoint" |
| `category` | ❌ | Grouping for filters | "scenic" |
| `directions_note` | ❌ | Extra directions help | "Turn left after the bridge" |

**Icon Options:**
- `checkpoint` - Standard checkpoint (default)
- `viewpoint` - Scenic viewpoint
- `food` - Restaurant/food stop
- `fuel` - Petrol station
- `accommodation` - Hotel/homestay
- `start` - Start point
- `finish` - Finish point
- `danger` - Caution point
- `photo` - Photo opportunity
- `water` - Water crossing

**Example waypoints.csv:**
```csv
name,description,latitude,longitude,points,icon,category,directions_note
Start Point - Hue,Meet at the parking lot by the river,16.463700,107.590900,0,start,checkpoint,
Bắc Sơn Viewpoint,Stunning valley views - worth the climb!,16.512300,107.543200,10,viewpoint,scenic,Take the dirt road on your left after km marker 45
Mama's Kitchen,Best bánh mì in the province,16.489100,107.561800,5,food,food,Look for the blue sign
River Crossing,Shallow crossing - be careful!,16.501200,107.532100,15,water,adventure,Only cross if water is below knee height
Finish - A Lưới,Congratulations! You made it!,16.478900,107.489200,0,finish,checkpoint,
```

---

### 3.2 Challenges Template (challenges.csv)

These are photo challenges users complete anywhere along the route.

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `title` | ✅ | Challenge name | "Mud Monster" |
| `description` | ✅ | What to do | "Get stuck in the mud with your bike" |
| `points` | ✅ | Points awarded | 2 |
| `category` | ❌ | Grouping | "adventure" |

**Example challenges.csv:**
```csv
title,description,points,category
Mud Monster,Get stuck in the mud with your bike (photo proof required!),2,adventure
Local Legend,Take a photo with a local person,2,social
Trẻ Trâu Style,Get a Vietnamese haircut at a local barber,3,social
Beer Cool,Keep your beer cold with a Namduro koozie (show us!),1,fun
Log Rider,Ride your bike over a fallen log,2,adventure
Field Worker,Help locals harvest in the fields,3,social
Good Samaritan,Give someone who ran out of petrol some of yours,2,social
Taxi Service,Give a local person a lift on your bike,2,social
Picnic Time,Have a BBQ lunch plate somewhere scenic,2,food
Trash Hero,Pick up trash along the route and dispose properly,2,eco
Influencer Mode,Model your Namduro gear somewhere photogenic,1,fun
Best Dressed Bike,Buy a friend a ridiculous accessory for their bike,2,fun
```

---

### 3.3 Route Template (route.csv)

Basic info about the event/route.

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `name` | ✅ | Event name | "Central Carnage 2025" |
| `description` | ❌ | Event description | "Epic 3-day adventure..." |
| `start_date` | ✅ | Event start | 2025-01-15 |
| `end_date` | ✅ | Event end | 2025-01-17 |

**Example route.csv:**
```csv
name,description,start_date,end_date
Central Carnage 2025,Epic 3-day motorcycle adventure through central Vietnam,2025-01-15,2025-01-17
```

---

## 4. Admin Panel Features

Simple admin page (password protected) to manage everything:

### 4.1 Import Section
```
┌─────────────────────────────────────────────┐
│  📍 Import Waypoints                        │
│  [Choose File] waypoints.csv                │
│  [Preview] [Import]                         │
│                                             │
│  ✅ 12 waypoints ready to import            │
├─────────────────────────────────────────────┤
│  🏆 Import Challenges                       │
│  [Choose File] challenges.csv               │
│  [Preview] [Import]                         │
│                                             │
│  ✅ 10 challenges ready to import           │
├─────────────────────────────────────────────┤
│  🗺️ Import Route Info                       │
│  [Choose File] route.csv                    │
│  [Preview] [Import]                         │
└─────────────────────────────────────────────┘
```

### 4.2 Management Section
```
┌─────────────────────────────────────────────┐
│  Current Route: Central Carnage 2025        │
│  Status: Active                             │
│  Users: 67 registered                       │
│  Waypoints: 12                              │
│  Challenges: 10                             │
├─────────────────────────────────────────────┤
│  Quick Actions:                             │
│  [View All Waypoints] [View All Challenges] │
│  [Export Leaderboard] [Reset All Progress]  │
│  [Download All Photos]                      │
└─────────────────────────────────────────────┘
```

---

## 5. Updated Database Schema

```sql
-- Enable PostGIS for geospatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- =====================
-- ROUTES/EVENTS
-- =====================
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- WAYPOINTS (imported from CSV)
-- =====================
CREATE TABLE waypoints (
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

CREATE INDEX idx_waypoints_location ON waypoints USING GIST(location);
CREATE INDEX idx_waypoints_route ON waypoints(route_id);

-- =====================
-- CHALLENGES (imported from CSV)
-- =====================
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 1,
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- USERS
-- =====================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    avatar_url TEXT
);

-- =====================
-- ROUTE PARTICIPANTS
-- =====================
CREATE TABLE route_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, route_id)
);

-- =====================
-- WAYPOINT COMPLETIONS
-- =====================
CREATE TABLE waypoint_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    waypoint_id UUID REFERENCES waypoints(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    completion_lat DECIMAL(10, 7),
    completion_lng DECIMAL(10, 7),
    UNIQUE(user_id, waypoint_id)
);

-- =====================
-- CHALLENGE COMPLETIONS (with photos)
-- =====================
CREATE TABLE challenge_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- =====================
-- LIVE LOCATIONS
-- =====================
CREATE TABLE live_locations (
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

CREATE INDEX idx_live_locations ON live_locations USING GIST(location);

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
$$ LANGUAGE plpgsql;

-- =====================
-- LEADERBOARD VIEW
-- =====================
CREATE VIEW leaderboard AS
SELECT 
    u.id as user_id,
    u.username,
    rp.route_id,
    rp.score,
    RANK() OVER (PARTITION BY rp.route_id ORDER BY rp.score DESC) as rank,
    (SELECT COUNT(*) FROM waypoint_completions wc WHERE wc.user_id = u.id AND wc.route_id = rp.route_id) as waypoints_completed,
    (SELECT COUNT(*) FROM challenge_completions cc WHERE cc.user_id = u.id AND cc.route_id = rp.route_id) as challenges_completed
FROM users u
JOIN route_participants rp ON u.id = rp.user_id;
```

---

## 6. CSV Import Logic

```typescript
// lib/csvImport.ts
import Papa from 'papaparse';
import { supabase } from './supabase';

interface WaypointRow {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  points: string;
  icon?: string;
  category?: string;
  directions_note?: string;
}

interface ChallengeRow {
  title: string;
  description: string;
  points: string;
  category?: string;
}

export async function importWaypoints(file: File, routeId: string) {
  return new Promise((resolve, reject) => {
    Papa.parse<WaypointRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const waypoints = results.data.map((row, index) => ({
          route_id: routeId,
          name: row.name.trim(),
          description: row.description?.trim() || '',
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),
          points: parseInt(row.points) || 1,
          icon: row.icon?.trim() || 'checkpoint',
          category: row.category?.trim() || null,
          directions_note: row.directions_note?.trim() || null,
          sort_order: index
        }));

        // Validate
        const errors = validateWaypoints(waypoints);
        if (errors.length > 0) {
          reject({ errors });
          return;
        }

        // Insert
        const { data, error } = await supabase
          .from('waypoints')
          .insert(waypoints)
          .select();

        if (error) reject(error);
        else resolve({ count: data.length, waypoints: data });
      },
      error: (err) => reject(err)
    });
  });
}

export async function importChallenges(file: File, routeId: string) {
  return new Promise((resolve, reject) => {
    Papa.parse<ChallengeRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const challenges = results.data.map((row, index) => ({
          route_id: routeId,
          title: row.title.trim(),
          description: row.description?.trim() || '',
          points: parseInt(row.points) || 1,
          category: row.category?.trim() || null,
          sort_order: index
        }));

        const { data, error } = await supabase
          .from('challenges')
          .insert(challenges)
          .select();

        if (error) reject(error);
        else resolve({ count: data.length, challenges: data });
      },
      error: (err) => reject(err)
    });
  });
}

function validateWaypoints(waypoints: any[]) {
  const errors: string[] = [];
  
  waypoints.forEach((wp, i) => {
    const row = i + 2; // Account for header row
    if (!wp.name) errors.push(`Row ${row}: Missing name`);
    if (!wp.latitude || isNaN(wp.latitude)) errors.push(`Row ${row}: Invalid latitude`);
    if (!wp.longitude || isNaN(wp.longitude)) errors.push(`Row ${row}: Invalid longitude`);
    if (wp.latitude < -90 || wp.latitude > 90) errors.push(`Row ${row}: Latitude out of range`);
    if (wp.longitude < -180 || wp.longitude > 180) errors.push(`Row ${row}: Longitude out of range`);
  });
  
  return errors;
}
```

---

## 7. Application Structure

```
point-to-point/
├── app/
│   ├── page.tsx                 # Map screen (main)
│   ├── challenges/page.tsx      # Challenge list
│   ├── pics/page.tsx            # Photo gallery
│   ├── profile/page.tsx         # User profile
│   ├── admin/                   # Admin section
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── import/page.tsx      # CSV import
│   │   └── layout.tsx           # Password protection
│   └── layout.tsx               # Root layout
│
├── components/
│   ├── Map/
│   │   ├── GoogleMapContainer.tsx
│   │   ├── WaypointMarker.tsx
│   │   ├── UserMarker.tsx
│   │   ├── WaypointPopup.tsx
│   │   └── Leaderboard.tsx
│   ├── Challenges/
│   │   ├── ChallengeCard.tsx
│   │   ├── ChallengeList.tsx
│   │   └── PhotoCapture.tsx
│   ├── Gallery/
│   │   ├── PhotoGrid.tsx
│   │   └── PhotoCard.tsx
│   ├── Admin/
│   │   ├── CSVImporter.tsx
│   │   ├── ImportPreview.tsx
│   │   └── DataManager.tsx
│   └── UI/
│       ├── BottomNav.tsx
│       ├── Button.tsx
│       └── Modal.tsx
│
├── lib/
│   ├── supabase.ts
│   ├── csvImport.ts
│   └── googleMaps.ts
│
├── hooks/
│   ├── useLocation.ts
│   ├── useLiveLocations.ts
│   ├── useWaypoints.ts
│   └── useLeaderboard.ts
│
├── templates/                   # Downloadable CSV templates
│   ├── waypoints-template.csv
│   ├── challenges-template.csv
│   └── route-template.csv
│
└── public/
    ├── manifest.json
    └── icons/
```

---

## 8. User Flow

### For Admin (You)
```
1. Create route in admin panel (name, dates)
2. Download CSV templates
3. Fill in waypoints in Excel/Google Sheets
4. Fill in challenges in Excel/Google Sheets
5. Upload CSVs in admin panel
6. Preview and confirm import
7. Share app link with participants
```

### For Participants
```
1. Open app link on phone
2. Enter unique username
3. See map with all waypoints
4. Navigate to waypoints (Google Maps directions)
5. When within 15m, tap "Complete" button
6. View challenges, take photos to complete
7. See leaderboard and compete!
```

---

## 9. Development Phases

### Phase 1: Setup & Core (Week 1)
- [x] Plan architecture
- [ ] Set up Next.js + Supabase + Google Maps
- [ ] Create database schema
- [ ] Build username registration
- [ ] Basic map display

### Phase 2: CSV Import & Admin (Week 2)
- [ ] CSV import functionality
- [ ] Admin panel (password protected)
- [ ] Import preview and validation
- [ ] Template downloads

### Phase 3: Map Features (Week 3)
- [ ] Waypoint markers with popups
- [ ] Google Maps directions integration
- [ ] GPS location tracking
- [ ] Proximity detection (15m)
- [ ] Waypoint completion

### Phase 4: Challenges & Gallery (Week 4)
- [ ] Challenge list UI
- [ ] Photo capture
- [ ] Photo upload
- [ ] Gallery view

### Phase 5: Real-time & Polish (Week 5)
- [ ] Live location sharing
- [ ] Leaderboard
- [ ] PWA setup
- [ ] Testing & bug fixes

### Phase 6: Launch
- [ ] Final testing with small group
- [ ] Deploy to production
- [ ] Import real waypoints/challenges
- [ ] Go live! 🚀

---

## 10. CSV Template Downloads

The admin panel will provide downloadable templates:

**waypoints-template.csv**
```csv
name,description,latitude,longitude,points,icon,category,directions_note
Example Point,Description of this location,16.463700,107.590900,5,checkpoint,scenic,Turn left at the big tree
```

**challenges-template.csv**
```csv
title,description,points,category
Example Challenge,What the user needs to do to complete this,2,adventure
```

**route-template.csv**
```csv
name,description,start_date,end_date
My Route Name,Description of the event,2025-01-15,2025-01-17
```

---

## 11. Quick Reference

### Proximity
- **Detection radius:** 15 meters
- **GPS accuracy setting:** High accuracy mode

### Points System
- Waypoints: Variable (set in CSV)
- Challenges: Variable (set in CSV)
- Score = Sum of all completed waypoints + challenges

### Icon Types
`checkpoint`, `viewpoint`, `food`, `fuel`, `accommodation`, `start`, `finish`, `danger`, `photo`, `water`

### Required CSV Columns
- **Waypoints:** name, description, latitude, longitude, points
- **Challenges:** title, description, points
- **Route:** name, start_date, end_date

---

## Summary

**Setup is easy:**
1. Fill in Excel/Google Sheets
2. Export as CSV
3. Upload in admin panel
4. Done!

**Tech stack:** Next.js + Supabase + Google Maps
**Cost:** $0 (free tiers cover everything)
**Build time:** ~5 weeks

Ready to start building?
