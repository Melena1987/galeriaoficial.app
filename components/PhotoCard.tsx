import React, { useState } from 'react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full overflow-hidden bg-gray-700 rounded-lg shadow-md aspect-square group">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      )}
      <img
        src={photo.url}
        alt={photo.fileName}
        className={`object-cover w-full h-full transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
      <div className="absolute inset-0 flex items-end p-2 text-white bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-xs truncate">{photo.fileName}</p>
      </div>
    </div>
  );
};

export default PhotoCard;
