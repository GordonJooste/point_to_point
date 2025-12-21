'use client';

import { useState } from 'react';
import { Trophy, Loader2, Filter } from 'lucide-react';
import { useChallenges } from '@/hooks/useChallenges';
import { useChallengeCompletions } from '@/hooks/useChallengeCompletions';
import { useUser } from '@/contexts/UserContext';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import PhotoCapture from '@/components/challenges/PhotoCapture';
import { uploadChallengePhoto } from '@/lib/storage/photos';
import { Challenge } from '@/types';
import toast from 'react-hot-toast';

export default function ChallengesPage() {
  const { user } = useUser();
  const { challenges, isLoading } = useChallenges();
  const { completedIds, completeChallenge } = useChallengeCompletions();

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Get unique categories
  const categories = [...new Set(challenges.map((c) => c.category).filter(Boolean))];

  // Filter challenges
  const filteredChallenges = challenges.filter((challenge) => {
    const isCompleted = completedIds.includes(challenge.id);
    if (filter === 'pending') return !isCompleted;
    if (filter === 'completed') return isCompleted;
    return true;
  });

  const handlePhotoCapture = async (file: File) => {
    if (!selectedChallenge || !user) return;

    setIsUploading(true);

    // Upload photo
    const { url, error: uploadError } = await uploadChallengePhoto(
      user.id,
      selectedChallenge.id,
      file
    );

    if (uploadError || !url) {
      toast.error('Failed to upload photo');
      setIsUploading(false);
      return;
    }

    // Complete challenge
    await completeChallenge(selectedChallenge.id, url);

    setSelectedChallenge(null);
    setIsUploading(false);
  };

  const completedCount = completedIds.length;
  const totalPoints = challenges
    .filter((c) => completedIds.includes(c.id))
    .reduce((sum, c) => sum + c.points, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-500 text-white p-4 pb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Photo Challenges
        </h1>
        <p className="text-primary-100 text-sm mt-1">
          Complete challenges by taking photos
        </p>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-2xl font-bold">{completedCount}/{challenges.length}</p>
            <p className="text-xs text-primary-100">Completed</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2">
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-xs text-primary-100">Points Earned</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'text-primary-600 border-b-2 border-primary-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
              {f === 'pending' && (
                <span className="ml-1 text-xs">
                  ({challenges.length - completedCount})
                </span>
              )}
              {f === 'completed' && (
                <span className="ml-1 text-xs">({completedCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Challenge List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>
              {filter === 'completed'
                ? 'No completed challenges yet'
                : filter === 'pending'
                ? 'All challenges completed!'
                : 'No challenges available'}
            </p>
          </div>
        ) : (
          filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              isCompleted={completedIds.includes(challenge.id)}
              onComplete={() => setSelectedChallenge(challenge)}
            />
          ))
        )}
      </div>

      {/* Photo Capture Modal */}
      {selectedChallenge && (
        <PhotoCapture
          onCapture={handlePhotoCapture}
          onCancel={() => setSelectedChallenge(null)}
          isUploading={isUploading}
          challengeName={selectedChallenge.name}
        />
      )}
    </div>
  );
}
