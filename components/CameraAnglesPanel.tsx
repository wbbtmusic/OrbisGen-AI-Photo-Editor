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
        title: 'Camera Angles',
        presets: [
            { name: 'Low Angle', prompt: 'A dramatic low-angle shot, looking up at the subject from below.' },
            { name: 'High Angle', prompt: 'A high-angle shot, looking down at the subject from above.' },
            { name: 'Overhead Shot', prompt: 'An overhead shot (bird\'s eye view), looking directly down from above.' },
            { name: 'Dutch Angle', prompt: 'A Dutch angle (canted) shot, with the camera tilted to create a sense of unease.' },
            { name: 'Extreme Close-Up', prompt: 'A dramatic extreme close-up shot, focusing tightly on the subject\'s face.' },
            { name: 'Full Body Shot', prompt: 'A full body shot from a distance, showing the subject from head to toe within their environment.' },
            { name: 'Cowboy Shot', prompt: 'A medium-long "cowboy shot," framed from mid-thighs up.' },
            { name: 'Profile View', prompt: 'A side profile shot of the subject.' },
        ],
    },
    {
        title: 'Standing Poses',
        presets: [
            { name: 'From Behind', prompt: 'A shot from directly behind the subject, looking over their shoulder.' },
            { name: 'Looking Back', prompt: 'Pose the subject walking away from the camera, but looking back over their shoulder.' },
            { name: 'Leaning Casually', prompt: 'Change the subject\'s pose to be casually leaning against a surface (imagine one if not present). Preserve their identity and the scene\'s style.' },
            { name: 'Thinking Pose', prompt: 'Change the subject\'s pose to a thoughtful stance, perhaps with a hand on their chin, looking contemplatively into the distance. Preserve their identity and the scene\'s style.' },
            { name: 'Candid Laughter', prompt: 'Change the subject\'s expression to candid, genuine laughter, looking slightly away from the camera. Preserve their identity and the scene\'s style.' },
            { name: 'Hero Pose', prompt: 'Change the subject\'s pose to a confident "hero" stance with hands on hips. Preserve their identity and the scene\'s style.' },
        ]
    },
    {
        title: 'Sitting Poses',
        presets: [
            { name: 'Crouch & Peace', prompt: 'Change the subject\'s pose to a full crouch (squatting), facing the camera and making a peace sign. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Sit & Peace', prompt: 'Change the subject\'s pose to sitting on the floor with legs crossed, leaning slightly to one side, and making a peace sign. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Relaxed Sit', prompt: 'Change the subject\'s pose to sitting on the floor with one leg extended and the other bent, making a peace sign. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Close-up Crouch', prompt: 'A close-up shot of the subject in a crouching pose, smiling and making a peace sign near their face. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Sitting on Chair', prompt: 'Change the subject\'s pose to be sitting comfortably on a simple wooden chair, looking towards the camera.' },
            { name: 'Hugging Knees', prompt: 'Change the subject\'s pose to be sitting on the floor, hugging their knees to their chest, with a thoughtful or cozy expression.' },
            { name: 'Cat Pose Sit', prompt: 'Change the subject\'s pose to be sitting on the floor in a playful "cat pose," with knees bent and hands on the floor like paws, looking at the camera.' },
            { name: 'Lounging on Floor', prompt: 'Change the subject\'s pose to be lounging casually on their side on the floor, propped up by one elbow.' },
            { name: 'Thinking on Steps', prompt: 'Change the subject\'s pose to be sitting on steps, leaning forward with their chin resting on their hands in a thoughtful expression.' },
            { name: 'Reading a Book', prompt: 'Change the subject\'s pose to be sitting down comfortably, engrossed in reading a book.' },
        ]
    },
    {
        title: 'Cat Poses',
        presets: [
            { name: 'Standing (Side)', prompt: 'Change the subject\'s pose to be standing on all fours like a cat, viewed from the side. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Standing (Front)', prompt: 'Change the subject\'s pose to be standing on all fours like a cat, facing the camera. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Walking on all fours', prompt: 'Change the subject\'s pose to be walking on all fours like a cat, captured mid-stride. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Big Stretch', prompt: 'Change the subject\'s pose to a "big stretch" like a cat, with their front arms extended forward and back arched. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Innocent Stretch', prompt: 'Transform the subject into the absolute pinnacle of cuteness by posing them in the most heart-meltingly innocent kitten stretch imaginable. Their front paws must be stretched far, far forward, flat on the ground, as if pleading for a gentle pat. Their little rear end should be playfully and steeply angled up towards the sky, with their tail curled in a soft, inquisitive question mark. Their head should be very low to the ground, almost touching it, while they peer forward with enormous, wide, sparkling eyes full of pure innocence and gentle curiosity. The entire pose should scream "I am just a tiny, harmless, adorable creature." CRITICAL: The person\'s identity must be perfectly preserved, just adapted into this impossibly cute pose. The scene\'s style must also be preserved.' },
            { name: 'Cat Sit (Side)', prompt: 'Change the subject\'s pose to a \'cat sit\' position as seen from the side. They should be sitting on the floor with their knees bent and feet tucked under, with a straight back. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Cat Sit (Front)', prompt: 'Change the subject\'s pose to a classic \'cat sit\' position as seen from the front. They should be sitting upright on the floor with their knees bent and together. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Cat Loaf', prompt: 'Change the subject\'s pose to the \'cat loaf\' position. They should be sitting with all limbs tucked underneath their body, resembling a loaf of bread. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Crouch & Pounce', prompt: 'Change the subject\'s pose to a low crouch, as if about to pounce, in a playful cat-like manner. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Curled Up Sleep', prompt: 'Change the subject\'s pose to be curled up on the floor as if sleeping like a cat, with their head tucked in. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Playful Paw', prompt: 'Change the subject\'s pose to be sitting on the floor and playfully reaching out one hand as if batting at something, like a cat. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Sunbathing Stretch', prompt: 'Change the subject\'s pose to be lying stretched out on the floor, as if sunbathing like a cat. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Box Sit', prompt: 'Change the subject\'s pose to be sitting inside an invisible box on the floor, perfectly fitting within its imaginary confines, just like a cat would. Preserve the person\'s identity and the scene\'s style.' },
        ]
    },
     {
        title: 'Action Poses',
        presets: [
            { name: 'Jumping', prompt: 'Change the subject\'s pose to be jumping joyfully in the air. Preserve their identity and the scene\'s style.' },
            { name: 'Walking', prompt: 'Capture the subject in a natural walking motion, mid-stride. Preserve their identity and the scene\'s style.' },
            { name: 'Running', prompt: 'Capture the subject in a dynamic running pose. Preserve their identity and the scene\'s style.' },
            { name: 'Dancing', prompt: 'Change the subject\'s pose to a graceful or energetic dancing motion. Preserve their identity and the scene\'s style.' },
        ]
    },
    {
        title: 'Dynamic & Inverted Poses',
        presets: [
            { name: 'Handstand', prompt: 'Change the subject\'s pose to doing a handstand. Their body should be upside down, balanced on their hands. CRITICAL INSTRUCTION ON CLOTHING PHYSICS: If the subject is wearing a skirt or dress, it MUST fall downwards due to gravity, draping over their torso and towards their head. Hair must also fall downwards towards the ground. The effect must be realistic. Preserve their identity and the scene\'s style.' },
            { name: 'Headstand', prompt: 'Change the subject\'s pose to doing a headstand. Their body should be inverted, balanced on their head and forearms. CRITICAL INSTRUCTION ON CLOTHING PHYSICS: If the subject is wearing a skirt or dress, it MUST fall downwards due to gravity, draping over their torso and towards their head. Hair must also fall downwards towards the ground. The effect must be realistic. Preserve their identity and the scene\'s style.' },
            { name: 'Cartwheel', prompt: 'Capture the subject in the middle of a dynamic cartwheel, with their body inverted and limbs extended. CRITICAL INSTRUCTION ON CLOTHING PHYSICS: At the peak of the inverted motion, if the subject is wearing a skirt or dress, it MUST fall downwards due to gravity, draping over their torso and towards their head. Hair must also fall downwards towards the ground. The effect must be realistic and dynamic. Preserve their identity and the scene\'s style.' },
            { name: 'Hanging Upside Down', prompt: 'Change the subject\'s pose to hanging upside down, as if from a bar or branch just out of frame. Their body should be inverted. CRITICAL INSTRUCTION ON CLOTHING PHYSICS: If the subject is wearing a skirt or dress, it MUST fall downwards due to gravity, draping over their torso and towards their head. Hair must also fall downwards towards the ground. The effect must be realistic. Preserve their identity and the scene\'s style.' },
        ]
    },
    {
        title: 'Artistic Poses',
        presets: [
            { name: 'Sofa Allure', prompt: 'Change the subject\'s pose to be sitting on a sofa, leaning back slightly on one arm. Their legs should be elegantly arranged—one bent toward the body and one more extended—with their gaze directed confidently at the camera. Preserve their identity and the scene\'s style.' },
            { name: 'Lounging Gaze', prompt: 'Change the subject\'s pose to lounging casually on their side on a sofa or floor, propped up by one elbow, looking directly at the camera with a relaxed expression. Preserve their identity and the scene\'s style.' },
            { name: 'Over the Shoulder', prompt: 'Pose the subject looking back over their shoulder at the camera with a soft, inviting expression. Preserve their identity and the scene\'s style.' },
            { name: 'Sitting Pretty', prompt: 'Change the subject\'s pose to sitting on the floor with knees drawn up together, wrapping their arms around their legs. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Delicate Touch', prompt: 'A close-up shot focusing on the subject\'s face, with their hand gently touching their own cheek or lip in a delicate, thoughtful manner. Preserve their identity.' },
            { name: 'Graceful Arch', prompt: 'Change the subject\'s pose to a graceful back arch while standing or sitting, creating an elegant and artistic silhouette. Preserve the person\'s identity and the scene\'s style.' },
            { name: 'Knee-Up Pose', prompt: 'Change the subject\'s pose to sitting on a couch or floor with one knee drawn up towards their chest and the other leg extended to the side. They should be looking directly at the camera with a confident expression. Preserve their identity and the scene\'s style.' },
            { name: 'Gentle Kneel', prompt: 'Change the subject\'s pose to kneeling on a soft surface like a bed or rug, with a slight, graceful arch in their back, looking at the camera. The pose should be artistic and elegant. Preserve their identity and the scene\'s style.' },
            { name: 'Floor Gaze', prompt: 'Change the subject\'s pose to sitting on the floor, leaning back on their hands with legs stretched out or casually bent, looking up towards the camera. Preserve their identity and the scene\'s style.' },
            { name: 'Window Light', prompt: 'Pose the subject sitting near a large window, illuminated by soft, natural light, with a contemplative and serene expression. Preserve their identity and the scene\'s style.' },
            { name: 'Bed Lounge', prompt: 'Change the subject\'s pose to lounging casually on a bed, propped up by pillows, with a relaxed and inviting look towards the camera. Preserve their identity and the scene\'s style.' },
            { name: 'Cross-Legged Repose', prompt: 'Change the subject\'s pose to sitting on the floor with their legs crossed. They should be leaning back on one hand, creating a gentle twist in their torso, and looking over their shoulder at the camera. Preserve their identity and the scene\'s style.' },
            { name: 'Bedside Poise', prompt: 'Change the subject\'s pose to sitting on the edge of a bed, leaning slightly forward with one hand resting on the mattress. Their legs should be crossed, and they should be looking at the camera with a soft expression. Preserve their identity and the scene\'s style.' },
        ]
    },
    {
        title: 'Adult Poses',
        presets: [
            { 
                name: 'Legs Over Head', 
                prompt: 'An overhead camera shot of the subject lying on their back on a bed, framed from the waist up. They are performing an advanced gymnastic flexibility move, raising their legs straight up and over their head so their feet are near their head. The pose must showcase extreme flexibility. Preserve their identity and clothing.' 
            },
            { 
                name: 'Lying Split', 
                prompt: 'An overhead camera shot of the subject lying on their back on a bed, framed from the waist up. They are in a full front split position, with legs extended wide apart. The pose should be artistic and showcase flexibility. Preserve their identity and clothing.' 
            },
            { 
                name: 'Happy Baby Pose', 
                prompt: 'An overhead camera shot of the subject lying on their back on a bed, framed from the waist up. They are in a "happy baby" pose, with knees bent towards their armpits and holding onto their feet. The pose is playful and shows flexibility. Preserve their identity and clothing.' 
            },
            { 
                name: 'Plow Pose', 
                prompt: 'A side-view shot of the subject lying on their back on the floor or a bed, performing a plow pose from yoga. Their legs are extended over their head with their toes touching the surface behind their head. This is an advanced flexibility pose. Preserve their identity and clothing.' 
            },
            { 
                name: 'Shoulder Stand', 
                prompt: 'A shot of the subject in a shoulder stand pose, balancing on their shoulders with their legs extended straight up towards the ceiling. Their hands are supporting their lower back. Preserve their identity and clothing.' 
            },
            { 
                name: 'Lying on Bed, Knees Up', 
                prompt: 'An overhead camera shot of the subject lying on their back on a bed, framed from the waist up. Their knees are bent and pulled up towards their chest. Preserve their identity and clothing.' 
            },
            {
                name: 'Lying on Stomach',
                prompt: 'A shot of the subject lying on their stomach on a bed, propped up on their elbows, looking at the camera with an alluring expression.'
            },
             { 
                name: 'Stomach Arch (Scorpion)', 
                prompt: 'A shot of the subject lying on their stomach on a bed, performing a scorpion pose by arching their back deeply and bringing their feet towards their head. Preserve their identity and clothing.' 
            },
            { 
                name: 'Lying on Side', 
                prompt: 'A full-body shot of the subject lying on their side on a bed, propped up on one elbow, with their body forming a gentle curve. They are looking at the camera with a soft, alluring expression. Preserve their identity and clothing.' 
            },
            {
                name: 'Arch Back on Knees',
                prompt: 'Change the subject\'s pose to kneeling on a bed with a graceful, deep arch in their back. The pose should be artistic and sensual. Preserve their identity and the scene\'s style.'
            },
             { 
                name: 'Kneeling Forward', 
                prompt: 'A shot of the subject kneeling on a bed and leaning forward, supporting their upper body with their forearms on the mattress. They are looking back over their shoulder at the camera. Preserve their identity and the scene\'s style.' 
            },
            {
                name: 'Seductive Gaze Over Shoulder',
                prompt: 'Pose the subject looking back over their shoulder at the camera with a soft, seductive expression. The lighting should be moody and intimate.'
            },
            {
                name: 'Pin-up Pose on Bed',
                prompt: 'Change the pose to a classic, playful pin-up style pose on a bed, such as sitting with knees together and turned to the side, looking at the camera with a smile.'
            },
            { 
                name: 'Seated Straddle', 
                prompt: 'A frontal shot of the subject sitting on the floor or a bed in a wide-legged straddle split, leaning forward slightly. The pose should highlight flexibility. Preserve their identity and the scene\'s style.' 
            },
             { 
                name: 'Bedside Allure', 
                prompt: 'A shot of the subject sitting on the edge of a bed, leaning slightly forward with one hand resting on the mattress. Their legs are crossed, and they are looking at the camera with a soft, alluring expression. Preserve their identity and the scene\'s style.' 
            },
        ]
    }
];


interface CameraAnglesPanelProps {
  onGenerate: (prompts: { name: string, prompt: string }[]) => void;
  isLoading: boolean;
}

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
    const [customImageCount, setCustomImageCount] = useState(1);

    const toggleAngle = (name: string) => {
        setSelectedAngles(prev => 
            prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
        );
    };

    const handleSelectCategory = (categoryPresets: Preset[]) => {
        const categoryNames = categoryPresets.map(p => p.name);
        setSelectedAngles(prev => {
            const newSelection = new Set([...prev, ...categoryNames]);
            return Array.from(newSelection);
        });
    };

    const handleGenerate = () => {
        const lensSuffix = lensPresets[lens];
        const promptsToGenerate: { name: string, prompt: string }[] = [];
        const allPresets = presetCategories.flatMap(c => c.presets);
        
        selectedAngles.forEach(name => {
            const preset = allPresets.find(p => p.name === name);
            if (preset) {
                promptsToGenerate.push({ name: preset.name, prompt: preset.prompt + lensSuffix });
            }
        });

        if (customPrompt.trim()) {
            if (customImageCount === 1) {
                promptsToGenerate.push({ name: 'Custom Angle', prompt: customPrompt.trim() + lensSuffix });
            } else {
                 for (let i = 1; i <= customImageCount; i++) {
                    promptsToGenerate.push({ 
                        name: `Custom Angle ${i}`, 
                        prompt: customPrompt.trim() + lensSuffix 
                    });
                }
            }
        }

        if (promptsToGenerate.length > 0) {
            onGenerate(promptsToGenerate);
        }
    };

    const handleGenerateSuggestion = (prompt: string) => {
        const lensSuffix = lensPresets[lens];
        onGenerate([{ name: 'AI Suggestion', prompt: prompt + lensSuffix }]);
    };

    const totalImages = selectedAngles.length + (customPrompt.trim() ? customImageCount : 0);
    const canGenerate = !isLoading && totalImages > 0;

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
                            className={`w-full text-center font-semibold py-2 px-2 rounded-lg transition-colors duration-2.25 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${lens === lensName ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
                        >
                            {lensName}
                        </button>
                    ))}
                </div>
            </div>

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
                                onClick={() => toggleAngle(preset.name)}
                                disabled={isLoading}
                                className={`w-full text-center font-semibold py-3 px-2 rounded-lg transition-colors duration-2.25 ease-in-out hover:bg-zinc-700 active:scale-95 text-xs disabled:opacity-50 disabled:cursor-not-allowed ${selectedAngles.includes(preset.name) ? 'bg-zinc-200 text-black' : 'bg-zinc-800 text-zinc-200'}`}
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3 mt-1">
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
                            max="10"
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