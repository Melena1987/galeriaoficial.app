import React from 'react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick, onDelete, isAdmin, isSelected, onSelectToggle }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectToggle();
  };

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 transform rounded-lg shadow-lg group aspect-square bg-slate-800 ${isAdmin ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-violet-500 scale-105' : 'hover:scale-105'}`}
      onClick={onClick}
    >
      {isAdmin && (
        <button
          onClick={handleSelectClick}
          className="absolute top-2 left-2 z-20 flex items-center justify-center w-6 h-6 text-white transition-all transform bg-black rounded-full bg-opacity-60 hover:bg-opacity-80 group-hover:opacity-100"
          aria-label="Seleccionar foto"
        >
          {isSelected ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <div className="w-3 h-3 transition-all duration-200 border-2 border-white rounded-full group-hover:border-slate-300"></div>
          )}
        </button>
      )}

      <img src={photo.url} alt={photo.fileName} className={`object-cover w-full h-full transition-opacity ${isSelected ? 'opacity-60' : ''}`} />
      
      {isAdmin && (
        <button
          onClick={handleDelete}
          className="absolute z-10 p-2 text-white transition-all transform-gpu bg-rose-600 rounded-full top-2 right-2 opacity-0 group-hover:opacity-100 hover:bg-rose-500 active:scale-90"
          aria-label="Eliminar foto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default PhotoCard;