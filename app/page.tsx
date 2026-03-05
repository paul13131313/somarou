'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Uploader from '@/components/Uploader';
import Generator from '@/components/Generator';
import Player from '@/components/Player';
import type { EasingPattern } from '@/lib/easing';

type Phase = 'upload' | 'generating' | 'done';

const BGM_PRESETS = [
  { label: 'なし', url: null },
  { label: 'Track 1 - Upbeat', url: '/bgm/track1.mp3' },
  { label: 'Track 2 - Nostalgic', url: '/bgm/track2.mp3' },
  { label: 'Track 3 - Dramatic', url: '/bgm/track3.mp3' },
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [bitmaps, setBitmaps] = useState<ImageBitmap[]>([]);
  const [resizeProgress, setResizeProgress] = useState({ done: 0, total: 0 });
  const [duration, setDuration] = useState(15);
  const [pattern, setPattern] = useState<EasingPattern>('sine');
  const [bgmPreset, setBgmPreset] = useState<string | null>(null);
  const [bgmFile, setBgmFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0 });
  const [isSafari, setIsSafari] = useState(false);
  const [resizing, setResizing] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
  }, []);

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setResizing(true);
    setResizeProgress({ done: 0, total: selectedFiles.length });

    const worker = new Worker(
      new URL('../workers/resizer.worker.ts', import.meta.url)
    );
    workerRef.current = worker;

    const results: ImageBitmap[] = new Array(selectedFiles.length);

    worker.onmessage = (e) => {
      if (e.data.done) {
        setBitmaps(results.filter(Boolean));
        setResizing(false);
        worker.terminate();
        return;
      }
      const { index, bitmap } = e.data;
      results[index] = bitmap;
      setResizeProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    };

    worker.postMessage({ files: selectedFiles });
  }, []);

  const handleGenerate = () => {
    if (bitmaps.length === 0) return;
    setPhase('generating');
    setGenProgress({ current: 0, total: bitmaps.length });
  };

  const handleComplete = (url: string) => {
    setVideoUrl(url);
    setPhase('done');
  };

  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setFiles([]);
    setBitmaps([]);
    setPhase('upload');
    setResizeProgress({ done: 0, total: 0 });
    setResizing(false);
  };

  const handleBgmFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBgmFile(e.target.files[0]);
      setBgmPreset(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-dm-sans), "DM Sans", sans-serif' }}>
      {/* Safari警告バナー */}
      {isSafari && (
        <div className="bg-white/10 backdrop-blur-md text-white/80 px-4 py-3 text-center text-sm tracking-wide border-b border-white/10">
          Safari では動画生成に対応していません。Chrome をお使いください。
        </div>
      )}

      <div className="max-w-xl mx-auto px-6 py-16">
        {/* ヘッダー */}
        <header className="text-center mb-16">
          <h1
            className="text-7xl mb-4"
            style={{
              fontFamily: 'var(--font-yuji-syuku), "Yuji Syuku", serif',
            }}
          >
            <span style={{ letterSpacing: '0.28em' }}>走</span>
            <span style={{ letterSpacing: '0.4em' }}>馬</span>
            <span>灯</span>
          </h1>
          <p className="text-white/40 text-sm tracking-[0.3em] uppercase mb-8" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            SOMATO
          </p>
          <div className="w-12 h-px bg-white/20 mx-auto mb-6" />
          <p className="text-white/50 text-sm tracking-wide">
            写真が走馬灯のように駆け巡る動画を生成
          </p>
        </header>

        {/* Upload Phase */}
        {phase === 'upload' && (
          <div className="space-y-10">
            {/* プレビュー画像 */}
            {files.length === 0 && (
              <div className="w-44 h-72 mx-auto rounded-sm overflow-hidden relative">
                <div
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(180deg, #333 0%, #111 50%, #222 100%)',
                  }}
                />
                <div className="absolute inset-0 border border-white/10" />
              </div>
            )}

            <Uploader
              onFilesSelected={handleFilesSelected}
              disabled={resizing}
            />

            {/* リサイズ進捗 */}
            {resizing && (
              <div className="text-center">
                <div className="w-full bg-white/5 h-px mb-3 relative">
                  <div
                    className="bg-white h-px transition-all absolute left-0 top-0"
                    style={{
                      width: `${(resizeProgress.done / resizeProgress.total) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-white/40 text-xs tracking-wider">
                  {resizeProgress.done} / {resizeProgress.total}
                </p>
              </div>
            )}

            {/* 設定パネル */}
            {bitmaps.length > 0 && !resizing && (
              <div className="space-y-8">
                <div className="w-full h-px bg-white/10" />

                {/* 動画の長さ */}
                <div>
                  <label className="block text-xs text-white/40 tracking-[0.2em] uppercase mb-3">
                    Duration
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setDuration(sec)}
                        className={`flex-1 py-3 text-sm tracking-wider transition-all ${
                          duration === sec
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* スピードパターン */}
                <div>
                  <label className="block text-xs text-white/40 tracking-[0.2em] uppercase mb-3">
                    Pattern
                  </label>
                  <div className="flex gap-2">
                    {([
                      { key: 'sine', label: 'Sine' },
                      { key: 'burst', label: 'Burst' },
                      { key: 'random', label: 'Random' },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setPattern(key)}
                        className={`flex-1 py-3 text-sm tracking-wider transition-all ${
                          pattern === key
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BGM */}
                <div>
                  <label className="block text-xs text-white/40 tracking-[0.2em] uppercase mb-3">
                    Sound
                  </label>
                  <div className="space-y-1">
                    {BGM_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setBgmPreset(preset.url);
                          setBgmFile(null);
                        }}
                        className={`w-full py-2.5 px-4 text-sm text-left tracking-wide transition-all ${
                          bgmPreset === preset.url && !bgmFile
                            ? 'bg-white text-black'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}

                    <label
                      className={`block w-full py-2.5 px-4 text-sm text-center cursor-pointer tracking-wide transition-all ${
                        bgmFile
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                      }`}
                    >
                      {bgmFile ? bgmFile.name : 'Upload your audio'}
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleBgmFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="w-full h-px bg-white/10" />

                {/* 生成ボタン */}
                <button
                  onClick={handleGenerate}
                  className="w-full py-4 bg-white text-black font-medium tracking-[0.15em] uppercase text-sm hover:bg-white/90 transition-all"
                >
                  Generate
                </button>
              </div>
            )}
          </div>
        )}

        {/* Generating Phase */}
        {phase === 'generating' && (
          <div className="text-center space-y-8">
            <div className="w-16 h-16 mx-auto border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </div>
            <h2 className="text-lg tracking-[0.2em] uppercase text-white/80">Generating</h2>

            <div className="w-full bg-white/5 h-px relative">
              <div
                className="bg-white h-px transition-all absolute left-0 top-0"
                style={{
                  width: genProgress.total > 0
                    ? `${Math.min((genProgress.current / genProgress.total) * 100, 100)}%`
                    : '0%',
                }}
              />
            </div>
            <p className="text-white/30 text-xs tracking-wider">
              {duration}s
            </p>

            <Generator
              bitmaps={bitmaps}
              duration={duration}
              pattern={pattern}
              bgmUrl={bgmPreset}
              bgmFile={bgmFile}
              onComplete={handleComplete}
              onProgress={(current, total) =>
                setGenProgress({ current, total })
              }
            />
          </div>
        )}

        {/* Done Phase */}
        {phase === 'done' && videoUrl && (
          <div className="space-y-8">
            <h2 className="text-lg tracking-[0.2em] uppercase text-center text-white/80">Complete</h2>
            <Player videoUrl={videoUrl} onReset={handleReset} />
          </div>
        )}
      </div>
    </main>
  );
}
