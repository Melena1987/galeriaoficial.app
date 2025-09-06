import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
  placeholderClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholderClassName = 'bg-slate-800' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          // Once loaded, we don't need to observe it anymore
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        rootMargin: '100px 0px', // Start loading images 100px before they enter the viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once

  if (isLoaded) {
    return <img src={src} alt={alt} className={className} decoding="async" />;
  }

  // The placeholder must have the same layout properties as the final image
  // to prevent content layout shift.
  return <div ref={ref} className={`${className} ${placeholderClassName}`} aria-label={alt} />;
};

export default LazyImage;
