import React from 'react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onView: () => void;
  onDelete: (photoId: string, photoUrl: string) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onView, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(photo.id, photo.url);
  };

  return (
    <div className="relative overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg group aspect-w-1 aspect-h-1" onClick={onView}>
      <img src={photo.url} alt={photo.fileName} className="object-cover w-full h-full cursor-pointer" />
      <div className="absolute inset-0 transition-all duration-300 bg-black bg-opacity-0 group-hover:bg-opacity-40"></div>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 p-2 text-white transition-opacity bg-red-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
        aria-label="Eliminar foto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default PhotoCard;