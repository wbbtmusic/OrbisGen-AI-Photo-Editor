/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Fix: Import GeneratedAngleImage and use a union type for the generatedImages prop.
import { type GeneratedImage, type GeneratedAngleImage, type ImageGenerationStatus } from '../types';
import { createAlbumPage } from '../lib/albumUtils';
import { DownloadIcon, TextGenIcon, SparklesIcon } from './icons';

interface AestheticResultsViewProps {
    title: string;
    subtitle?: string | null;
    generationCategories: string[];
    generatedImages: Record<string, GeneratedImage | GeneratedAngleImage>;
    onUseInEditor: (imageUrl: string) => void;
    onBack: () => void;
    isGenerating: boolean;
}

const GeneratedImageCard: React.FC<{
    imageUrl?: string;
    caption: string;
    status: ImageGenerationStatus;
    error?: string;
    onUse: () => void;
    onDownload: () => void;
    onEnlarge: () => void;
}> = ({ imageUrl, caption, status, error, onUse, onDownload, onEnlarge }) => {
    
    const content = () => {
        switch (status) {
            case 'pending':
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-400">
                        <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xs">Generating...</span>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400 p-4 text-center" title={error}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-semibold">Generation Failed</span>
                    </div>
                );
            case 'done':
                if (imageUrl) {
                    return (
                        <>
                            <img src={imageUrl} alt={caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={onUse} className="p-3 bg-white/90 rounded-full text-black hover:bg-white active:scale-90 transition-transform flex flex-col items-center text-xs font-semibold gap-1" aria-label={`Use ${caption} in editor`}>
                                    <TextGenIcon className="w-5 h-5" />
                                </button>
                                <button onClick={onDownload} className="p-3 bg-white/90 rounded-full text-black hover:bg-white active:scale-90 transition-transform flex flex-col items-center text-xs font-semibold gap-1" aria-label={`Download image for ${caption}`}>
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </>
                    );
                }
                return null;
        }
    };
    
    return (
        <div 
            className="aspect-square relative bg-zinc-800 rounded-lg overflow-hidden group cursor-pointer"
            onClick={status === 'done' && imageUrl ? onEnlarge : undefined}
        >
           {content()}
           <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <p className="text-white font-semibold text-sm truncate">{caption}</p>
            </div>
        </div>
    );
};


const AestheticResultsView: React.FC<AestheticResultsViewProps> = ({
    title,
    subtitle,
    generationCategories,
    generatedImages,
    onUseInEditor,
    onBack,
    isGenerating,
}) => {
    const [isDownloadingAlbum, setIsDownloadingAlbum] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<{ url: string, caption: string } | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setEnlargedImage(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleDownloadImage = (imageUrl: string, caption: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${caption.replace(/\s+/g, '_')}_orbisgen.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleDownloadCollage = async () => {
      setIsDownloadingAlbum(true);
      try {
        const successfulImages: Record<string, string> = {};
        // FIX: Replaced forEach with a for...of loop over Object.keys to ensure proper type inference of `result`, avoiding errors with `unknown` type.
        for (const category of Object.keys(generatedImages)) {
            const result = generatedImages[category];
            if (result?.status === 'done' && result.url) {
                successfulImages[category] = result.url;
            }
        }

        if (Object.keys(successfulImages).length === 0) {
            alert("No images have been generated successfully to create a collage.");
            return;
        }

        const albumDataUrl = await createAlbumPage(
            successfulImages, 
            title || "My AI Creations"
        );
        
        const link = document.createElement('a');
        link.href = albumDataUrl;
        link.download = `${(title || "collage").replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (error) {
        console.error("Failed to create or download collage:", error);
        alert("Sorry, there was an error creating the collage page.");
      } finally {
        setIsDownloadingAlbum(false);
      }
    };
    
    return (
        <motion.div 
            key="persona-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full flex flex-col bg-zinc-950 p-4 sm:p-6 lg:p-8"
        >
            <header className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    {subtitle && <p className="font-permanent-marker text-lg text-yellow-400">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownloadCollage}
                        disabled={isDownloadingAlbum || isGenerating}
                        className="flex items-center gap-2 bg-zinc-700 text-zinc-200 font-semibold py-2 px-4 text-sm rounded-lg transition-colors hover:bg-zinc-600 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                    >
                        {isDownloadingAlbum ? (
                             <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <DownloadIcon className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{isDownloadingAlbum ? 'Creating...' : 'Download Collage'}</span>
                        <span className="sm:hidden">{isDownloadingAlbum ? 'Creating...' : 'Collage'}</span>
                    </button>
                    <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors py-2 px-4 text-sm rounded-lg hover:bg-zinc-800">
                        Back
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto relative p-4 -m-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                     {generationCategories.map((category, index) => {
                        const imageData = generatedImages[category];
                        return (
                             <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                            >
                                {/* Fix: imageData is correctly typed due to the fix in the component's props, allowing safe property access. */}
                                <GeneratedImageCard
                                    caption={category}
                                    status={imageData?.status || 'pending'}
                                    imageUrl={imageData?.url}
                                    error={imageData?.error}
                                    onUse={() => imageData?.url && onUseInEditor(imageData.url)}
                                    onDownload={() => imageData?.url && handleDownloadImage(imageData.url, category)}
                                    onEnlarge={() => {
                                        if (imageData?.status === 'done' && imageData.url) {
                                            setEnlargedImage({ url: imageData.url, caption: category });
                                        }
                                    }}
                                />
                            </motion.div>
                        );
                     })}
                </div>
                {isGenerating && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-zinc-300 flex items-center gap-2 shadow-lg">
                        <SparklesIcon className="w-4 h-4 text-yellow-400" />
                        <span>AI is creating your images...</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {enlargedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEnlargedImage(null)}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        aria-modal="true"
                        role="dialog"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-zinc-900 rounded-lg shadow-xl flex flex-col"
                        >
                            <button
                                onClick={() => setEnlargedImage(null)}
                                className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-lg"
                                aria-label="Close enlarged view"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <div className="p-4">
                                <img src={enlargedImage.url} alt={enlargedImage.caption} className="block rounded-md object-contain max-w-[85vw] max-h-[75vh]" />
                            </div>
                            
                            <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-black/20 rounded-b-lg flex items-center justify-between gap-4">
                                <p className="font-permanent-marker text-lg text-yellow-400 truncate">{enlargedImage.caption}</p>
                                <div className="flex items-center gap-2">
                                     <button
                                        onClick={() => handleDownloadImage(enlargedImage.url, enlargedImage.caption)}
                                        className="flex items-center gap-2 bg-zinc-700 text-zinc-200 font-semibold py-2 px-3 text-sm rounded-lg transition-colors hover:bg-zinc-600 active:scale-95"
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        <span>Save</span>
                                    </button>
                                    <button
                                        onClick={() => onUseInEditor(enlargedImage.url)}
                                        className="flex items-center gap-2 bg-white text-black font-semibold py-2 px-3 text-sm rounded-lg transition-colors hover:bg-zinc-200 active:scale-95"
                                    >
                                        <TextGenIcon className="w-4 h-4" />
                                        <span>Use in Editor</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AestheticResultsView;