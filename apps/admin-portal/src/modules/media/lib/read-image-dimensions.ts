export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Read an image File's natural dimensions client-side (for the confirm step). Resolves
 * `undefined` for non-images or on a load error — the confirm body then omits width/height
 * (both optional), so the flow degrades gracefully.
 */
export function readImageDimensions(
  file: File,
): Promise<ImageDimensions | undefined> {
  if (!file.type.startsWith('image/')) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
      URL.revokeObjectURL(url);
      resolve(dimensions);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    image.src = url;
  });
}
