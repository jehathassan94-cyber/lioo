import React, { useState, useCallback, useEffect } from 'react';
import { enhanceWithGemini, colorizeWithGemini, removeBackgroundWithGemini } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import ImageCropper from './components/ImageCropper';
import type { PixelCrop } from 'react-image-crop';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
    });
};


const App: React.FC = () => {
    const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isColorizing, setIsColorizing] = useState<boolean>(false);
    const [isRemovingBackground, setIsRemovingBackground] = useState<boolean>(false);
    const [showCropper, setShowCropper] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleApiError = useCallback((e: any) => {
        const errorMessage = e.message || "حدث خطأ ما. الرجاء المحاولة مرة أخرى.";
        setError(errorMessage);
    }, []);

    // Effect to clean up object URLs to prevent memory leaks
    useEffect(() => {
        return () => {
            if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
            }
            if (enhancedImageUrl && enhancedImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(enhancedImageUrl);
            }
        };
    }, [originalImageUrl, enhancedImageUrl]);


    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
            if (enhancedImageUrl && enhancedImageUrl.startsWith('blob:')) URL.revokeObjectURL(enhancedImageUrl);

            setOriginalImageFile(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEnhancedImageUrl(null);
            setError(null);
        }
    };

    const runEnhancement = useCallback(async (fileToEnhance: File) => {
        setIsLoading(true);
        setError(null);
        setEnhancedImageUrl(null);

        try {
            const { base64, mimeType } = await fileToBase64(fileToEnhance);
            const resultUrl = await enhanceWithGemini(base64, mimeType);
            setEnhancedImageUrl(resultUrl);
        } catch (e: any) {
            handleApiError(e);
        } finally {
            setIsLoading(false);
        }
    }, [handleApiError]);

    const handleEnhanceClick = useCallback(async () => {
        if (!originalImageFile) {
            setError("الرجاء رفع صورة أولاً.");
            return;
        }
        await runEnhancement(originalImageFile);
    }, [originalImageFile, runEnhancement]);
    
    const handleEnhanceFurtherClick = useCallback(async () => {
        if (!enhancedImageUrl || !originalImageFile) {
            setError("لا توجد صورة محسنة للعمل عليها.");
            return;
        };

        const response = await fetch(enhancedImageUrl);
        const blob = await response.blob();
        const newFile = new File([blob], `enhanced_${originalImageFile.name}`, { type: blob.type });

        setOriginalImageFile(newFile);
        setOriginalImageUrl(URL.createObjectURL(newFile));

        await runEnhancement(newFile);

    }, [enhancedImageUrl, originalImageFile, runEnhancement]);
    
    const handleColorEnhanceClick = useCallback(async () => {
        if (!enhancedImageUrl) {
            setError("لا توجد صورة محسنة للعمل عليها.");
            return;
        };
        
        setIsColorizing(true);
        setError(null);

        try {
            const response = await fetch(enhancedImageUrl);
            const blob = await response.blob();
            const fileToColorize = new File([blob], 'image_to_colorize.png', { type: blob.type });

            const { base64, mimeType } = await fileToBase64(fileToColorize);
            const resultUrl = await colorizeWithGemini(base64, mimeType);
            
            if (enhancedImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(enhancedImageUrl);
            }
            setEnhancedImageUrl(resultUrl);

        } catch (e: any) {
             handleApiError(e);
        } finally {
            setIsColorizing(false);
        }

    }, [enhancedImageUrl, handleApiError]);

    const handleRemoveBackgroundClick = useCallback(async () => {
        if (!enhancedImageUrl) {
            setError("لا توجد صورة محسنة للعمل عليها.");
            return;
        }

        setIsRemovingBackground(true);
        setError(null);

        try {
            const response = await fetch(enhancedImageUrl);
            const blob = await response.blob();
            const fileToRemoveBg = new File([blob], 'image_to_process.png', { type: blob.type });

            const { base64, mimeType } = await fileToBase64(fileToRemoveBg);
            const resultUrl = await removeBackgroundWithGemini(base64, mimeType);

            if (enhancedImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(enhancedImageUrl);
            }
            setEnhancedImageUrl(resultUrl);

        } catch (e: any) {
            handleApiError(e);
        } finally {
            setIsRemovingBackground(false);
        }
    }, [enhancedImageUrl, handleApiError]);

    const handleDownloadClick = useCallback(() => {
        if (!enhancedImageUrl) return;
        const link = document.createElement('a');
        link.href = enhancedImageUrl;
        const extension = originalImageFile?.type.split('/')[1] || 'png';
        link.download = `enhanced_${originalImageFile?.name.replace(/\.[^/.]+$/, "") || 'image'}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [enhancedImageUrl, originalImageFile]);

    const handleCropConfirm = useCallback((image: HTMLImageElement, crop: PixelCrop) => {
        if (!crop.width || !crop.height) {
            return;
        }

        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const cropX = crop.x * scaleX;
        const cropY = crop.y * scaleY;
        const cropWidth = crop.width * scaleX;
        const cropHeight = crop.height * scaleY;

        canvas.width = Math.round(cropWidth);
        canvas.height = Math.round(cropHeight);

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setError("لا يمكن اقتصاص الصورة.");
            setShowCropper(false);
            return;
        }

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );
        
        const newUrl = canvas.toDataURL(originalImageFile?.type || 'image/png');
        
        if (enhancedImageUrl && enhancedImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(enhancedImageUrl);
        }
        setEnhancedImageUrl(newUrl);
        setShowCropper(false);

    }, [enhancedImageUrl, originalImageFile]);

    const isProcessing = isLoading || isColorizing || isRemovingBackground;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            {showCropper && enhancedImageUrl && (
                <ImageCropper
                    src={enhancedImageUrl}
                    onCropConfirm={handleCropConfirm}
                    onCancel={() => setShowCropper(false)}
                />
            )}
            <header className="w-full max-w-5xl text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                    محسن جودة الصور بالذكاء الاصطناعي
                </h1>
                <p className="text-gray-400 mt-2 text-lg">
                    حوّل صورك منخفضة الدقة إلى روائع فنية واضحة ونقية
                </p>
            </header>

            <main className="w-full max-w-5xl bg-gray-800/50 rounded-2xl shadow-2xl p-6 backdrop-blur-sm border border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Controls */}
                    <div className="flex flex-col gap-6 p-6 bg-gray-900/60 rounded-xl">
                        <div>
                            <label htmlFor="file-upload" className="block text-lg font-semibold mb-2 text-cyan-300">
                                1. اختر الصورة
                            </label>
                            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-cyan-500 px-1">
                                            <span>قم برفع ملف</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        <p className="pr-1">أو اسحبه وأفلته هنا</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                </div>
                            </div>
                        </div>

                        <div>
                             <h3 className="text-lg font-semibold mb-3 text-cyan-300">2. ابدأ التحسين</h3>
                            <button
                                onClick={handleEnhanceClick}
                                disabled={!originalImageFile || isProcessing}
                                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50"
                            >
                                {isLoading ? 'جاري التحسين...' : '✨ تحسين الجودة'}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg" onClick={() => setError(null)}>{error}</p>}
                    </div>

                    {/* Results */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-semibold mb-2 text-gray-300">الصورة الأصلية</h3>
                            <div className="w-full aspect-square bg-gray-900/60 rounded-lg flex items-center justify-center border-2 border-gray-700 overflow-hidden">
                                {originalImageUrl ? <img src={originalImageUrl} alt="Original" className="object-contain w-full h-full" /> : <p className="text-gray-500">سيتم عرض الصورة هنا</p>}
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <h3 className="text-xl font-semibold mb-2 text-gray-300">الصورة المحسّنة</h3>
                            <div className="w-full aspect-square bg-gray-900/60 rounded-lg flex items-center justify-center border-2 border-cyan-500/50 overflow-hidden">
                                {isProcessing ? <LoadingSpinner /> : enhancedImageUrl ? <img src={enhancedImageUrl} alt="Enhanced" className="object-contain w-full h-full" /> : <p className="text-gray-500">ستظهر النتيجة هنا</p>}
                            </div>
                             {enhancedImageUrl && !isProcessing && (
                                <div className="mt-4 w-full flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleEnhanceFurtherClick}
                                            disabled={isProcessing}
                                            className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            🚀 تحسين أكثر
                                        </button>
                                        <button
                                            onClick={handleColorEnhanceClick}
                                            disabled={isProcessing}
                                            className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            🎨 تحسين التلوين
                                        </button>
                                        <button
                                            onClick={handleRemoveBackgroundClick}
                                            disabled={isProcessing}
                                            className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            🖼️ مسح الخلفية
                                        </button>
                                         <button
                                            onClick={() => setShowCropper(true)}
                                            disabled={isProcessing}
                                            className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ✂️ اقتصاص الصورة
                                        </button>
                                    </div>
                                    <button
                                        onClick={handleDownloadClick}
                                        disabled={isProcessing}
                                        className="w-full flex justify-center items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        💾 تنزيل الصورة
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;