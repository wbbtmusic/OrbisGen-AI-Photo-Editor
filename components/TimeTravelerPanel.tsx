/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';
import { motion, AnimatePresence } from 'framer-motion';

interface Preset {
  name: string;
  prompt: string;
}

interface PresetCategory {
  title: string;
  presets: Preset[];
}

const presetCategories: PresetCategory[] = [
    {
        title: 'Ancient & Mythical',
        presets: [
            { name: 'Stone Age', prompt: 'a prehistoric Stone Age setting with cave paintings and primitive tools' },
            { name: 'Ancient Egypt', prompt: 'Ancient Egypt with pyramids, hieroglyphs, and pharaohs' },
            { name: 'Roman Empire', prompt: 'the Roman Empire with classical architecture, togas, and legions' },
            { name: 'Viking Age', prompt: 'the Viking Age with longships, runestones, and Norse warriors' },
            { name: 'Mythical Atlantis', prompt: 'the mythical underwater city of Atlantis with bioluminescent structures and aquatic life' },
        ],
    },
    {
        title: 'Historical Eras',
        presets: [
            { name: 'Medieval Knight', prompt: 'a Medieval European setting with castles, knights, and armor' },
            { name: 'Renaissance Italy', prompt: 'Renaissance Italy with ornate art, architecture, and fashion' },
            { name: 'Pirate Age', prompt: 'the Golden Age of Piracy with sailing ships, treasure islands, and pirate attire' },
            { name: 'Wild West', prompt: 'the American Wild West with dusty towns, saloons, and cowboys' },
            { name: 'Victorian England', prompt: 'Victorian England with steam-powered technology, elaborate fashion, and gas lamps' },
        ],
    },
    {
        title: '20th Century',
        presets: [
            { name: '1920s Jazz Age', prompt: 'the Roaring Twenties with flapper dresses, jazz clubs, and early automobiles' },
            { name: '1940s Film Noir', prompt: 'a 1940s Film Noir movie with high-contrast black and white, shadows, and detective style' },
            { name: '1960s Hippie', prompt: 'the 1960s Hippie movement with psychedelic patterns, peace signs, and bell-bottoms' },
            { name: '1980s Neon', prompt: 'the 1980s with vibrant neon lights, retro technology, and big hair' },
            { name: '1990s Grunge', prompt: 'the 1990s Grunge scene with flannel shirts, band t-shirts, and an urban setting' },
        ],
    },
    {
        title: 'Future & Fantasy',
        presets: [
            { name: 'Cyberpunk', prompt: 'a high-tech, dystopian cyberpunk future with neon-drenched cityscapes and cybernetics' },
            { name: 'Steampunk', prompt: 'a Steampunk world with brass goggles, clockwork machinery, and Victorian-futuristic fashion' },
            { name: 'Post-Apocalyptic', prompt: 'a post-apocalyptic wasteland with makeshift gear and ruined cityscapes' },
            { name: 'Utopian Future', prompt: 'a clean, bright Utopian future with sleek architecture and advanced, harmonious technology' },
            { name: 'High Fantasy', prompt: 'a high fantasy realm with elves, dragons, and magical castles' },
        ],
    }
];

interface TimeTravelerPanelProps {
  onGenerate: (prompts: { name: string, prompt: string }[]) => void;
  isLoading: boolean;
}

const TimeTravelerPanel: React.FC<TimeTravelerPanelProps> = ({ onGenerate, isLoading }) => {
    const [selectedEras, setSelectedEras] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [customImageCount, setCustomImageCount] = useState(1);

    const toggleEra = (name: string) => {
        setSelectedEras(prev => 
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
    };

    const handleSelectCategory = (categoryPresets: Preset[]) => {
        const categoryNames = categoryPresets.map(p => p.name);
        setSelectedEras(prev => {
            const newSelection = new Set([...prev, ...categoryNames]);
            return Array.from(newSelection);
        });
    };

    const handleGenerate = () => {
        const promptsToGenerate: { name: string, prompt: string }[] = [];
        const allPresets = presetCategories.flatMap(c => c.presets);
        
        selectedEras.forEach(name => {
            const preset = allPresets.find(p => p.name === name);
            if (preset) {
                promptsToGenerate.push({ name: preset.name, prompt: preset.prompt });
            }
        });

        if (customPrompt.trim()) {
            if (customImageCount === 1) {
                promptsToGenerate.push({ name: 'Custom Era', prompt: customPrompt.trim() });
            } else {
                 for (let i = 1; i <= customImageCount; i++) {
                    promptsToGenerate.push({ 
                        name: `Custom Era ${i}`, 
                        prompt: customPrompt.trim() 
                    });
                }
            }
        }

        if (promptsToGenerate.length > 0) {
            onGenerate(promptsToGenerate);
        }
    };
    
    const handleGenerateSuggestion = (prompt: string) => {
        onGenerate([{ name: 'AI Suggestion', prompt: prompt }]);
    };

    const totalImages = selectedEras.length + (customPrompt.trim() ? customImageCount : 0);
    const canGenerate = !isLoading && totalImages > 0;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <p className="text-sm text-center text-zinc-400">Select eras or describe a time period to travel to.</p>

            {presetCategories.map(category => (
                <div key={category.title} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1">
                        <h3 className="text-sm font-semibold text-zinc-300">{category.title}</h3>
                        <button 
                            onClick={() => handleSelectCategory(category.presets)}
                            disabled={isLoading}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-50"
                        >
                            Select All
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {category.presets.map(preset => (
                            <button
                                key={preset.name}
                                onClick={() => toggleEra(preset.name)}
                                disabled={isLoading}
                                className={`w-full text-center font-semibold py-3 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${selectedEras.includes(preset.name) ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3 mt-1">
                <label htmlFor="custom-era-prompt" className="text-xs font-medium text-zinc-400">
                    Or describe a custom era (optional)
                </label>
                <textarea
                    id="custom-era-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., '1950s American diner with a jukebox'"
                    className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                    rows={2}
                    disabled={isLoading}
                />
            </div>
            
            <AnimatePresence>
                {customPrompt.trim() && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="flex flex-col gap-2 overflow-hidden"
                    >
                        <label className="text-xs font-medium text-zinc-400">
                            Number of variations: <span className="font-bold text-white">{customImageCount}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="4"
                            step="1"
                            value={customImageCount}
                            onChange={(e) => setCustomImageCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            disabled={isLoading}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
                {`Generate ${totalImages} Image(s)`}
            </button>

            <hr className="border-zinc-800 my-1" />
            <AiSuggestions
              toolContext="Historical Eras & Future Concepts"
              onApplySuggestion={handleGenerateSuggestion}
              isLoading={isLoading}
            />

            <p className="text-xs text-center text-zinc-500 mt-1">
                AI will preserve the subject while transforming the entire scene to the selected era.
            </p>
        </div>
    );
};

export default TimeTravelerPanel;