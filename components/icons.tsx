/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

// A generic icon wrapper to reduce boilerplate
const Icon: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {children}
    </svg>
);

// --- CATEGORY ICONS ---
export const EssentialsCategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.343-.026.69.043.996.166A2.252 2.252 0 0113.5 6.108v1.392m-5.25 0h5.25m-5.25 0V7.5m0 0a2.25 2.25 0 012.25-2.25h5.25a2.25 2.25 0 012.25 2.25m-10.5 0a2.25 2.25 0 01-2.25 2.25v6.75a2.25 2.25 0 012.25 2.25h10.5a2.25 2.25 0 012.25-2.25v-6.75a2.25 2.25 0 01-2.25-2.25m-10.5 0h10.5" />
    </Icon>
);
export const ObjectRetouchCategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 3.75a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h3a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-3z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 15.75a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h3a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-3zM3.75 10.5a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-1.5zM15.75 10.5a2.25 2.25 0 00-2.25 2.25v1.5a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25v-1.5a2.25 2.25 0 00-2.25-2.25h-1.5z" />
    </Icon>
);
export const ScenePerspectiveCategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5h19.5v10.5a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5V7.5zM2.25 7.5V6a1.5 1.5 0 011.5-1.5h16.5a1.5 1.5 0 011.5 1.5v1.5m-19.5 0h19.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75v3.75m0 0l-1.5-1.5m1.5 1.5l1.5-1.5M12 6.75v1.5" />
    </Icon>
);
export const PortraitFaceCategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </Icon>
);
export const StyleEffectsCategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.25 22l-.648-1.447a3.375 3.375 0 00-2.456-2.456L11.75 18l1.447-.648a3.375 3.375 0 002.456-2.456L16.25 14l.648 1.447a3.375 3.375 0 002.456 2.456L20.75 18l-1.447.648a3.375 3.375 0 00-2.456 2.456z" />
    </Icon>
);
export const TrendsCategoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-3.182 3.182m3.182-3.182v4.995m-3.182-3.182 6.364 6.364" />
    </Icon>
);


// --- TOOL ICONS ---
export const CropIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.875 1.5v15m-4.875-15H21m-18 4.875h18m-4.875-4.875v15m-15-4.875v6.375a1.125 1.125 0 001.125 1.125h16.5a1.125 1.125 0 001.125-1.125V1.5" />
    </Icon>
);

export const AdjustSlidersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM3.75 6H7.5m3 12h9.75m-9.75 0a2.25 2.25 0 01-4.5 0 2.25 2.25 0 014.5 0zM3.75 18H7.5m3-6h13.5m-13.5 0a2.25 2.25 0 01-4.5 0 2.25 2.25 0 014.5 0zM3.75 12H10.5" />
    </Icon>
);

export const MagicWandIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.385m5.043.025a15.994 15.994 0 011.622-3.385m3.385 5.043a15.994 15.994 0 01-1.622 3.385m-5.043-.025a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.385" />
    </Icon>
);

export const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.375 17.25c5.918 0 10.688-2.8 10.688-6.25S12.293 4.75 6.375 4.75 2.25 7.55 2.25 11s2.838 6.25 4.125 6.25zM12 21.75c5.918 0 10.688-2.8 10.688-6.25s-4.77-6.25-10.688-6.25S7.5 12.05 7.5 15.5s2.838 6.25 4.5 6.25z" />
    </Icon>
);

export const ReplaceBgIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m-3-1l-1.5-.545M7.5 15l4.5-1.636M6 10.5l-1.5.545m7.5-5.273l-1.5.545" />
    </Icon>
);

export const SkyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </Icon>
);
export const InsertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5h7.5v7.5h-7.5v-7.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v3m0 9v3m4.5-7.5h3m-15 0h3" />
    </Icon>
);
export const AddPersonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </Icon>
);

export const TextGenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </Icon>
);

export const PortraitIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.563V9.75a3.375 3.375 0 003.375 3.375h.001a3.375 3.375 0 003.374-3.375V9.563M9.75 9.75v-.188a3.375 3.375 0 013.375-3.375h.001a3.375 3.375 0 013.374 3.375v.188" />
    </Icon>
);

export const FashionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.375 21v-5.25m11.25 5.25v-5.25m-11.25 0L12 12.75l5.625 3M12 12.75V21m-4.125-6.375c.621.504 1.527.826 2.55.826s1.929-.322 2.55-.826m-5.1 0a4.5 4.5 0 016.364-6.364l1.414 1.414a1.5 1.5 0 01-2.121 2.121L12 6.375l-1.414 1.414a1.5 1.5 0 01-2.121-2.121l1.414-1.414a4.5 4.5 0 016.364 6.364m-5.1 0c.621.504 1.527.826 2.55.826s1.929-.322 2.55-.826" />
    </Icon>
);

export const MakeupIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9a3 3 0 01-6 0" />
    </Icon>
);
export const MakeupTransferIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" />
    </Icon>
);

export const StyleTransferIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.182-3.182m0-4.991v4.99" />
    </Icon>
);
export const FaceSwapIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </Icon>
);

export const FaceFusionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icon>
);

export const PaletteIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402a3.75 3.75 0 00-.61-6.192l-5.314 5.314a2.25 2.25 0 01-3.182 0l-1.962-1.962a2.25 2.25 0 010-3.182l5.314-5.314a2.25 2.25 0 013.182 0L20.25 7.5M8.625 10.5h.008v.008h-.008V10.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21h4.5A2.25 2.25 0 0018.75 18.75v-4.5A2.25 2.25 0 0016.5 12h-4.5A2.25 2.25 0 009.75 14.25v4.5A2.25 2.25 0 0012 21z" />
    </Icon>
);

export const ColorGradeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m4.5-9a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </Icon>
);
export const StudioIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21V6.75A2.25 2.25 0 016 4.5h12A2.25 2.25 0 0120.25 6.75V21" />
    </Icon>
);
export const PersonasIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </Icon>
);
export const CameraAnglesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </Icon>
);
export const RandomizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-5.25L21 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-5.25L6 9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-5.25L13.5 3" />
    </Icon>
);

// --- UI ICONS ---
export const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);
export const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </Icon>
);
export const OpenFileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h6.375a3.375 3.375 0 013.375 3.375v1.5m-9.75-4.875v12a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-9.75a2.25 2.25 0 00-2.25-2.25h-7.5a2.25 2.25 0 00-2.25 2.25v1.5" />
    </Icon>
);
export const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </Icon>
);
export const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </Icon>
);
export const RedoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
    </Icon>
);
export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.25 22l-.648-1.447a3.375 3.375 0 00-2.456-2.456L11.75 18l1.447-.648a3.375 3.375 0 002.456-2.456L16.25 14l.648 1.447a3.375 3.375 0 002.456 2.456L20.75 18l-1.447.648a3.375 3.375 0 00-2.456 2.456z" />
    </Icon>
);
const AspectRatioIcon: React.FC<{ w: number, h: number, className?: string }> = ({ w, h, className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect 
            x={(24 - w) / 2} 
            y={(24 - h) / 2} 
            width={w} 
            height={h} 
            rx="2" 
            stroke="currentColor" 
            strokeWidth="2"
        />
    </svg>
);
export const AspectRatio1x1Icon: React.FC<{ className?: string }> = ({ className }) => (
    <AspectRatioIcon w={16} h={16} className={className} />
);
export const AspectRatio16x9Icon: React.FC<{ className?: string }> = ({ className }) => (
    <AspectRatioIcon w={20} h={11.25} className={className} />
);
export const AspectRatio9x16Icon: React.FC<{ className?: string }> = ({ className }) => (
    <AspectRatioIcon w={11.25} h={20} className={className} />
);
export const AspectRatio4x3Icon: React.FC<{ className?: string }> = ({ className }) => (
    <AspectRatioIcon w={18} h={13.5} className={className} />
);
export const AspectRatio3x4Icon: React.FC<{ className?: string }> = ({ className }) => (
    <AspectRatioIcon w={13.5} h={18} className={className} />
);
export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </Icon>
);
export const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </Icon>
);
export const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="1.75"></line>
    </svg>
);

export const RotateClockwiseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.95 11a8 8 0 1 0-.55 5.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.95 11h-5.5V5.5" />
    </Icon>
);

export const FlipHorizontalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <Icon className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21V3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25L3 12l5.25 3.75" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25L21 12l-5.25 3.75" />
    </Icon>
);
export const MoreVertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);