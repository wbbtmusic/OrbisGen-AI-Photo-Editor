/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { type OutfitLayer, type WardrobeItem } from '../types';
import { PlusIcon } from './icons';

interface FashionPanelProps {
  originalImageFile: File | null;
  fashionState: {
    modelImageUrl: string | null;
    outfitHistory: OutfitLayer[];
    currentOutfitIndex: number;
    wardrobe: WardrobeItem[];
    status: 'create_model' | 'dressing_room';
  };
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  onCreateModel: () => void;
  onGarmentSelect: (file: File, info: WardrobeItem) => void;
  onRemoveLastGarment: () => void;
  onReset: () => void;
  onFinish: () => void;
}

const FashionPanel: React.FC<FashionPanelProps> = ({ 
  originalImageFile, 
  fashionState,
  isLoading, 
  error,
  onCreateModel, 
  onGarmentSelect,
  onRemoveLastGarment,
  onReset,
  onFinish 
}) => {
  const { status, outfitHistory, currentOutfitIndex, wardrobe } = fashionState;
  const [localError, setLocalError] = useState<string | null>(null);

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        if (isLoading) return;
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            setLocalError(null);
            const customGarment: WardrobeItem = {
              id: `custom-${Date.now()}`,
              name: file.name,
              url: URL.createObjectURL(file), // for preview
            };
            onGarmentSelect(file, customGarment);
        }
    };

    if (status === 'dressing_room') {
        document.addEventListener('paste', handlePaste);
    }
    
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
  }, [isLoading, onGarmentSelect, status]);
  
  const urlToFile = async (url: string, filename: string): Promise<File> => {
      const res = await fetch(url);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type });
  };

  const handleWardrobeItemClick = async (item: WardrobeItem) => {
    if (isLoading || activeGarmentIds.includes(item.id)) return;
    setLocalError(null);
    try {
      const file = await urlToFile(item.url, item.name);
      onGarmentSelect(file, item);
    } catch (e) {
      console.error("Failed to load wardrobe item:", e);
      setLocalError('Failed to load wardrobe item. This may be a network or CORS issue.');
    }
  };
  
  const handleCustomGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLocalError(null);
      const customGarment: WardrobeItem = {
        id: `custom-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file), // for preview
      };
      onGarmentSelect(file, customGarment);
      e.target.value = ''; // Reset for re-uploading same file
    }
  };

  if (status === 'create_model') {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <p className="text-sm text-zinc-400">Use the current image to create a virtual try-on model.</p>
        {originalImageFile && (
          <img src={URL.createObjectURL(originalImageFile)} alt="Current" className="max-w-full h-auto max-h-64 rounded-lg object-contain" />
        )}
        <button onClick={onCreateModel} disabled={isLoading || !originalImageFile} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 active:bg-blue-700 disabled:bg-zinc-800 disabled:cursor-not-allowed">
          {isLoading ? 'Creating...' : 'Create Model'}
        </button>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 flex flex-col gap-4 min-h-0">
          {(error || localError) && <p className="text-xs text-red-400 text-center -mt-2">{error || localError}</p>}
          {/* Outfit Stack */}
          <div>
              <h3 className="text-xs font-semibold uppercase text-zinc-500 mb-2">Outfit Stack</h3>
              <div className="space-y-1.5">
                  {activeOutfitLayers.map((layer, index) => (
                      <div key={layer.garment?.id || 'base'} className="flex items-center justify-between bg-zinc-800 p-1.5 rounded-md">
                          <span className="text-sm font-medium text-zinc-300 truncate">{layer.garment ? layer.garment.name : 'Base Model'}</span>
                          {index > 0 && index === activeOutfitLayers.length - 1 && (
                              <button onClick={onRemoveLastGarment} disabled={isLoading} className="text-zinc-400 hover:text-red-400 transition-colors p-1 rounded-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
          {/* Wardrobe */}
          <div className="flex-1 min-h-0">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 mb-2">Wardrobe</h3>
              <div className="grid grid-cols-4 gap-2">
                  {wardrobe.map(item => {
                      const isActive = activeGarmentIds.includes(item.id);
                      return <button key={item.id} onClick={() => handleWardrobeItemClick(item)} disabled={isLoading || isActive} className="relative aspect-square bg-zinc-800 rounded-md overflow-hidden transition-all group disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <img src={item.url} alt={item.name} className="w-full h-full object-contain p-1" />
                          {isActive && <div className="absolute inset-0 bg-blue-600/70"></div>}
                      </button>
                  })}
                  <label htmlFor="custom-garment" className={`aspect-square border-2 border-dashed rounded-md flex items-center justify-center text-zinc-500 transition-colors ${isLoading ? 'cursor-not-allowed bg-zinc-800' : 'hover:border-zinc-500 hover:text-zinc-400 cursor-pointer'}`}>
                      <PlusIcon className="w-5 h-5"/>
                      <input id="custom-garment" type="file" className="hidden" accept="image/*" onChange={handleCustomGarmentUpload} disabled={isLoading} />
                  </label>
              </div>
          </div>
      </div>
      
      <div className="flex-shrink-0 flex items-center gap-2">
        <button onClick={onReset} disabled={isLoading} className="w-full bg-zinc-700 text-zinc-200 font-semibold py-2 px-4 text-sm rounded-xl transition-colors hover:bg-zinc-600 active:scale-95">
            Reset
        </button>
        <button onClick={onFinish} disabled={isLoading} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all hover:bg-blue-500 active:scale-95 disabled:bg-zinc-800 disabled:cursor-not-allowed">
            Finish
        </button>
      </div>
    </div>
  );
};

export default FashionPanel;