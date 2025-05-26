export function parseGB7(buffer) {
  const bytes = new Uint8Array(buffer);
  const hasAlphaMask = bytes[5] !== 0;
  const width = (bytes[6] << 8) | bytes[7];
  const height = (bytes[8] << 8) | bytes[9];
  const pixels = bytes.slice(12);

  return { width, height, hasAlphaMask, pixels };
}

export function renderGB7ToCanvas(canvas, parsed) {
  const { width, height, pixels } = parsed;
  let hasAlphaMask = false;
  if (!width || !height || width <= 0 || height <= 0) {
    console.error("Некорректный размер GB7:", width, height);
    return { width: 0, height: 0 };
  }

  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < width * height; i++) {
    const byte = pixels[i];
    const gray7 = byte & 0b01111111;
    const gray = Math.round((gray7 / 127) * 255);
    const alpha = hasAlphaMask ? (byte & 0b10000000 ? 255 : 0) : 255;
    const j = i * 4;
    data[j] = gray;
    data[j + 1] = gray;
    data[j + 2] = gray;
    data[j + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    width,
    height,
    grayscale7Bit: true,
    hasAlphaMask,
    alphaChannelDetected: hasAlphaMask,
  };
}

export function renderImageToCanvas(canvas, imageFile, callback) {
  const url = URL.createObjectURL(imageFile);
  const img = new Image();

  img.onload = () => {
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const alphaDetected = detectAlpha(imageData);

    callback({
      width: img.width,
      height: img.height,
      grayscale7Bit: false,
      hasAlphaMask: false,
      alphaChannelDetected: alphaDetected,
    });

    URL.revokeObjectURL(url);
  };

  img.onerror = () => {
    console.error("Ошибка загрузки изображения");
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

export function detectAlpha(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 255) return true;
  }
  return false;
}
