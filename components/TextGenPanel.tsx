/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

interface TextGenPanelProps {
  onApply: (text: string, style: string) => void;
  isLoading: boolean;
  hasSelection: boolean;
}

const TextGenPanel: React.FC<TextGenPanelProps> = ({ onApply, isLoading, hasSelection }) => {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('');

  const presets = [
    { name: 'Fire', style: 'as glowing, realistic fire' },
    { name: 'Neon', style: 'as a bright neon sign' },
    { name: 'Wood', style: 'carved into the surface' },
    { name: 'Gold', style: 'as reflective, 3D gold metal' },
    { name: 'Water', style: 'as if it were made of clear, flowing water' },
    { name: 'Smoke', style: 'as wisps of realistic smoke' },
    { name: 'Embroidery', style: 'as if it were stitched into the surface with thread' },
    { name: 'Graffiti', style: 'as colorful spray-painted graffiti on the surface' },
  ];

  const handleApply = () => {
    if (text.trim() && style.trim()) {
      onApply(text, style);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">
        {hasSelection ? 'Describe the text and its style.' : 'Select an area on the image for the text.'}
      </p>

      <div className="flex flex-col gap-3">
         <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Text to add (e.g., ORBIS)"
          className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || !hasSelection}
        />
        <textarea
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          placeholder="Describe text style (e.g., 'carved into wood')"
          className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
          rows={2}
          disabled={isLoading || !hasSelection}
        />
      </div>

       <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => setStyle(preset.style)}
            disabled={isLoading || !hasSelection}
            className={`w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${style === preset.style ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <button
        onClick={handleApply}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
        disabled={isLoading || !text.trim() || !style.trim() || !hasSelection}
      >
        Generate Text
      </button>

      <p className="text-xs text-center text-zinc-500 mt-1">
        AI will generate the text to match the image's perspective and lighting within the selected area.
      </p>
    </div>
  );
};

export default TextGenPanel;