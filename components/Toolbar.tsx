/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tool } from '../types';
import { 
    // Category Icons
    EssentialsCategoryIcon, ObjectRetouchCategoryIcon, ScenePerspectiveCategoryIcon, 
    PortraitFaceCategoryIcon, StyleEffectsCategoryIcon, TrendsCategoryIcon,
    // Tool Icons
    CropIcon, AdjustSlidersIcon, MagicWandIcon, LayersIcon, ReplaceBgIcon, 
    SkyIcon, InsertIcon, AddPersonIcon, TextGenIcon, CameraAnglesIcon, 
    PortraitIcon, FashionIcon, MakeupIcon, MakeupTransferIcon, 
    StyleTransferIcon, FaceSwapIcon, FaceFusionIcon, PaletteIcon, 
    ColorGradeIcon, StudioIcon, RandomizeIcon
} from './icons';

export interface ToolDefinition {
  name: Tool;
  icon: React.FC<{ className?: string }>;
  label: string;
}

export interface ToolCategory {
  name: string;
  icon: React.FC<{ className?: string }>;
  tools: ToolDefinition[];
}

export const toolCategories: ToolCategory[] = [
  {
    name: 'Trends',
    icon: TrendsCategoryIcon,
    tools: [
      { name: 'aestheticAI', icon: PaletteIcon, label: 'Aesthetic AI' },
      { name: 'addPerson', icon: AddPersonIcon, label: 'Add Person' },
      { name: 'cameraAngles', icon: CameraAnglesIcon, label: 'Camera Angles' },
      { name: 'fashion', icon: FashionIcon, label: 'Fashion AI' },
      { name: 'replaceBg', icon: ReplaceBgIcon, label: 'Replace Background' },
    ]
  },
  {
    name: 'Essentials',
    icon: EssentialsCategoryIcon,
    tools: [
      { name: 'crop', icon: CropIcon, label: 'Crop & Resize' },
      { name: 'adjust', icon: AdjustSlidersIcon, label: 'Adjustments' },
      { name: 'layers', icon: LayersIcon, label: 'Layers' },
    ],
  },
  {
    name: 'Retouch & Replace',
    icon: ObjectRetouchCategoryIcon,
    tools: [
      { name: 'retouch', icon: MagicWandIcon, label: 'Retouch' },
      { name: 'portrait', icon: PortraitIcon, label: 'Portrait AI' },
      { name: 'replaceBg', icon: ReplaceBgIcon, label: 'Replace Background' },
      { name: 'sky', icon: SkyIcon, label: 'Replace Sky' },
    ],
  },
  {
    name: 'Generative Objects',
    icon: ScenePerspectiveCategoryIcon,
    tools: [
      { name: 'insert', icon: InsertIcon, label: 'Insert Object' },
      { name: 'addPerson', icon: AddPersonIcon, label: 'Add Person' },
      { name: 'textGen', icon: TextGenIcon, label: 'Add Text' },
    ],
  },
  {
    name: 'Face & Fashion',
    icon: PortraitFaceCategoryIcon,
    tools: [
      { name: 'fashion', icon: FashionIcon, label: 'Fashion AI' },
      { name: 'makeup', icon: MakeupIcon, label: 'Makeup AI' },
      { name: 'makeupTransfer', icon: MakeupTransferIcon, label: 'Makeup Transfer' },
      { name: 'clothingTransfer', icon: StyleTransferIcon, label: 'Clothing Transfer' },
      { name: 'faceSwap', icon: FaceSwapIcon, label: 'Face Swap' },
      { name: 'faceFusion', icon: FaceFusionIcon, label: 'Face Fusion' },
    ],
  },
  {
    name: 'AI Effects & Styles',
    icon: StyleEffectsCategoryIcon,
    tools: [
      { name: 'filters', icon: StyleEffectsCategoryIcon, label: 'Artistic Filters' },
      { name: 'colorGrade', icon: ColorGradeIcon, label: 'Color Grade' },
      { name: 'studio', icon: StudioIcon, label: 'Studio AI' },
      { name: 'aestheticAI', icon: PaletteIcon, label: 'Aesthetic AI' },
      { name: 'cameraAngles', icon: CameraAnglesIcon, label: 'Camera Angles' },
      { name: 'randomize', icon: RandomizeIcon, label: 'Randomize' },
    ],
  },
];


interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  disabled: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool, disabled }) => {
    const [openCategoryIndex, setOpenCategoryIndex] = useState<number | null>(null);
    const navRef = useRef<HTMLElement>(null);

    const handleCategoryClick = (index: number) => {
        // Always use click to toggle on any device
        setOpenCategoryIndex(prevIndex => (prevIndex === index ? null : index));
    };

    const handleMouseEnter = (index: number) => {
        // Only trigger hover on larger screens
        if (window.innerWidth >= 768) {
            setOpenCategoryIndex(index);
        }
    };

    const handleMouseLeave = () => {
        if (window.innerWidth >= 768) {
            setOpenCategoryIndex(null);
        }
    };
    
    const handleToolSelect = (tool: Tool) => {
        setActiveTool(tool);
        setOpenCategoryIndex(null); // Close panel after selecting a tool
    };

    // Effect to handle clicks outside the toolbar to close the menu.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenCategoryIndex(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav ref={navRef} className="relative w-16 h-full bg-zinc-900 border-r border-zinc-800 py-2 flex flex-col items-center justify-start gap-2 z-40">
            {toolCategories.map((category, index) => {
                const isCategoryActive = category.tools.some(t => t.name === activeTool);
                const shouldShowPanel = openCategoryIndex === index;

                return (
                    <div 
                        key={category.name} 
                        className="relative"
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            onClick={() => handleCategoryClick(index)}
                            disabled={disabled}
                            title={category.name}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
                                isCategoryActive || shouldShowPanel
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            }`}
                            aria-label={category.name}
                        >
                            <category.icon className="w-6 h-6" />
                        </button>

                        <AnimatePresence>
                            {shouldShowPanel && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                    transition={{ duration: 0.15, ease: 'easeOut' }}
                                    className="absolute left-full top-0 ml-2 w-60 z-50 bg-black/70 backdrop-blur-md border border-zinc-700/80 rounded-xl shadow-2xl p-1.5"
                                >
                                    <h3 className="font-bold text-white text-md px-2 pb-2 mb-2 border-b border-zinc-700">
                                        {category.name}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-1">
                                        {category.tools.map(tool => (
                                            <button
                                                key={tool.name}
                                                onClick={() => handleToolSelect(tool.name)}
                                                disabled={disabled}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    activeTool === tool.name
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-zinc-300 hover:bg-zinc-700'
                                                }`}
                                            >
                                                <tool.icon className="w-5 h-5 flex-shrink-0" />
                                                <span className="truncate">{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </nav>
    );
};

export default Toolbar;