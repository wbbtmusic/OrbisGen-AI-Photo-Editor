/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = 'Free' | '1:1' | '16:9' | '4:3';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('Free');
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { name: AspectRatio, value: number | undefined }[] = [
    { name: 'Free', value: undefined },
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
    { name: '4:3', value: 4 / 3 },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-4 animate-fade-in">
      <p className="text-sm text-zinc-400 text-center">Click and drag on the image to select a crop area.</p>
      
      <div className="w-full flex flex-col items-start gap-2">
        <span className="text-xs font-medium text-zinc-400">Aspect Ratio:</span>
        <div className="grid grid-cols-2 gap-2 w-full">
            {aspects.map(({ name, value }) => (
            <button
                key={name}
                onClick={() => handleAspectChange(name, value)}
                disabled={isLoading}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 active:scale-95 disabled:opacity-50 ${
                activeAspect === name 
                ? 'bg-zinc-200 text-black' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                }`}
            >
                {name}
            </button>
            ))}
        </div>
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
      >
        Apply Crop
      </button>
    </div>
  );
};

export default CropPanel;