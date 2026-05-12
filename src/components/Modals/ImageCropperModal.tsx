import React, { useState } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { motion } from 'motion/react';
import { X, Check, RotateCcw } from 'lucide-react';

interface ImageCropperModalProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ image, onCropComplete, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleConfirm = async () => {
    if (croppedAreaPixels) {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[3000] bg-black/90 flex flex-col backdrop-blur-md"
    >
      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteInternal}
        />
      </div>

      <div className="bg-white p-6 pb-12 rounded-t-[40px] flex flex-col gap-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-black text-slate-800 text-lg">Cắt ảnh vuông</h3>
          </div>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-black text-pastel-subtext uppercase tracking-widest">
            <span>Phóng to</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-4 font-bold text-slate-400 bg-slate-50 border border-pastel-border rounded-2xl active:scale-95 transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-4 font-black text-white bg-rose-500 rounded-2xl shadow-xl shadow-rose-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5" /> Xác nhận
          </button>
        </div>
      </div>
    </motion.div>
  );
}
