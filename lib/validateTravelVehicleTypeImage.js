const REQUIRED_SIZE = 700;
const ALPHA_TRANSPARENT_MAX = 250;

/**
 * Validates vehicle type artwork: exactly 700×700 and must include transparent pixels (PNG/WebP).
 * @param {File} file
 * @returns {Promise<{ ok: true } | { ok: false, message: string }>}
 */
export async function validateTravelVehicleTypeImage(file) {
  if (!file) return { ok: false, message: "Choose an image file." };

  const type = (file.type || "").toLowerCase();
  if (type !== "image/png" && type !== "image/webp") {
    return { ok: false, message: "Use a PNG or WebP image with a transparent background." };
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, message: "Could not read the image file." };
  }

  const { width, height } = bitmap;
  if (width !== REQUIRED_SIZE || height !== REQUIRED_SIZE) {
    bitmap.close?.();
    return {
      ok: false,
      message: `Image must be exactly ${REQUIRED_SIZE}×${REQUIRED_SIZE} pixels (yours is ${width}×${height}).`,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return { ok: false, message: "Could not validate image in this browser." };
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const { data } = ctx.getImageData(0, 0, width, height);
  let transparentPixels = 0;
  const step = 4;
  for (let i = 3; i < data.length; i += step * 8) {
    if (data[i] < ALPHA_TRANSPARENT_MAX) transparentPixels += 1;
  }

  if (transparentPixels < 10) {
    return {
      ok: false,
      message: "Image must have a transparent background (not a solid rectangle).",
    };
  }

  return { ok: true };
}
