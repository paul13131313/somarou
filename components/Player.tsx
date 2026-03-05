'use client';

import { useRef } from 'react';

type Props = {
  videoUrl: string;
  onReset: () => void;
};

export default function Player({ videoUrl, onReset }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `somato-${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        autoPlay
        loop
        playsInline
        className="w-full border border-white/10"
        style={{ aspectRatio: '9/16' }}
      />

      <div className="flex gap-3 w-full">
        <button
          onClick={handleDownload}
          className="flex-1 py-4 bg-white text-black font-medium text-sm tracking-[0.15em] uppercase hover:bg-white/90 transition-all"
        >
          Download
        </button>
        <button
          onClick={onReset}
          className="py-4 px-8 bg-white/5 text-white/50 text-sm tracking-[0.15em] uppercase hover:bg-white/10 hover:text-white/70 transition-all"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
