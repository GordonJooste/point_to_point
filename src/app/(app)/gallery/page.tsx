'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, X, User } from 'lucide-react';
import { useGallery } from '@/hooks/useGallery';
import { ChallengeCompletion } from '@/types';

export default function GalleryPage() {
  const { photos, isLoading } = useGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengeCompletion | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary-500" />
          Photo Gallery
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {photos.length} photos from all participants
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No photos yet</p>
            <p className="text-sm">Complete challenges to add photos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-200"
              >
                <img
                  src={photo.photo_url}
                  alt={photo.challenge?.title || 'Challenge photo'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">
                    {photo.challenge?.title}
                  </p>
                  <p className="text-white/70 text-xs truncate">
                    {photo.user?.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.challenge?.title || 'Challenge photo'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Info */}
          <div
            className="bg-black/80 p-4 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {selectedPhoto.user?.username}
                </p>
                <p className="text-gray-400 text-sm">
                  {formatDate(selectedPhoto.completed_at)}
                </p>
              </div>
            </div>
            <p className="text-white">
              <span className="text-primary-400">Challenge:</span>{' '}
              {selectedPhoto.challenge?.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
