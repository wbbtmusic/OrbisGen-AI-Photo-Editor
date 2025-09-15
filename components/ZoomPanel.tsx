/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ZoomPanelProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  onReset: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

const ZoomPanel: React.FC<ZoomPanelProps> = ({ zoom, setZoom, onReset }) => {
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };
  
  const incrementZoom = () => {
      setZoom(Math.min(MAX_ZOOM, zoom + 0.25));
  }
  
  const decrementZoom = () => {
      setZoom(Math.max(MIN_ZOOM, zoom - 0.25));
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
      <p className="text-sm text-zinc-400 text-center">Zoom in to see details or pan the image by dragging.</p>
      
      <div className="w-full flex flex-col items-start gap-3">
        <div className="w-full flex items-center gap-2">
            <button 
                onClick={decrementZoom}
                className="flex-shrink-0 w-8 h-8 rounded-md bg-zinc-700 hover:bg-zinc-600 text-lg font-bold flex items-center justify-center"
            >
                -
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step="0.01"
              value={zoom}
              onChange={handleZoomChange}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-lg accent-yellow-400"
            />
            <button 
                onClick={incrementZoom}
                className="flex-shrink-0 w-8 h-8 rounded-md bg-zinc-700 hover:bg-zinc-600 text-lg font-bold flex items-center justify-center"
            >
                +
            </button>
        </div>
        <div className="w-full text-center text-xs text-zinc-400">
            {Math.round(zoom * 100)}%
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full mt-2 bg-zinc-300 text-black font-semibold py-2 px-4 rounded-lg transition-colors hover:bg-white active:bg-zinc-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed"
      >
        Reset View
      </button>
    </div>
  );
};

export default ZoomPanel;