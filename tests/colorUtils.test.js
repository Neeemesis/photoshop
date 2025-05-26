// tests/colorUtils.test.js
import {
  gb7ToRgb,
  rgbToXyz,
  xyzToLab,
  labToLch,
  rgbToOklch,
  contrastRatio,
} from '../utils/colorUtils';

function closeTo(a, b, delta = 0.01) {
  return Math.abs(a - b) <= delta;
}

test('gb7ToRgb converts correctly', () => {
  expect(gb7ToRgb([64, 64, 64])).toEqual([128, 128, 128]);
});

test('rgbToXyz returns expected values for white', () => {
  const [x, y, z] = rgbToXyz([255, 255, 255]);
  expect(closeTo(x, 0.950)).toBe(true);
  expect(closeTo(y, 1.000)).toBe(true);
  expect(closeTo(z, 1.089)).toBe(true);
});

test('rgbToLab via XYZ returns L~100 for white', () => {
  const lab = xyzToLab(rgbToXyz([255, 255, 255]));
  expect(closeTo(lab[0], 100)).toBe(true);
});

test('Lab to LCH conversion returns correct hue for red', () => {
  const xyz = rgbToXyz([255, 0, 0]);
  const lab = xyzToLab(xyz);
  const [, , h] = labToLch(lab);
  expect(h).toBeGreaterThanOrEqual(35);
  expect(h).toBeLessThanOrEqual(45);
});

test('Contrast ratio for black and white is ~21', () => {
  const contrast = contrastRatio([0, 0, 0], [255, 255, 255]);
  expect(parseFloat(contrast)).toBeCloseTo(21, 1);
});

test('rgbToOklch for pure blue gives expected result', () => {
  const [l, c, h] = rgbToOklch([0, 0, 255]);
  expect(l).toBeGreaterThan(0);
  expect(c).toBeGreaterThan(0);
  expect(h).toBeGreaterThanOrEqual(260);
});
