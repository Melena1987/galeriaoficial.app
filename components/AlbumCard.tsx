import React from 'react';
import { Album } from '../types';
import LazyImage from './LazyImage';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
  onDelete: () => void;
  onShare: () => void;
  isAdmin: boolean;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick, onDelete, onShare, isAdmin }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare();
  };

  return (
    <div 
      className="relative overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg cursor-pointer group bg-slate-800 hover:scale-105"
      onClick={onClick}
    >
      {isAdmin && (
         <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleShare}
            className="p-1.5 text-white transition-all bg-violet-600 rounded-full hover:bg-violet-500"
            aria-label="Compartir álbum"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </button>
          <button 
            onClick={handleDelete}
            className="p-1.5 text-white transition-all bg-rose-600 rounded-full hover:bg-rose-500"
            aria-label="Eliminar álbum"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
      <div className="relative w-full h-48 bg-slate-700">
        {album.coverPhotoUrl ? (
          <LazyImage 
            src={album.coverPhotoUrl} 
            alt={album.name} 
            className="object-cover w-full h-full"
            placeholderClassName="bg-slate-700"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{album.name}</h3>
        <p className="text-sm text-slate-400 truncate">{album.description || 'Sin descripción'}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
