'use client';

import { useState, useRef } from 'react';
import { Camera, X, Check, RotateCcw, Loader2 } from 'lucide-react';

interface Props {
  onCapture: (file: File) => void;
  onCancel: () => void;
  isUploading?: boolean;
  challengeName?: string;
}

export default function PhotoCapture({ onCapture, onCancel, isUploading = false, challengeName }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  };

  const handleRetake = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setCapturedFile(null);
    // Trigger file input again
    setTimeout(() => inputRef.current?.click(), 100);
  };

  const openCamera = () => {
    inputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        // Camera trigger screen
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center text-white mb-8">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-80" />
            <p className="text-lg font-medium">Take a photo</p>
            {challengeName && (
              <p className="text-sm font-medium text-primary-300 mt-2">
                {challengeName}
              </p>
            )}
            <p className="text-sm opacity-70 mt-1">
              Capture proof of your challenge completion
            </p>
          </div>

          <button
            onClick={openCamera}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Camera className="w-10 h-10 text-gray-800" />
          </button>
        </div>
      ) : (
        // Preview screen
        <>
          <div className="flex-1 relative bg-black flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                  <p>Uploading...</p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="p-6 pb-20 flex justify-center gap-6 bg-black">
            <button
              onClick={handleRetake}
              disabled={isUploading}
              className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center disabled:opacity-50"
            >
              <RotateCcw className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={handleConfirm}
              disabled={isUploading}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              ) : (
                <Check className="w-7 h-7 text-white" />
              )}
            </button>
          </div>
        </>
      )}

      {/* Close button */}
      <button
        onClick={onCancel}
        disabled={isUploading}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center disabled:opacity-50"
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
