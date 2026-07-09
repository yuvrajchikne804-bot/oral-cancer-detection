export async function compressImage(file) {
  const MAX_WIDTH = 400;
  const JPEG_QUALITY = 0.5;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        // Size check (approx)
        const base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
        const sizeInBytes = Math.ceil((base64Length * 3) / 4);
        if (sizeInBytes > 1 * 1024 * 1024) {
          reject(new Error('Image too large'));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function convertAudioToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
