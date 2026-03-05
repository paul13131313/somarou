'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateDisplayTimes, type EasingPattern } from '@/lib/easing';
import { loadBGM, loadBGMFromFile } from '@/lib/audioLoader';

type Props = {
  bitmaps: ImageBitmap[];
  duration: number;
  pattern: EasingPattern;
  bgmUrl: string | null;
  bgmFile: File | null;
  onComplete: (url: string) => void;
  onProgress: (current: number, total: number) => void;
};

export default function Generator({
  bitmaps,
  duration,
  pattern,
  bgmUrl,
  bgmFile,
  onComplete,
  onProgress,
}: Props) {
  const [status, setStatus] = useState('準備中...');
  const started = useRef(false);

  const generate = useCallback(async () => {
    if (started.current) return;
    started.current = true;

    const displayTimes = generateDisplayTimes(bitmaps.length, duration, pattern);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    // オーディオセットアップ
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    let bgmSource: AudioBufferSourceNode | null = null;

    try {
      if (bgmFile) {
        bgmSource = await loadBGMFromFile(audioCtx, bgmFile);
      } else if (bgmUrl) {
        bgmSource = await loadBGM(audioCtx, bgmUrl);
      }
    } catch (err) {
      console.error('BGM読み込み失敗:', err);
    }

    if (bgmSource) {
      bgmSource.connect(dest);
      bgmSource.connect(audioCtx.destination);
    }

    // MediaRecorder
    const videoStream = canvas.captureStream(30);
    const tracks = [
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ];
    const stream = new MediaStream(tracks);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (bgmSource) {
        try { bgmSource.stop(); } catch {}
      }
      audioCtx.close();

      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      onComplete(url);
    };

    // 録画開始
    recorder.start(100);
    if (bgmSource) {
      bgmSource.start(0);
    }
    setStatus('録画中...');

    // 描画ループ
    let photoIndex = 0;
    let lastSwitch = performance.now();
    let flashAlpha = 0;
    let recording = true;
    let totalSwitches = 0;
    const totalPhotos = displayTimes.length;

    const draw = (now: number) => {
      if (!recording) return;

      const elapsed = now - lastSwitch;
      if (elapsed >= displayTimes[photoIndex % displayTimes.length]) {
        photoIndex = (photoIndex + 1) % bitmaps.length;
        lastSwitch = now;
        flashAlpha = 0.6;
        totalSwitches++;
        onProgress(Math.min(totalSwitches, totalPhotos), totalPhotos);
      }

      // 写真描画
      ctx.drawImage(bitmaps[photoIndex], 0, 0, 1080, 1920);

      // フラッシュエフェクト
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
        ctx.fillRect(0, 0, 1080, 1920);
        flashAlpha -= 0.15;
      }

      // ビネット
      const vignette = ctx.createRadialGradient(540, 960, 400, 540, 960, 1000);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 1080, 1920);

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);

    // 指定秒数後に停止
    setTimeout(() => {
      recording = false;
      recorder.stop();
      setStatus('動画を生成中...');
    }, duration * 1000);
  }, [bitmaps, duration, pattern, bgmUrl, bgmFile, onComplete, onProgress]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div className="text-center">
      <p className="text-neutral-400 text-lg">{status}</p>
    </div>
  );
}
