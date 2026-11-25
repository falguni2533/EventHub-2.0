const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_RAW_BYTES = 5 * 1024 * 1024;
const TARGET_SIZE = 256;

/**
 * Validates and compresses a selected image file into a 256x256 square data URL.
 */
export const processProfileImageFile = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No image file selected.'));
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error('Please choose a PNG, JPG, or WebP image file.'));
      return;
    }

    if (file.size > MAX_RAW_BYTES) {
      reject(new Error('Selected image must be 5 MB or smaller.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result);
          return;
        }

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, TARGET_SIZE, TARGET_SIZE);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
