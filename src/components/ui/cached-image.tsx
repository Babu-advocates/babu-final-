import { useState, useEffect } from 'react';
import { GallerySkeleton } from './gallery-skeleton';
import { cn } from '@/lib/utils';

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  onLoad?: () => void;
  onClick?: () => void;
  priority?: boolean;
}

// In-memory cache for loaded images
const imageCache = new Map<string, boolean>();

export const CachedImage = ({ 
  src, 
  alt, 
  className, 
  skeletonClassName,
  onLoad,
  onClick,
  priority = false
}: CachedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(imageCache.has(src));
  const [error, setError] = useState(false);

  useEffect(() => {
    // If image is already cached, mark as loaded
    if (imageCache.has(src)) {
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // Preload the image
    const img = new Image();
    img.src = src;
    
    // Set crossOrigin for CORS images
    if (src.includes('supabase.co')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      // Cache the successful load
      imageCache.set(src, true);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      setIsLoaded(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad]);

  return (
    <div className="relative w-full h-full">
      {!isLoaded && !error && (
        <div className="absolute inset-0 z-10">
          <GallerySkeleton className={skeletonClassName} />
        </div>
      )}
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <p className="text-muted-foreground text-sm">Failed to load image</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            'transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onClick={onClick}
          style={{
            // Enable browser caching with long cache time
            imageRendering: 'auto',
          }}
        />
      )}
    </div>
  );
};

// Utility to preload images in advance
export const preloadImages = (urls: string[]) => {
  urls.forEach(url => {
    if (!imageCache.has(url)) {
      const img = new Image();
      if (url.includes('supabase.co')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = url;
      img.onload = () => imageCache.set(url, true);
    }
  });
};

// Clear cache utility (if needed)
export const clearImageCache = () => {
  imageCache.clear();
};
