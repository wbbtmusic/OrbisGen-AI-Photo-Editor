/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface AdjustmentPanelProps {
  onApplyAdjustment: (prompt: string) => void;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ onApplyAdjustment, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Enhance', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'Warmth', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'Cool Tone', prompt: 'Adjust the color temperature to give the image a cooler, cinematic blue tone.' },
    { name: 'Vibrancy', prompt: 'Subtly boost the vibrancy and saturation of the colors in the image, making them pop without looking unnatural.' },
    { name: 'B&W', prompt: 'Convert the image to a dramatic, high-contrast black and white.' },
    { name: 'Soften', prompt: 'Apply a soft focus or Orton effect to give the image a dreamy, ethereal glow.' },
    { name: 'Dramatic', prompt: 'Add dramatic, professional studio lighting to the main subject, increasing contrast and shadows.' },
    { name: 'Motion Blur', prompt: 'Apply an extreme, photorealistic motion blur effect to the entire image, simulating a very shaky camera or fast movement, similar to an "iPhone motion blur" style action shot. The core subject should remain somewhat recognizable but heavily blurred with motion trails.' },
    { name: 'Analog Film', prompt: 'Emulate the look of analog film by adding subtle grain and slightly shifting the colors for a nostalgic feel.' },
    { name: 'Orange & Teal', prompt: 'Apply a cinematic Orange and Teal color grade. Push highlights towards a warm orange and shadows towards a cool teal for a modern, popular film look.' },
    { name: 'Matte Look', prompt: 'Create a trendy matte look by slightly lifting the black point and desaturating the shadows, giving the image a soft, non-glossy, filmic appearance.' },
    { name: 'Infrared Glow', prompt: 'Simulate an infrared photo effect, making foliage bright white and skies dark, creating a surreal, dream-like atmosphere.' },
    { name: 'Pastel Hues', prompt: 'Shift the color palette to soft, desaturated pastel hues. Brighten the image and lower the contrast for a light, airy, and gentle aesthetic.' },
  ];

  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyAdjustment(activePrompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Apply a professional adjustment.</p>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="Or describe an adjustment..."
        className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      />

      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                disabled={isLoading || !activePrompt.trim()}
            >
                Apply Adjustment
            </button>
        </div>
      )}

      <hr className="border-zinc-800 my-2" />
      <AiSuggestions
        toolContext="Photo Adjustments"
        onApplySuggestion={onApplyAdjustment}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdjustmentPanel;