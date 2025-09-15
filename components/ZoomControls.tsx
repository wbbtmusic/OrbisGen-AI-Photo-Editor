/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface ZoomControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  onReset: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, setZoom, onReset }) => {
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
    <div className="bg-black/60 backdrop-blur-sm p-2 rounded-lg flex items-center gap-2 shadow-lg">
        <button 
            onClick={decrementZoom}
            className="flex-shrink-0 w-8 h-8 rounded-md bg-zinc-700 hover:bg-zinc-600 text-lg font-bold flex items-center justify-center transition-colors"
            aria-label="Zoom out"
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
          className="w-24 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer range-lg accent-yellow-400"
          aria-label="Zoom slider"
        />
        <button 
            onClick={incrementZoom}
            className="flex-shrink-0 w-8 h-8 rounded-md bg-zinc-700 hover:bg-zinc-600 text-lg font-bold flex items-center justify-center transition-colors"
            aria-label="Zoom in"
        >
            +
        </button>
        <div className="w-12 text-center text-xs text-zinc-200 font-semibold">
            {Math.round(zoom * 100)}%
        </div>
         <button
            onClick={onReset}
            className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Reset
        </button>
    </div>
  );
};

export default ZoomControls;