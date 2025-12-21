'use client';

import { Camera, Check } from 'lucide-react';
import { Challenge } from '@/types';

interface Props {
  challenge: Challenge;
  isCompleted: boolean;
  onComplete: () => void;
}

const categoryColors: Record<string, string> = {
  adventure: 'bg-orange-100 text-orange-800',
  social: 'bg-blue-100 text-blue-800',
  fun: 'bg-pink-100 text-pink-800',
  food: 'bg-yellow-100 text-yellow-800',
  eco: 'bg-green-100 text-green-800',
  cultural: 'bg-purple-100 text-purple-800',
  photo: 'bg-cyan-100 text-cyan-800',
};

export default function ChallengeCard({
  challenge,
  isCompleted,
  onComplete,
}: Props) {
  const categoryColor =
    categoryColors[challenge.category?.toLowerCase() || ''] ||
    'bg-gray-100 text-gray-800';

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border p-4 ${
        isCompleted ? 'opacity-70 border-green-200 bg-green-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-semibold ${
                isCompleted ? 'text-green-700 line-through' : 'text-gray-800'
              }`}
            >
              {challenge.title}
            </h3>
            {isCompleted && (
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>

          <div className="flex items-center gap-2">
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-0.5 rounded">
              {challenge.points} pts
            </span>
            {challenge.category && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${categoryColor}`}>
                {challenge.category}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            <button
              onClick={onComplete}
              className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
            >
              <Camera className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
