'use client';

import { X, Trophy, MapPin, Camera, Loader2 } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUser } from '@/contexts/UserContext';

interface Props {
  onClose: () => void;
}

export default function LeaderboardPanel({ onClose }: Props) {
  const { entries, isLoading } = useLeaderboard();
  const { user } = useUser();

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-bold">Leaderboard</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
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
                        <span className="text-xs ml-1 text-primary-500">
                          (you)
                        </span>
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
                    <p className="font-bold text-lg text-primary-600">
                      {entry.score}
                    </p>
                    <p className="text-xs text-gray-500">pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
