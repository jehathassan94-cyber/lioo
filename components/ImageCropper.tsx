import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop';

interface ImageCropperProps {
    src: string;
    onCropConfirm: (image: HTMLImageElement, crop: PixelCrop) => void;
    onCancel: () => void;
}

const aspectRatios = [
    { label: 'حر', value: undefined },
    { label: '1:1', value: 1 / 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:4', value: 3 / 4 },
];

const ImageCropper: React.FC<ImageCropperProps> = ({ src, onCropConfirm, onCancel }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    const imgRef = useRef<HTMLImageElement>(null);

    function centerAspectCrop(
        mediaWidth: number,
        mediaHeight: number,
        aspect: number | undefined
    ) {
        return centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspect,
                mediaWidth,
                mediaHeight
            ),
            mediaWidth,
            mediaHeight
        );
    }

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        // Start with a free-form crop
        setCrop(centerAspectCrop(width, height, undefined));
        setAspect(undefined);
    }

    const handleAspectChange = (newAspect: number | undefined) => {
        setAspect(newAspect);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            const newCrop = centerAspectCrop(width, height, newAspect);
            setCrop(newCrop);
        }
    };

    const handleConfirm = () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current) {
            onCropConfirm(imgRef.current, completedCrop);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
        >
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 max-w-4xl w-full flex flex-col items-center gap-4 max-h-[95vh] overflow-y-auto">
                 <h2 className="text-2xl font-bold text-cyan-400">اقتصاص الصورة</h2>
                 <p className="text-gray-400 text-center">حدد نسبة العرض إلى الارتفاع ثم اسحب لتعديل التحديد</p>
                
                <div className="flex flex-wrap justify-center gap-2 my-2">
                    {aspectRatios.map(ratio => (
                        <button 
                            key={ratio.label} 
                            onClick={() => handleAspectChange(ratio.value)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                aspect === ratio.value 
                                ? 'bg-cyan-500 text-white shadow-lg' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {ratio.label}
                        </button>
                    ))}
                </div>

                <div className="flex justify-center">
                   <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={aspect}
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={src}
                            onLoad={onImageLoad}
                            className="ReactCrop__image"
                        />
                    </ReactCrop>
                </div>
                <div className="flex gap-4 mt-4 w-full justify-center">
                    <button
                        onClick={onCancel}
                        className="w-1/3 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!completedCrop?.width || !completedCrop?.height}
                        className="w-1/3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ✂️ قص الصورة
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;