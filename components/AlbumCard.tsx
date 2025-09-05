import React from 'react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  onClick: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  return (
    <div 
      className="overflow-hidden transition-transform duration-300 transform bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:scale-105"
      onClick={onClick}
    >
      <div className="relative w-full h-48">
        {album.coverPhotoUrl ? (
          <img src={album.coverPhotoUrl} alt={album.name} className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{album.name}</h3>
        <p className="text-sm text-gray-400 truncate">{album.description || 'Sin descripción'}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
