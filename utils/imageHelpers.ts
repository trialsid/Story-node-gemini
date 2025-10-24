/**
 * Converts any image URL (data URL, blob URL, http URL) to a base64 data URL
 * This is needed for APIs that require base64-encoded images
 */
export const convertToDataUrl = async (url: string): Promise<string> => {
  // If already a data URL, return as-is
  if (url.startsWith('data:')) {
    return url;
  }

  // Load image and convert to data URL
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };

    img.src = url;
  });
};
