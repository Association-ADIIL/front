import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, GripVertical, Plus } from 'lucide-react';
import { addProductImage, removeProductImage, reorderProductImages, type ProductImage } from '../api/products';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';

interface ProductImageGalleryProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  accentColor?: 'mint' | 'orange' | 'purple' | 'cyan' | 'rose' | 'amber';
}

const accentColors = {
  mint: { border: 'border-accent-mint', bg: 'bg-accent-mint/10', button: 'bg-accent-mint' },
  orange: { border: 'border-orange-400', bg: 'bg-orange-400/10', button: 'bg-orange-500' },
  purple: { border: 'border-purple-400', bg: 'bg-purple-400/10', button: 'bg-purple-500' },
  cyan: { border: 'border-cyan-400', bg: 'bg-cyan-400/10', button: 'bg-cyan-500' },
  rose: { border: 'border-rose-400', bg: 'bg-rose-400/10', button: 'bg-rose-500' },
  amber: { border: 'border-amber-400', bg: 'bg-amber-400/10', button: 'bg-amber-500' },
};

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  productId,
  images,
  onImagesChange,
  accentColor = 'orange',
}) => {
  const colors = accentColors[accentColor];
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setUploading(true);
    try {
      const newImage = await addProductImage(productId, file);
      onImagesChange([...images, newImage]);
    } catch (error) {
      logger.error('Upload failed', error);
      alert(`Erreur lors de l'upload: ${getErrorMessage(error)}`);
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

  const handleRemove = async (imageId: number) => {
    setDeletingId(imageId);
    try {
      await removeProductImage(productId, imageId);
      onImagesChange(images.filter(img => img.id !== imageId));
    } catch (error) {
      logger.error('Failed to delete image', error);
      alert(`Erreur lors de la suppression: ${getErrorMessage(error)}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Drag and drop for reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onImagesChange(newImages);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      const imageIds = images.map(img => img.id);
      try {
        await reorderProductImages(productId, imageIds);
      } catch (error) {
        logger.error('Failed to reorder images', error);
      }
    }
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <label className="block text-gray-400 font-bold text-sm">
        Galerie d'images
        <span className="text-xs text-gray-500 ml-2 font-normal">
          (Glissez pour réorganiser)
        </span>
      </label>

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group aspect-square bg-dark-bg border rounded-lg overflow-hidden cursor-move transition-all ${
                draggedIndex === index ? 'border-orange-400 opacity-50' : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <img
                src={image.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Order indicator */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-darker-bg/90 backdrop-blur-sm rounded flex items-center justify-center text-xs font-bold text-white border border-gray-700">
                {index + 1}
              </div>

              {/* Drag handle */}
              <div className="absolute top-2 right-10 p-1 bg-darker-bg/90 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
                <GripVertical size={14} />
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                disabled={deletingId === image.id}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingId === image.id ? (
                  <Loader className="animate-spin" size={14} />
                ) : (
                  <X size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          dragActive
            ? `${colors.border} ${colors.bg}`
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
            <Loader className="animate-spin mx-auto mb-2" size={24} />
            <p className="text-sm">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
              <Plus size={20} className="text-gray-400" />
            </div>
            <div className="text-left">
              <p className="text-gray-300 text-sm font-medium">Ajouter une image</p>
              <p className="text-xs text-gray-500">Glissez ou cliquez pour ajouter</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {images.length === 0 && (
        <p className="text-xs text-gray-500 text-center">
          Aucune image dans la galerie. L'image principale sera utilisée si disponible.
        </p>
      )}
    </div>
  );
};

export default ProductImageGallery;
