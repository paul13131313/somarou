export type EasingPattern = 'sine' | 'burst' | 'random';

/**
 * 各写真の表示時間（ms）の配列を生成する
 * @param photoCount - 写真の枚数
 * @param durationSec - 動画全体の秒数
 * @param pattern - スピード緩急パターン
 */
export function generateDisplayTimes(
  photoCount: number,
  durationSec: number,
  pattern: EasingPattern
): number[] {
  const totalMs = durationSec * 1000;

  switch (pattern) {
    case 'sine':
      return generateSine(photoCount, totalMs);
    case 'burst':
      return generateBurst(photoCount, totalMs);
    case 'random':
      return generateRandom(photoCount, totalMs);
  }
}

function generateSine(photoCount: number, totalMs: number): number[] {
  // まず仮の表示時間を計算
  const raw: number[] = [];
  let cumulative = 0;

  for (let i = 0; i < photoCount; i++) {
    const t = cumulative;
    const progress = t / totalMs;
    // 500ms（開始/終了）→ 80ms（中間）のサインカーブ
    const displayTime = 500 - 420 * Math.pow(Math.sin(Math.PI * progress), 2);
    raw.push(displayTime);
    cumulative += displayTime;
  }

  // 合計が totalMs になるよう正規化
  return normalize(raw, totalMs);
}

function generateBurst(photoCount: number, totalMs: number): number[] {
  const raw: number[] = [];

  for (let i = 0; i < photoCount; i++) {
    const progress = i / photoCount;

    if (progress < 0.2) {
      // 序盤: ゆっくり 500ms → 100ms
      raw.push(500 - 400 * (progress / 0.2));
    } else if (progress < 0.3) {
      // 突然速い: 10〜30ms
      raw.push(10 + Math.random() * 20);
    } else if (progress < 0.7) {
      // 中盤: 超高速 10〜50ms
      raw.push(10 + Math.random() * 40);
    } else if (progress < 0.8) {
      // 突然遅くなる: 100ms → 500ms
      const localP = (progress - 0.7) / 0.1;
      raw.push(100 + 400 * localP);
    } else {
      // 終盤: またゆっくり 500ms
      raw.push(500);
    }
  }

  return normalize(raw, totalMs);
}

function generateRandom(photoCount: number, totalMs: number): number[] {
  const raw: number[] = [];

  for (let i = 0; i < photoCount; i++) {
    raw.push(50 + Math.random() * 450); // 50ms〜500ms
  }

  return normalize(raw, totalMs);
}

function normalize(times: number[], totalMs: number): number[] {
  const sum = times.reduce((a, b) => a + b, 0);
  const scale = totalMs / sum;
  return times.map((t) => Math.max(10, Math.round(t * scale)));
}
