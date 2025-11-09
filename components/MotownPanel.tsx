/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const motownStyles = [
  {
    id: 'style1',
    name: 'Classic Studio',
    prompt: 'Ultra-detailed studio portrait of the uploaded person as a 1960s Motown soul singer. Chest-up framing, centered in the image, wearing a sharp, elegant suit or formal outfit, holding a metal vintage microphone close to their mouth. Clean seamless studio backdrop, soft three-point studio lighting, gentle vignette, smooth skin but natural texture, subtle film grain, high contrast. Widescreen 16:9 cinematic composition, lots of negative space around the subject, no text, no logo, no watermark.'
  },
  {
    id: 'style2',
    name: 'Friendly Promo',
    prompt: 'Cinematic studio promo portrait of the uploaded person styled as a 1960s Motown artist. Chest-up framing, friendly smile, relaxed shoulders, the person wearing a tailored suit or smart outfit, holding a retro microphone with both hands. Simple studio backdrop with a soft gradient, very soft flattering key light from the front and subtle rim light separating them from the background. Shallow depth of field, smooth bokeh, classic soul promo photo, 16:9 horizontal aspect ratio, centered composition, clean image with no text or graphics.'
  },
  {
    id: 'style3',
    name: 'Soul Diva Glam',
    prompt: 'High-end studio portrait of the uploaded person transformed into a glamorous 1960s soul diva. Framed from chest up, slightly turned shoulders, confident yet relaxed facial expression, direct eye contact with the camera. The person wears an elegant stage dress with visible texture, bold earrings and layered necklaces, holding a vintage microphone at chest level. Background is a smooth studio backdrop with subtle spotlight glow behind the head. Beauty-style lighting, soft shadows, refined makeup detail, cinematic grading. Shot in ultra-sharp 4K, widescreen 16:9, no text, no logo, no watermark.'
  },
  {
    id: 'style4',
    name: 'Monochrome Vintage',
    prompt: 'Timeless monochrome promo portrait of the uploaded person as a 1960s Motown singer. Chest-up composition, subject centered, wearing a classic stage outfit suitable for a soul artist, holding a retro microphone close to their mouth. Strong but soft studio lighting with clear highlights and deep shadows, subtle film grain, slightly faded analog film look. Background is a simple seamless studio backdrop with a gentle gradient. High contrast monochrome, very sharp details, YouTube thumbnail friendly, 16:9 horizontal frame, no text, no logo, no borders.'
  },
  {
    id: 'style5',
    name: 'Live On Stage',
    prompt: 'Cinematic live-performance scene featuring the uploaded person as a 1960s Motown soul singer on stage. 4K ultra-detailed portrait from the waist up, the person is singing passionately into a metal vintage microphone on a stand, wearing a stylish classic stage outfit with subtle shine. Strong spotlight from above and slightly to the side, dramatic shadows, faint smoke or haze in the background. Out-of-focus band lights and stage bokeh in the distance for depth. Shot in widescreen 16:9, subject centered, dynamic yet clean composition, no text, no logo, no watermark.'
  },
  {
    id: 'style6',
    name: 'Thumbnail Layout',
    prompt: 'Modern YouTube thumbnail-style portrait of the uploaded person reimagined as a 1960s Motown star. 16:9 horizontal composition, the person is placed on the left two-thirds of the frame, chest-up, holding a retro microphone, wearing a sharp, stylish outfit. Background is a clean studio backdrop with a smooth, minimal gradient and a very plain area on the right third of the frame reserved for later text (but no text generated in the image). Soft, even studio lighting, subtle vignette, minimalistic design, high clarity, no logo, no watermark.'
  },
];

interface MotownPanelProps {
  onGenerate: (requests: { name: string; prompt: string }[]) => void;
  isLoading: boolean;
}

const MotownPanel: React.FC<MotownPanelProps> = ({ onGenerate, isLoading }) => {
  const [selections, setSelections] = useState<Record<string, { selected: boolean; count: number }>>(() => {
    const initial: Record<string, { selected: boolean; count: number }> = {};
    motownStyles.forEach(style => {
      initial[style.id] = { selected: false, count: 1 };
    });
    return initial;
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [customCount, setCustomCount] = useState(1);

  const handleToggleSelection = (id: string) => {
    setSelections(prev => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));
  };

  const handleCountChange = (id: string, count: number) => {
    setSelections(prev => ({
      ...prev,
      [id]: { ...prev[id], count },
    }));
  };

  const handleGenerate = () => {
    const requests: { name: string; prompt: string }[] = [];
    
    motownStyles.forEach(style => {
      const selection = selections[style.id];
      if (selection.selected) {
        for (let i = 1; i <= selection.count; i++) {
          requests.push({
            name: `${style.name}${selection.count > 1 ? ` ${i}` : ''}`,
            prompt: style.prompt,
          });
        }
      }
    });

    if (customPrompt.trim()) {
      for (let i = 1; i <= customCount; i++) {
        requests.push({
          name: `Custom Style${customCount > 1 ? ` ${i}` : ''}`,
          prompt: customPrompt.trim(),
        });
      }
    }

    if (requests.length > 0) {
      onGenerate(requests);
    }
  };

  // FIX: Explicitly type the accumulator and current value in the reduce function to prevent type inference issues with Object.values.
  const totalImages = Object.values(selections).reduce((acc: number, curr: { selected: boolean; count: number }) => (acc + (curr.selected ? curr.count : 0)), 0) + (customPrompt.trim() ? customCount : 0);
  const canGenerate = !isLoading && totalImages > 0;

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <p className="text-sm text-center text-zinc-400">Reimagine your photo in classic Motown styles.</p>
      
      {motownStyles.map(style => (
        <div key={style.id} className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`motown-${style.id}`}
              checked={selections[style.id]?.selected || false}
              onChange={() => handleToggleSelection(style.id)}
              disabled={isLoading}
              className="w-5 h-5 accent-yellow-400 flex-shrink-0"
            />
            <label htmlFor={`motown-${style.id}`} className="flex-1 text-sm font-semibold text-zinc-200 cursor-pointer">{style.name}</label>
          </div>
          <AnimatePresence>
            {selections[style.id]?.selected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="flex flex-col gap-2 overflow-hidden"
              >
                <label className="text-xs font-medium text-zinc-400">
                  Number of variations: <span className="font-bold text-white">{selections[style.id].count}</span>
                </label>
                <input
                  type="range"
                  min="1" max="4" step="1"
                  value={selections[style.id].count}
                  onChange={(e) => handleCountChange(style.id, parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  disabled={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3 mt-1">
        <label htmlFor="custom-motown-prompt" className="text-xs font-medium text-zinc-400">
            Or describe a custom style (optional)
        </label>
        <textarea
            id="custom-motown-prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., 'A modern take on a Motown album cover...'"
            className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            rows={2}
            disabled={isLoading}
        />
        <AnimatePresence>
          {customPrompt.trim() && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="flex flex-col gap-2 overflow-hidden"
            >
              <label className="text-xs font-medium text-zinc-400">
                  Number of variations: <span className="font-bold text-white">{customCount}</span>
              </label>
              <input
                  type="range"
                  min="1" max="4" step="1"
                  value={customCount}
                  onChange={(e) => setCustomCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                  disabled={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
      >
          {`Generate ${totalImages} Image(s)`}
      </button>

      <p className="text-xs text-center text-zinc-500 mt-1">
        The AI will preserve the subject's identity while transforming them into the selected styles.
      </p>
    </div>
  );
};

export default MotownPanel;