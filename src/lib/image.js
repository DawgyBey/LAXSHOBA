// Shrinks a photo in the browser before it's uploaded, so a phone photo (often
// 4-12MB straight out of the camera) never turns into a multi-megabyte image the
// storefront has to download. Long edge is capped and it's re-encoded as JPEG,
// which is far smaller than PNG for photographs.
export async function resizeImageFile(file, { maxDimension = 1600, quality = 0.82 } = {}) {
  // Only downsize actual photos. Leave anything already small, or non-raster
  // files like SVGs, untouched.
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file; // canvas encoding failed for some reason — fall back to the original

  // Only use the resized version if it's actually smaller.
  if (blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg' });
}
