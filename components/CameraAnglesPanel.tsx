/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import AiSuggestions from './AiSuggestions';

interface CameraAnglesPanelProps {
  onGenerate: (prompts: { name: string, prompt: string }[]) => void;
  isLoading: boolean;
}

const anglePresets = [
    { name: 'Low Angle', prompt: 'A dramatic low-angle shot, looking up at the subject from below.' },
    { name: 'High Angle', prompt: 'A high-angle shot, looking down at the subject from above.' },
    { name: 'Dutch Angle', prompt: 'A Dutch angle (canted) shot, with the camera tilted to create a sense of unease.' },
    { name: 'Profile View', prompt: 'A side profile shot of the subject.' },
    { name: 'From Behind', prompt: 'A shot from directly behind the subject, looking over their shoulder.' },
    { name: 'Overhead Shot', prompt: 'An overhead shot (bird\'s eye view), looking directly down from above.' },
    { name: 'Crouch & Peace', prompt: 'Change the subject\'s pose to a full crouch (squatting), facing the camera and making a peace sign. Preserve the person\'s identity and the scene\'s style.' },
    { name: 'Sit & Peace', prompt: 'Change the subject\'s pose to sitting on the floor with legs crossed, leaning slightly to one side, and making a peace sign. Preserve the person\'s identity and the scene\'s style.' },
    { name: 'Relaxed Sit', prompt: 'Change the subject\'s pose to sitting on the floor with one leg extended and the other bent, making a peace sign. Preserve the person\'s identity and the scene\'s style.' },
    { name: 'Close-up Crouch', prompt: 'A close-up shot of the subject in a crouching pose, smiling and making a peace sign near their face. Preserve the person\'s identity and the scene\'s style.' },
];

const lensPresets = {
  'Normal (50mm)': '', // Default, no modification
  'Wide-Angle (24mm)': ' The shot should have the characteristics of a wide-angle 24mm lens, creating a sense of scale with slight perspective distortion at the edges.',
  'Telephoto (85mm)': ' The shot should have the characteristics of a telephoto 85mm portrait lens, with a compressed background and beautiful bokeh.',
  'Ultra-Wide (16mm)': ' The shot should have the characteristics of an ultra-wide 16mm lens, with dramatic perspective distortion for an immersive, expansive feel.',
};

const CameraAnglesPanel: React.FC<CameraAnglesPanelProps> = ({ onGenerate, isLoading }) => {
    const [selectedAngles, setSelectedAngles] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [lens, setLens] = useState<keyof typeof lensPresets>('Normal (50mm)');

    const toggleAngle = (name: string) => {
        setSelectedAngles(prev => 
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
    };

    const handleGenerate = () => {
        const lensSuffix = lensPresets[lens];
        const promptsToGenerate: { name: string, prompt: string }[] = [];
        
        selectedAngles.forEach(name => {
            const preset = anglePresets.find(p => p.name === name);
            if (preset) {
                promptsToGenerate.push({ name: preset.name, prompt: preset.prompt + lensSuffix });
            }
        });

        if (customPrompt.trim()) {
            promptsToGenerate.push({ name: 'Custom Angle', prompt: customPrompt.trim() + lensSuffix });
        }

        if (promptsToGenerate.length > 0) {
            onGenerate(promptsToGenerate);
        }
    };

    const handleGenerateSuggestion = (prompt: string) => {
        const lensSuffix = lensPresets[lens];
        onGenerate([{ name: 'AI Suggestion', prompt: prompt + lensSuffix }]);
    };

    const canGenerate = !isLoading && (selectedAngles.length > 0 || customPrompt.trim());

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <p className="text-sm text-center text-zinc-400">Re-render the image from different camera angles or poses.</p>
            
            <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-zinc-400">Lens / Focal Length</label>
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(lensPresets) as Array<keyof typeof lensPresets>).map(lensName => (
                         <button
                            key={lensName}
                            onClick={() => setLens(lensName)}
                            disabled={isLoading}
                            className={`w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${lens === lensName ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
                        >
                            {lensName}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {anglePresets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => toggleAngle(preset.name)}
                        disabled={isLoading}
                        className={`w-full text-center font-semibold py-3 px-2 rounded-lg transition-colors duration-200 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${selectedAngles.includes(preset.name) ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="custom-angle-prompt" className="text-xs font-medium text-zinc-400">
                    Or describe a custom angle/pose (optional)
                </label>
                <textarea
                    id="custom-angle-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'from the perspective of a mouse on the floor looking up'"
                    className="flex-grow bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
                    rows={2}
                    disabled={isLoading}
                />
            </div>

            <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/40 active:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
            >
                {`Generate ${selectedAngles.length + (customPrompt.trim() ? 1 : 0)} Image(s)`}
            </button>

            <hr className="border-zinc-800 my-1" />
            <AiSuggestions
              toolContext="Camera Angles & Poses"
              onApplySuggestion={handleGenerateSuggestion}
              isLoading={isLoading}
            />

            <p className="text-xs text-center text-zinc-500 mt-1">
                The AI will preserve the subject and scene while changing the camera's viewpoint.
            </p>
        </div>
    );
};

export default CameraAnglesPanel;