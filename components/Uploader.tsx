'use client';

import { useCallback, useRef, useState } from 'react';

const MAX_PHOTOS = 200;

type Props = {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
};

export default function Uploader({ onFilesSelected, disabled }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const processFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) {
        setNotice('画像ファイルが見つかりませんでした');
        return;
      }

      let selected = images;
      if (images.length > MAX_PHOTOS) {
        const shuffled = [...images].sort(() => Math.random() - 0.5);
        selected = shuffled.slice(0, MAX_PHOTOS);
        setNotice(`${images.length}枚から${MAX_PHOTOS}枚をランダムに選びました`);
      } else {
        setNotice(`${selected.length}枚の写真を選択`);
      }

      onFilesSelected(selected);
    },
    [onFilesSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDirectoryPicker = async () => {
    try {
      // @ts-expect-error showDirectoryPicker is Chrome-only
      const dirHandle = await window.showDirectoryPicker();
      const files: File[] = [];
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('image/')) {
            files.push(file);
          }
        }
      }
      processFiles(files);
    } catch {
      // ユーザーがキャンセルした場合
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <label
        className={`block border border-dashed p-16 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-white/60 bg-white/5'
            : 'border-white/15 hover:border-white/30'
        } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />
        <p className="text-white/60 text-sm tracking-wide mb-2">
          Drop photos here
        </p>
        <p className="text-white/30 text-xs tracking-wider">
          or tap to select (max {MAX_PHOTOS})
        </p>
      </label>

      {supportsDirectoryPicker && (
        <button
          onClick={handleDirectoryPicker}
          disabled={disabled}
          className="mt-3 w-full py-3 bg-white/5 text-white/40 text-xs tracking-[0.15em] uppercase hover:bg-white/10 hover:text-white/60 transition-all disabled:opacity-30"
        >
          Select folder
        </button>
      )}

      {notice && (
        <p className="mt-4 text-center text-xs text-white/50 tracking-wide">{notice}</p>
      )}
    </div>
  );
}
