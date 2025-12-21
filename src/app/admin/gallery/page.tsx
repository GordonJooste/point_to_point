'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Trash2, Loader2, X } from 'lucide-react';
import { ChallengeCompletion } from '@/types';
import toast from 'react-hot-toast';

export default function AdminGalleryPage() {
  const [photos, setPhotos] = useState<ChallengeCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<ChallengeCompletion | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchPhotos();
  }, []);

  async function fetchPhotos() {
    const { data: route } = await supabase
      .from('routes')
      .select('id')
      .eq('is_active', true)
      .single();

    if (route) {
      const { data } = await supabase
        .from('challenge_completions')
        .select(`
          *,
          user:users(id, username),
          challenge:challenges(id, title)
        `)
        .eq('route_id', route.id)
        .order('completed_at', { ascending: false });

      setPhotos(data || []);
    }

    setIsLoading(false);
  }

  async function handleDelete(photo: ChallengeCompletion) {
    if (!confirm('Are you sure you want to delete this photo submission?')) return;

    // Delete from storage
    const path = photo.photo_url.split('/challenge-photos/')[1];
    if (path) {
      await supabase.storage.from('challenge-photos').remove([path]);
    }

    // Delete completion record
    const { error } = await supabase
      .from('challenge_completions')
      .delete()
      .eq('id', photo.id);

    if (error) {
      toast.error('Failed to delete photo');
    } else {
      toast.success('Photo deleted');
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setSelectedPhoto(null);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Photo Gallery</h2>
        <span className="text-gray-500">{photos.length} photos</span>
      </div>

      {photos.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <Camera className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-gray-500">No photos submitted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-200 group"
            >
              <img
                src={photo.photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo);
                  }}
                  className="p-2 bg-red-500 text-white rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs truncate">
                  {photo.user?.username}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={selectedPhoto.photo_url}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="bg-black/80 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">
                  {selectedPhoto.user?.username}
                </p>
                <p className="text-gray-400 text-sm">
                  {selectedPhoto.challenge?.title}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatDate(selectedPhoto.completed_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(selectedPhoto)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
