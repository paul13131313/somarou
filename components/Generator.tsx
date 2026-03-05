'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { generateDisplayTimes, type EasingPattern } from '@/lib/easing';

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

    const {
      Output,
      Mp4OutputFormat,
      BufferTarget,
      CanvasSource,
      AudioBufferSource,
    } = await import('mediabunny');

    const displayTimes = generateDisplayTimes(bitmaps.length, duration, pattern);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d')!;

    const FPS = 30;
    const frameDuration = 1 / FPS;
    const totalFrames = Math.ceil(duration * FPS);

    // MP4出力セットアップ
    const output = new Output({
      format: new Mp4OutputFormat(),
      target: new BufferTarget(),
    });

    const videoSource = new CanvasSource(canvas, {
      codec: 'avc',
      bitrate: 8e6,
    });

    output.addVideoTrack(videoSource, { frameRate: FPS });

    // BGM読み込み
    let audioBuffer: AudioBuffer | null = null;
    const audioCtx = new AudioContext();

    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (bgmFile) {
        arrayBuffer = await bgmFile.arrayBuffer();
      } else if (bgmUrl) {
        const res = await fetch(bgmUrl);
        arrayBuffer = await res.arrayBuffer();
      }
      if (arrayBuffer) {
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      }
    } catch (err) {
      console.error('BGM読み込み失敗:', err);
    }

    let audioSource: InstanceType<typeof AudioBufferSource> | null = null;
    if (audioBuffer) {
      audioSource = new AudioBufferSource({
        codec: 'aac',
        bitrate: 128e3,
      });
      output.addAudioTrack(audioSource);
    }

    await audioCtx.close();

    // 録画開始
    await output.start();

    // BGMのAudioBufferを動画の長さにトリミングして追加
    if (audioSource && audioBuffer) {
      const trimmedLength = Math.min(
        audioBuffer.length,
        Math.ceil(duration * audioBuffer.sampleRate)
      );
      const trimmed = new AudioBuffer({
        numberOfChannels: audioBuffer.numberOfChannels,
        length: trimmedLength,
        sampleRate: audioBuffer.sampleRate,
      });
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        trimmed.copyToChannel(
          audioBuffer.getChannelData(ch).slice(0, trimmedLength),
          ch
        );
      }
      await audioSource.add(trimmed);
    }
    setStatus('録画中...');

    // フレームごとに描画→追加
    let photoIndex = 0;
    let elapsedMs = 0;
    let currentDisplayTime = displayTimes[0];
    let displayTimeIndex = 0;
    for (let frame = 0; frame < totalFrames; frame++) {
      const frameMs = frame * (1000 / FPS);

      // 写真切り替え判定
      const timeSinceSwitch = frameMs - elapsedMs;
      if (timeSinceSwitch >= currentDisplayTime) {
        photoIndex = (photoIndex + 1) % bitmaps.length;
        elapsedMs = frameMs;
        displayTimeIndex = (displayTimeIndex + 1) % displayTimes.length;
        currentDisplayTime = displayTimes[displayTimeIndex];
      }

      // 写真描画
      ctx.drawImage(bitmaps[photoIndex], 0, 0, 1080, 1920);

      // ビネット
      const vignette = ctx.createRadialGradient(540, 960, 400, 540, 960, 1000);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, 1080, 1920);

      // フレーム追加（awaitでエンコーダのバックプレッシャーを尊重）
      const timestamp = frame * frameDuration;
      await videoSource.add(timestamp, frameDuration);

      // 進捗報告（30フレームごと）
      if (frame % FPS === 0) {
        onProgress(frame, totalFrames);
      }
    }

    onProgress(totalFrames, totalFrames);
    setStatus('動画を生成中...');

    await output.finalize();

    const buffer = (output.target as InstanceType<typeof BufferTarget>).buffer!;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    onComplete(url);
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
