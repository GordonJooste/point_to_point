'use client';

import { useRouter } from 'next/navigation';
import { User, MapPin, Camera, Trophy, LogOut, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useWaypointCompletions } from '@/hooks/useWaypointCompletions';
import { useChallengeCompletions } from '@/hooks/useChallengeCompletions';
import { useWaypoints } from '@/hooks/useWaypoints';
import { useChallenges } from '@/hooks/useChallenges';

export default function ProfilePage() {
  const router = useRouter();
  const { user, activeRoute, logout } = useUser();
  const { entries, isLoading: leaderboardLoading } = useLeaderboard();
  const { completedIds: waypointCompletedIds } = useWaypointCompletions();
  const { completedIds: challengeCompletedIds } = useChallengeCompletions();
  const { waypoints } = useWaypoints();
  const { challenges } = useChallenges();

  // Find current user's rank
  const userEntry = entries.find((e) => e.user_id === user?.id);
  const rank = userEntry?.rank || '-';
  const score = userEntry?.score || 0;

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const waypointProgress = waypoints.length > 0
    ? Math.round((waypointCompletedIds.length / waypoints.length) * 100)
    : 0;

  const challengeProgress = challenges.length > 0
    ? Math.round((challengeCompletedIds.length / challenges.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-500 text-white p-6 pb-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1.5 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user?.username}</h2>
              <p className="text-gray-500 text-sm">
                Joined {new Date(user?.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center bg-primary-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-primary-600">#{rank}</div>
              <div className="text-xs text-gray-500">Rank</div>
            </div>
            <div className="text-center bg-primary-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-primary-600">{score}</div>
              <div className="text-xs text-gray-500">Points</div>
            </div>
            <div className="text-center bg-primary-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-primary-600">
                {waypointCompletedIds.length + challengeCompletedIds.length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            {/* Waypoints Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  Waypoints
                </div>
                <span className="text-sm text-gray-500">
                  {waypointCompletedIds.length}/{waypoints.length}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${waypointProgress}%` }}
                />
              </div>
            </div>

            {/* Challenges Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Camera className="w-4 h-4 text-primary-500" />
                  Challenges
                </div>
                <span className="text-sm text-gray-500">
                  {challengeCompletedIds.length}/{challenges.length}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${challengeProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Route Info */}
        {activeRoute && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-4">
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary-500" />
              Current Event
            </h3>
            <p className="font-medium text-gray-700">{activeRoute.name}</p>
            {activeRoute.description && (
              <p className="text-sm text-gray-500 mt-1">{activeRoute.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {new Date(activeRoute.start_date).toLocaleDateString()} -{' '}
              {new Date(activeRoute.end_date).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-4 mb-20">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary-500" />
            Leaderboard
          </h3>

          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No participants yet</p>
              <p className="text-sm">Be the first to score points!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isCurrentUser = user?.id === entry.user_id;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isCurrentUser
                        ? 'bg-primary-50 border border-primary-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 text-center font-bold text-lg">
                      {getRankEmoji(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isCurrentUser ? 'text-primary-700' : 'text-gray-800'
                        }`}
                      >
                        {entry.username}
                        {isCurrentUser && (
                          <span className="text-xs ml-1 text-primary-500">(you)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entry.waypoints_completed}
                        </span>
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {entry.challenges_completed}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary-600">{entry.score}</p>
                      <p className="text-xs text-gray-500">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
