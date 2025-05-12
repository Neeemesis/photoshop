import { nearestNeighbor, bilinear } from "./interpolation";

export function scaleImage(canvas, width, height, algorithm = "bilinear") {
  const ctx = canvas.getContext("2d");
  const srcImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let result;

  if (algorithm === "nearest") {
    result = nearestNeighbor(
      srcImage.data,
      canvas.width,
      canvas.height,
      width,
      height
    );
  } else {
    result = bilinear(
      srcImage.data,
      canvas.width,
      canvas.height,
      width,
      height
    );
  }

  canvas.width = width;
  canvas.height = height;
  ctx.putImageData(result, 0, 0);
}
