/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Tool, Layer } from '../types';

interface EditorCanvasProps {
  imageUrl: string;
  activeTool: Tool;
  aspect?: number;
  onSelectionChange: (crop: PixelCrop | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  pan: { x: number; y: number };
  setPan: (pan: { x: number; y: number }) => void;
  layers: Layer[];
}

export interface EditorCanvasRef {
  getCroppedDataURL: (mimeType?: string) => string | null;
  clearSelection: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const SCROLL_SENSITIVITY = 0.001;

const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(({
    imageUrl,
    activeTool,
    aspect,
    onSelectionChange,
    zoom,
    setZoom,
    pan,
    setPan,
    layers,
}, ref) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    
    // Reset crop when tool changes
    useEffect(() => {
        setCrop(undefined);
        setCompletedCrop(undefined);
        onSelectionChange(null);
    }, [activeTool, imageUrl, onSelectionChange]);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (activeTool === 'crop' && aspect) {
            const { width, height } = e.currentTarget;
            const newCrop = centerCrop(
                makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
                width,
                height
            );
            setCrop(newCrop);
        }
    };
    
    useImperativeHandle(ref, () => ({
        getCroppedDataURL: (mimeType = 'image/png') => {
            const image = imgRef.current;
            if (!image || !completedCrop || !completedCrop.width || !completedCrop.height) {
                return null;
            }

            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            canvas.width = completedCrop.width;
            canvas.height = completedCrop.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            const pixelRatio = window.devicePixelRatio;
            canvas.width = completedCrop.width * pixelRatio;
            canvas.height = completedCrop.height * pixelRatio;
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(
              image,
              completedCrop.x * scaleX,
              completedCrop.y * scaleY,
              completedCrop.width * scaleX,
              completedCrop.height * scaleY,
              0, 0,
              completedCrop.width, completedCrop.height
            );

            return canvas.toDataURL(mimeType);
        },
        clearSelection: () => {
            setCrop(undefined);
            setCompletedCrop(undefined);
            onSelectionChange(null);
        }
    }));
    
    // Panning logic
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const getEventCoords = (e: MouseEvent | TouchEvent) => {
            if (e.type.startsWith('touch')) {
                return { x: (e as TouchEvent).touches[0].clientX, y: (e as TouchEvent).touches[0].clientY };
            }
            return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
        };

        const handlePanStart = (e: MouseEvent | TouchEvent) => {
            if (zoom > 1) {
                 e.preventDefault();
                isPanning.current = true;
                const { x, y } = getEventCoords(e);
                panStart.current = { x: x - pan.x, y: y - pan.y };
            }
        };

        const handlePanEnd = () => {
            isPanning.current = false;
        };

        const handlePanMove = (e: MouseEvent | TouchEvent) => {
            if (isPanning.current) {
                const { x, y } = getEventCoords(e);
                const newX = x - panStart.current.x;
                const newY = y - panStart.current.y;
                setPan({ x: newX, y: newY });
            }
        };
        
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom - e.deltaY * SCROLL_SENSITIVITY));
            setZoom(newZoom);
        }

        container.addEventListener('mousedown', handlePanStart);
        container.addEventListener('touchstart', handlePanStart, { passive: false });
        
        window.addEventListener('mouseup', handlePanEnd);
        window.addEventListener('touchend', handlePanEnd);

        window.addEventListener('mousemove', handlePanMove);
        window.addEventListener('touchmove', handlePanMove, { passive: false });
        
        container.addEventListener('wheel', handleWheel);

        return () => {
            container.removeEventListener('mousedown', handlePanStart);
            container.removeEventListener('touchstart', handlePanStart);

            window.removeEventListener('mouseup', handlePanEnd);
            window.removeEventListener('touchend', handlePanEnd);

            window.removeEventListener('mousemove', handlePanMove);
            window.removeEventListener('touchmove', handlePanMove);
            
            container.removeEventListener('wheel', handleWheel);
        };
    }, [pan, zoom, setPan, setZoom]);

    const isSelectionToolActive = ['crop', 'retouch', 'portrait', 'textGen', 'insert', 'projector', 'alternateHistory'].includes(activeTool);

    const getCursor = () => {
        if (isSelectionToolActive) return 'crosshair';
        if (isPanning.current) return 'grabbing';
        if (zoom > 1) return 'grab';
        return 'auto';
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
            style={{ cursor: getCursor() }}
        >
            {isSelectionToolActive ? (
                <ReactCrop 
                  crop={crop} 
                  onChange={c => setCrop(c)} 
                  onComplete={c => {
                    setCompletedCrop(c);
                    onSelectionChange(c);
                  }}
                  aspect={activeTool === 'crop' ? aspect : undefined}
                  className="max-h-[80vh] md:max-h-[80vh]"
                >
                     <img ref={imgRef} src={imageUrl} alt="Select an area" className="max-h-[80vh] md:max-h-[80vh] object-contain" onLoad={onImageLoad} />
                </ReactCrop>
            ) : (
                <div style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }} className="relative">
                    <img
                        ref={imgRef}
                        src={imageUrl}
                        alt="Current"
                        className="max-h-[80vh] max-w-full object-contain pointer-events-none"
                    />
                     {/* Render layers on top */}
                    {layers.map(layer => (
                        layer.visible && (
                            <img
                                key={layer.id}
                                src={layer.imageUrl}
                                alt={layer.name}
                                className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
                                style={{ opacity: layer.opacity }}
                            />
                        )
                    ))}
                </div>
            )}
        </div>
    );
});

export default EditorCanvas;