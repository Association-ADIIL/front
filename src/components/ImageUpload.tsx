import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadImage, deleteImage } from '../api/upload';

interface ImageUploadProps {
  value: string;
  onChange: (url: string | null) => void;
  folder: string;
  label: string;
  aspectRatio?: string;
  onCleanup?: (imageUrl: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder,
  label,
  aspectRatio = '16:9',
  onCleanup,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track if this image was uploaded during this session
  useEffect(() => {
    return () => {
      // Cleanup on unmount if image was uploaded but not saved
      if (uploadedImageUrl && onCleanup) {
        onCleanup(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl, onCleanup]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const response = await uploadImage(file, folder);
      setUploadedImageUrl(response.imageUrl);
      onChange(response.imageUrl);
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Erreur lors de l'upload: ${error.message}`);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = async () => {
    // Delete the uploaded image if it exists
    if (uploadedImageUrl) {
      try {
        await deleteImage(uploadedImageUrl);
        setUploadedImageUrl(null);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }

    onChange(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || value;

  return (
    <div className="space-y-2">
      <label className="block text-gray-400 font-bold text-sm mb-1">
        {label}
        {aspectRatio && (
          <span className="text-xs text-gray-500 ml-2">
            (Ratio recommandé: {aspectRatio})
          </span>
        )}
      </label>

      {displayImage ? (
        <div className="relative group">
          <div className="aspect-video w-full bg-dark-bg border border-gray-600 rounded-lg overflow-hidden">
            <img
              src={displayImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <Loader className="animate-spin mx-auto mb-2" size={32} />
                <p>Upload en cours...</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? 'border-accent-mint bg-accent-mint/10'
              : 'border-gray-600 hover:border-gray-500 bg-dark-bg'
          } ${uploading ? 'pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="text-white">
              <Loader className="animate-spin mx-auto mb-2" size={32} />
              <p>Upload en cours...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="mx-auto mb-4 text-gray-500" size={48} />
              <div className="space-y-2">
                <p className="text-gray-400">
                  Glissez-déposez une image ici ou
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent-mint text-darker-bg font-bold rounded hover:bg-white transition-colors"
                >
                  <Upload size={16} />
                  Choisir un fichier
                </button>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF ou WebP (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
