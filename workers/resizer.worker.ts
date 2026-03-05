// リサイズは半分のサイズで行い、描画時にCanvasがスケールアップする
const TARGET_W = 540;
const TARGET_H = 960;

self.onmessage = async (e: MessageEvent<{ files: File[] }>) => {
  const { files } = e.data;

  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const originalBitmap = await createImageBitmap(file);

      // cover計算: アスペクト比を保ちつつターゲットを埋める
      const srcAspect = originalBitmap.width / originalBitmap.height;
      const dstAspect = TARGET_W / TARGET_H;

      let sx = 0, sy = 0, sw = originalBitmap.width, sh = originalBitmap.height;

      if (srcAspect > dstAspect) {
        sw = originalBitmap.height * dstAspect;
        sx = (originalBitmap.width - sw) / 2;
      } else {
        sh = originalBitmap.width / dstAspect;
        sy = (originalBitmap.height - sh) / 2;
      }

      const resized = await createImageBitmap(originalBitmap, sx, sy, sw, sh, {
        resizeWidth: TARGET_W,
        resizeHeight: TARGET_H,
        resizeQuality: 'low',
      });

      originalBitmap.close();

      self.postMessage(
        { index: i, bitmap: resized },
        // @ts-expect-error transferable
        [resized]
      );
    } catch (err) {
      console.error(`Failed to resize image ${i}:`, err);
    }
  }

  self.postMessage({ done: true });
};
