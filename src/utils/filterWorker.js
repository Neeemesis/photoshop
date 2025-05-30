function padImage(data, width, height, kernelSize) {
  const pad = Math.floor(kernelSize / 2);
  const paddedWidth = width + 2 * pad;
  const paddedHeight = height + 2 * pad;
  const paddedData = new Uint8ClampedArray(paddedWidth * paddedHeight * 4);

  // Копируем исходное изображение в центр
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = ((y + pad) * paddedWidth + (x + pad)) * 4;
      paddedData[dstIdx] = data[srcIdx];
      paddedData[dstIdx + 1] = data[srcIdx + 1];
      paddedData[dstIdx + 2] = data[srcIdx + 2];
      paddedData[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  // Заполняем края
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < pad; x++) {
      // Левая граница
      const srcIdx = (y * width) * 4;
      const dstIdx = ((y + pad) * paddedWidth + x) * 4;
      paddedData[dstIdx] = data[srcIdx];
      paddedData[dstIdx + 1] = data[srcIdx + 1];
      paddedData[dstIdx + 2] = data[srcIdx + 2];
      paddedData[dstIdx + 3] = data[srcIdx + 3];

      // Правая граница
      const srcIdx2 = (y * width + width - 1) * 4;
      const dstIdx2 = ((y + pad) * paddedWidth + width + pad + x) * 4;
      paddedData[dstIdx2] = data[srcIdx2];
      paddedData[dstIdx2 + 1] = data[srcIdx2 + 1];
      paddedData[dstIdx2 + 2] = data[srcIdx2 + 2];
      paddedData[dstIdx2 + 3] = data[srcIdx2 + 3];
    }
  }

  for (let x = 0; x < paddedWidth; x++) {
    for (let y = 0; y < pad; y++) {
      // Верхняя граница
      const srcIdx = x * 4;
      const dstIdx = (y * paddedWidth + x) * 4;
      paddedData[dstIdx] = paddedData[srcIdx];
      paddedData[dstIdx + 1] = paddedData[srcIdx + 1];
      paddedData[dstIdx + 2] = paddedData[srcIdx + 2];
      paddedData[dstIdx + 3] = paddedData[srcIdx + 3];

      // Нижняя граница
      const srcIdx2 = ((height - 1) * paddedWidth + x) * 4;
      const dstIdx2 = ((height + pad + y) * paddedWidth + x) * 4;
      paddedData[dstIdx2] = paddedData[srcIdx2];
      paddedData[dstIdx2 + 1] = paddedData[srcIdx2 + 1];
      paddedData[dstIdx2 + 2] = paddedData[srcIdx2 + 2];
      paddedData[dstIdx2 + 3] = paddedData[srcIdx2 + 3];
    }
  }

  return { data: paddedData, width: paddedWidth, height: paddedHeight };
}

function applyKernel(data, width, height, kernel, isAlphaChannel) {
  const kernelSize = Math.sqrt(kernel.length);
  const paddedImage = padImage(data, width, height, kernelSize);
  const result = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      if (isAlphaChannel) {
        let sum = 0;
        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelIdx = ((y + ky) * paddedImage.width + (x + kx)) * 4;
            sum += paddedImage.data[pixelIdx + 3] * kernel[ky * kernelSize + kx];
          }
        }
        result[idx] = data[idx];
        result[idx + 1] = data[idx + 1];
        result[idx + 2] = data[idx + 2];
        result[idx + 3] = Math.max(0, Math.min(255, Math.round(sum)));
      } else {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = 0; ky < kernelSize; ky++) {
            for (let kx = 0; kx < kernelSize; kx++) {
              const pixelIdx = ((y + ky) * paddedImage.width + (x + kx)) * 4;
              sum += paddedImage.data[pixelIdx + c] * kernel[ky * kernelSize + kx];
            }
          }
          result[idx + c] = Math.max(0, Math.min(255, Math.round(sum)));
        }
        result[idx + 3] = data[idx + 3];
      }
    }
  }

  return result;
}

self.onmessage = function(e) {
  const { data, width, height, kernel, isAlphaChannel } = e.data;
  const result = applyKernel(new Uint8ClampedArray(data), width, height, kernel, isAlphaChannel);
  self.postMessage(result.buffer, [result.buffer]);
}; 