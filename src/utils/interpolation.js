// utils/interpolation.js

export function nearestNeighbor(srcData, srcW, srcH, dstW, dstH) {
  const dstData = new Uint8ClampedArray(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let j = 0; j < dstH; j++) {
    for (let i = 0; i < dstW; i++) {
      const srcX = Math.floor(i * xRatio);
      const srcY = Math.floor(j * yRatio);
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (j * dstW + i) * 4;
      dstData.set(srcData.slice(srcIdx, srcIdx + 4), dstIdx);
    }
  }

  return new ImageData(dstData, dstW, dstH);
}

export function bilinear(srcData, srcW, srcH, dstW, dstH) {
  const dstData = new Uint8ClampedArray(dstW * dstH * 4);
  const xRatio = (srcW - 1) / dstW;
  const yRatio = (srcH - 1) / dstH;

  for (let j = 0; j < dstH; j++) {
    for (let i = 0; i < dstW; i++) {
      const x = xRatio * i;
      const y = yRatio * j;
      const x1 = Math.floor(x);
      const y1 = Math.floor(y);
      const x2 = Math.min(x1 + 1, srcW - 1);
      const y2 = Math.min(y1 + 1, srcH - 1);

      const dx = x - x1;
      const dy = y - y1;

      for (let c = 0; c < 4; c++) {
        const v1 = srcData[(y1 * srcW + x1) * 4 + c];
        const v2 = srcData[(y1 * srcW + x2) * 4 + c];
        const v3 = srcData[(y2 * srcW + x1) * 4 + c];
        const v4 = srcData[(y2 * srcW + x2) * 4 + c];

        const i1 = v1 * (1 - dx) + v2 * dx;
        const i2 = v3 * (1 - dx) + v4 * dx;
        const value = i1 * (1 - dy) + i2 * dy;

        dstData[(j * dstW + i) * 4 + c] = Math.round(value);
      }
    }
  }

  return new ImageData(dstData, dstW, dstH);
}
