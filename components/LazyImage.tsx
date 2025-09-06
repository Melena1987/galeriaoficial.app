import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src?: string; // src es ahora opcional para mayor robustez
  alt: string;
  className: string;
  placeholderClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholderClassName = 'bg-slate-800' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si no hay src, no hay nada que observar o cargar.
    if (!src) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLoaded(true);
          // Una vez cargado, dejamos de observar.
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        rootMargin: '100px 0px', // Empezar a cargar imágenes 100px antes de que entren en el viewport.
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(ref.current);
      }
    };
  }, [src]); // Dependemos de src para re-evaluar si cambia.

  // Si no hay src o todavía no se ha cargado, mostramos el placeholder.
  if (!isLoaded || !src) {
    return <div ref={ref} className={`${className} ${placeholderClassName}`} aria-label={alt} />;
  }

  // Una vez que el observer da la señal, renderizamos la imagen real.
  return <img src={src} alt={alt} className={className} decoding="async" />;
};

export default LazyImage;
