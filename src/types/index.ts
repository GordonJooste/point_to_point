// User types
export interface User {
  id: string;
  username: string;
  created_at: string;
  avatar_url?: string;
}

// Route/Event types
export interface Route {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

// Waypoint types
export type WaypointIcon =
  | 'checkpoint'
  | 'viewpoint'
  | 'food'
  | 'fuel'
  | 'accommodation'
  | 'start'
  | 'finish'
  | 'danger'
  | 'photo'
  | 'water';

export interface Waypoint {
  id: string;
  route_id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  points: number;
  icon: WaypointIcon;
  category?: string;
  directions_note?: string;
  sort_order: number;
  created_at: string;
}

// Challenge types
export interface Challenge {
  id: string;
  route_id: string;
  title: string;
  description?: string;
  points: number;
  category?: string;
  sort_order: number;
  created_at: string;
}

// Completion types
export interface WaypointCompletion {
  id: string;
  user_id: string;
  waypoint_id: string;
  route_id: string;
  completed_at: string;
  completion_lat?: number;
  completion_lng?: number;
}

export interface ChallengeCompletion {
  id: string;
  user_id: string;
  challenge_id: string;
  route_id: string;
  photo_url: string;
  completed_at: string;
  // Joined data
  user?: User;
  challenge?: Challenge;
}

// Leaderboard types
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  route_id: string;
  score: number;
  rank: number;
  waypoints_completed: number;
  challenges_completed: number;
}

// Live location types
export interface LiveLocation {
  user_id: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updated_at: string;
  // Joined data (partial user for display)
  user?: Pick<User, 'id' | 'username'>;
}

// API response types
export interface CompletionResult {
  success: boolean;
  error?: string;
  points_earned?: number;
  waypoint_name?: string;
  challenge_title?: string;
  distance?: number;
  required?: number;
}

// Geolocation types
export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  isTracking: boolean;
}
