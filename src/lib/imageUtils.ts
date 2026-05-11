import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export interface CompressionSettings {
  maxWidth: number;
  quality: number;
}

export const compressImage = (file: File, settings: CompressionSettings): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > settings.maxWidth) {
          height = (settings.maxWidth / width) * height;
          width = settings.maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/webp',
          settings.quality / 100
        );
      };
      img.onerror = () => reject(new Error('Image load error'));
    };
    reader.onerror = () => reject(new Error('FileReader error'));
  });
};

export const uploadToFirebase = async (
  file: File, 
  folder: 'products' | 'customers' | 'kanban', 
  settings?: CompressionSettings
): Promise<string> => {
  let blob: Blob | File = file;
  if (settings) {
    blob = await compressImage(file, settings);
  }
  
  const filename = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `${folder}/${filename}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};
