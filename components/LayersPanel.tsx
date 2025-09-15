/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Layer } from '../types';
import { UploadIcon } from './icons';

interface LayersPanelProps {
  layers: Layer[];
  onAddLayer: (file: File) => void;
  onUpdateLayer: (id: string, updates: Partial<Omit<Layer, 'id' | 'name' | 'imageUrl'>>) => void;
  onRemoveLayer: (id: string) => void;
  onFlatten: () => void;
  isLoading: boolean;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onFlatten,
  isLoading,
}) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddLayer(e.target.files[0]);
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in h-full">
      <p className="text-sm text-center text-zinc-400">Add, manage, and merge image layers.</p>
      
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
        {/* Added layers (reversed) */}
        {[...layers].reverse().map(layer => (
            <div key={layer.id} className="bg-zinc-800 rounded-xl p-2 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <img src={layer.imageUrl} alt={layer.name} className="w-12 h-12 bg-zinc-700 rounded-lg flex-shrink-0 object-contain" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{layer.name}</p>
                    </div>
                    <button onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })} disabled={isLoading} className={`p-1 rounded-full transition-colors ${layer.visible ? 'text-white hover:bg-zinc-700' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}>
                        {layer.visible ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" /></svg>}
                    </button>
                    <button onClick={() => onRemoveLayer(layer.id)} disabled={isLoading} className="p-1 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-700 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Opacity</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={layer.opacity}
                        onChange={(e) => onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-sm accent-blue-500"
                        disabled={isLoading || !layer.visible}
                    />
                </div>
            </div>
        ))}
         {/* Base layer representation */}
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-zinc-400">Base</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-zinc-200 truncate">Background</p>
                <p className="text-xs text-zinc-500">The main image layer</p>
            </div>
        </div>
      </div>
      
      <div className="flex-shrink-0 flex flex-col gap-2 pt-2 border-t border-zinc-800">
        <input type="file" id="layer-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
        <label htmlFor="layer-upload" className="w-full text-center text-sm font-semibold py-2 px-4 rounded-xl transition-colors bg-zinc-700 text-zinc-200 hover:bg-zinc-600 cursor-pointer flex items-center justify-center gap-2">
            <UploadIcon className="w-5 h-5"/>
            Add Image Layer
        </label>
        <button
          onClick={onFlatten}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
          disabled={isLoading || layers.length === 0}
        >
          Flatten Layers
        </button>
      </div>
    </div>
  );
};

export default LayersPanel;