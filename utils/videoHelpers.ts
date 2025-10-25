export type SupportedVideoAspectRatio = '16:9' | '9:16';

/**
 * Attempts to infer the closest supported aspect ratio for a given video URL
 * by reading its intrinsic dimensions from metadata.
 */
export const inferVideoAspectRatio = async (videoUrl: string): Promise<SupportedVideoAspectRatio> => {
  if (typeof document === 'undefined') {
    // Fallback during SSR or non-browser environments.
    return '16:9';
  }

  return new Promise<SupportedVideoAspectRatio>((resolve) => {
    const videoElement = document.createElement('video');

    const cleanup = () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('error', handleError);
      videoElement.src = '';
    };

    const finalize = (width?: number, height?: number) => {
      if (width && height) {
        const ratio = width / height;
        resolve(ratio >= 1 ? '16:9' : '9:16');
      } else {
        resolve('16:9');
      }
    };

    const handleLoadedMetadata = () => {
      finalize(videoElement.videoWidth, videoElement.videoHeight);
      cleanup();
    };

    const handleError = () => {
      finalize();
      cleanup();
    };

    videoElement.preload = 'metadata';
    videoElement.crossOrigin = 'anonymous';
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('error', handleError);
    videoElement.src = videoUrl;
  });
};
