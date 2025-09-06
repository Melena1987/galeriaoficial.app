import React from 'react';
import { Photo } from '../types';
import LazyImage from './LazyImage';
import { getThumbnailUrl } from '../utils/image';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  isSelected: boolean;
  onSelectToggle: () => void;
  onSetCover: () => void;
  isCover: boolean;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick, onDelete, isAdmin, isSelected, onSelectToggle, onSetCover, isCover }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectToggle();
  };

  const handleSetCover = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSetCover();
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

      <LazyImage
        src={getThumbnailUrl(photo.url)}
        alt={photo.fileName}
        className={`object-cover w-full h-full transition-opacity ${isSelected ? 'opacity-60' : ''}`}
      />
      
      {isCover && (
          <div className="absolute z-10 p-1 text-yellow-300 bottom-2 left-2" title="Foto de portada">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
          </div>
      )}

      {isAdmin && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isCover && (
                <button
                    onClick={handleSetCover}
                    className="p-1.5 text-white transition-all bg-blue-600 rounded-full hover:bg-blue-500 active:scale-90"
                    aria-label="Usar como foto de portada"
                    title="Usar como foto de portada"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1.5 text-white transition-all bg-rose-600 rounded-full hover:bg-rose-500 active:scale-90"
              aria-label="Eliminar foto"
              title="Eliminar foto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
        </div>
      )}
    </div>
  );
};

export default PhotoCard;