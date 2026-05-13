
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export interface CompressionSettings {
  maxWidth: number;
  quality: number;
}

export const compressImage = (file: File, settings: CompressionSettings): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    console.log(`Starting compression for ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
    const reader = new FileReader();
    
    // Set a timeout for the whole process
    const timeout = setTimeout(() => {
      reject(new Error('Xử lý ảnh quá lâu (Timeout)'));
    }, 15000);

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
          clearTimeout(timeout);
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        console.log(`Canvas generated: ${width}x${height}. Converting to blob...`);
        
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            if (blob) {
              console.log(`Compression complete. New size: ${(blob.size / 1024).toFixed(1)} KB`);
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/jpeg',
          settings.quality / 100
        );
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Image load error'));
      };
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('FileReader error'));
    };
  });
};

export const uploadToFirebase = async (
  file: File, 
  folder: 'products' | 'customers' | 'kanban', 
  settings?: CompressionSettings
): Promise<string> => {
  // Enforce 1MB limit for the initial file
  const MAX_SIZE = 1 * 1024 * 1024; // 1MB
  if (file.size > MAX_SIZE) {
    throw new Error(`Ảnh "${file.name}" quá lớn (${(file.size / (1024 * 1024)).toFixed(2)}MB). Giới hạn tối đa là 1MB.`);
  }

  // Use a default compression if none provided to ensure ALL images are compressed
  const finalSettings = settings || { maxWidth: 1200, quality: 80 };
  
  const blob = await compressImage(file, finalSettings);
  
  const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, blob);
  return await getDownloadURL(snapshot.ref);
};
