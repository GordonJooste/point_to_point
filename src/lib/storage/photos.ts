import { createClient } from '@/lib/supabase/client';

/**
 * Compress an image file to reduce size before upload
 */
export async function compressImage(file: File, maxDimension: number = 1200): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }

      canvas.width = width;
      canvas.height = height;

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a challenge photo to Supabase Storage
 */
export async function uploadChallengePhoto(
  userId: string,
  challengeId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();

  try {
    // Compress the image first
    const compressedFile = await compressImage(file);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = 'jpg';
    const fileName = `${userId}/${challengeId}_${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('challenge-photos')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('challenge-photos').getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (err) {
    console.error('Upload error:', err);
    return { url: null, error: 'Failed to upload photo' };
  }
}
