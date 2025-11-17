import { cn } from "@/lib/utils";

interface GallerySkeletonProps {
  className?: string;
}

export const GallerySkeleton = ({ className }: GallerySkeletonProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] bg-[length:200%_100%]",
        "animate-shimmer",
        "shadow-lg",
        className
      )}
    >
      {/* Main skeleton content */}
      <div className="w-full h-72 relative">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-slide" />
        
        {/* Image placeholder icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pulsing circle background */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse-slow flex items-center justify-center">
              <svg
                className="w-8 h-8 text-zinc-700 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            
            {/* Animated rings */}
            <div className="absolute inset-0 rounded-full border-2 border-zinc-700/30 animate-ping-slow" />
            <div className="absolute inset-0 rounded-full border border-zinc-700/20 animate-ping-slower" />
          </div>
        </div>
        
        {/* Bottom gradient overlay for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Loading bars at bottom */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-3 bg-zinc-800/60 rounded-full w-3/4 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="h-2.5 bg-zinc-800/50 rounded-full w-1/2 animate-pulse" style={{ animationDelay: '150ms' }} />
        </div>
      </div>
    </div>
  );
};
