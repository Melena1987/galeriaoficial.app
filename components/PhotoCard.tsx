import React, { useState } from 'react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick, onDelete, isAdmin }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick for the card
    onDelete();
  };

  return (
    <div 
      className="relative overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg cursor-pointer group aspect-square hover:scale-105"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={photo.url} alt={photo.fileName} className="object-cover w-full h-full" />
      {isHovered && isAdmin && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <button 
            onClick={handleDelete}
            className="p-2 text-white transition-opacity bg-rose-600 rounded-full hover:bg-rose-500"
            aria-label="Eliminar foto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoCard;