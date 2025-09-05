import React from 'react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onDelete: (photoId: string, fileName: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onDelete }) => {
  return (
    <div className="relative group aspect-w-1 aspect-h-1 bg-gray-700 rounded-lg overflow-hidden">
      <img src={photo.url} alt={photo.fileName} className="object-cover w-full h-full" loading="lazy" />
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100">
        <button
          onClick={() => onDelete(photo.id, photo.fileName)}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

export default PhotoCard;
