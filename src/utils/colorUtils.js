export function gb7ToRgb([r, g, b]) {
  return [r * 2, g * 2, b * 2]; 
}

export function rgbToXyz([r, g, b]) {
  const srgb = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  const [R, G, B] = srgb;

  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;

  return [X, Y, Z];
}

export function xyzToLab([X, Y, Z]) {
  const REF_X = 0.95047;
  const REF_Y = 1.00000;
  const REF_Z = 1.08883;

  const f = t => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);

  const fx = f(X / REF_X);
  const fy = f(Y / REF_Y);
  const fz = f(Z / REF_Z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [L, a, b];
}

export function labToLch([L, a, b]) {
  const C = Math.sqrt(a * a + b * b);
  const H = Math.atan2(b, a) * 180 / Math.PI;
  return [L, C, (H + 360) % 360];
}

export function rgbToOklch([r, g, b]) {
  const xyz = rgbToXyz([r, g, b]);
  const lab = xyzToLab(xyz);
  const lch = labToLch(lab);
  return lch;
}

export function contrastRatio(rgb1, rgb2) {
  const toLuminance = ([r, g, b]) => {
    const lum = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
  };

  const L1 = toLuminance(rgb1);
  const L2 = toLuminance(rgb2);
  return ((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2);
}
