/**
 * Image optimization helper to compress photos before saving,
 * ensuring high visual fidelity while keeping file sizes small (~50-80KB)
 * so databases and storage can easily handle hundreds of thousands (lakhs) of records.
 */
export function optimizePhoto(
  dataUrl: string,
  maxWidth = 600,
  maxHeight = 750,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }

    // Skip if it's already a very small data URL (e.g. < 60KB)
    if (dataUrl.length < 80000) {
      return resolve(dataUrl);
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width <= 0 || height <= 0) {
          return resolve(dataUrl);
        }

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(100, Math.round(width * ratio));
          height = Math.max(100, Math.round(height * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        // Clean white background behind image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        const optimized = canvas.toDataURL('image/jpeg', quality);
        resolve(optimized);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}
