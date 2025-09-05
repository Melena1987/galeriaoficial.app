import React from 'react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  onSelect: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onSelect }) => {
  return (
    <div 
      className="overflow-hidden transition-transform duration-300 transform bg-gray-800 rounded-lg shadow-lg cursor-pointer group hover:scale-105"
      onClick={onSelect}
    >
      <div className="relative w-full pb-[75%]"> {/* 4:3 Aspect Ratio */}
        {album.coverPhotoUrl ? (
          <img
            src={album.coverPhotoUrl}
            alt={album.name}
            className="absolute top-0 left-0 object-cover w-full h-full"
          />
        ) : (
          <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full bg-gray-700">
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white truncate">{album.name}</h3>
        <p className="text-sm text-gray-400 truncate">{album.description}</p>
      </div>
    </div>
  );
};

export default AlbumCard;
