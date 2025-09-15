/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Import UndoIcon and RedoIcon
import { HomeIcon, OpenFileIcon, DownloadIcon, SearchIcon, RotateClockwiseIcon, FlipHorizontalIcon, UndoIcon, RedoIcon } from './icons';
import { type Tool } from '../types';
import { toolDisplayName, allTools } from './ToolOptions';

interface HeaderProps {
    onGoHome: () => void;
    onOpenFile: () => void;
    onDownload: () => void;
    // FIX: Add missing props for undo/redo functionality
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    hasImage: boolean;
    activeTool: Tool;
    onRotate: () => void;
    onFlipHorizontal: () => void;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    onSelectTool: (tool: Tool) => void;
    onDeselect: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { 
    onGoHome, 
    onOpenFile, 
    onDownload,
    // FIX: Destructure new props
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    hasImage,
    activeTool,
    onRotate,
    onFlipHorizontal,
    searchTerm,
    onSearchTermChange,
    onSelectTool,
    onDeselect,
  } = props;

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const title = toolDisplayName[activeTool] || '';

  const filteredTools = useMemo(() => {
    if (!searchTerm) return [];
    return allTools.filter(tool => tool.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        onSearchTermChange('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSearchTermChange]);


  return (
    <header className="w-full bg-zinc-900 z-50 flex-shrink-0 border-b border-zinc-800">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-2 sm:px-4 h-14">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onGoHome}
            className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            aria-label="Go to Home"
          >
            <HomeIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-baseline gap-2">
            <span>OrbisGen</span>
            {title && <span className="hidden md:inline text-base text-zinc-400 font-medium">/ {title}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
            <div ref={searchContainerRef} className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none z-10" />
                <input
                    type="text"
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                    className="relative w-32 bg-zinc-800 border border-zinc-700 rounded-full pl-9 pr-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-300 focus:w-48"
                />
                <AnimatePresence>
                  {searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg p-1 z-50"
                    >
                      {filteredTools.length > 0 ? filteredTools.map(tool => (
                        <button key={tool.name} onClick={() => onSelectTool(tool.name)} className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-blue-500 hover:text-black rounded">
                          <tool.icon className="w-5 h-5" />
                          <span>{tool.label}</span>
                        </button>
                      )) : <p className="text-xs text-zinc-500 text-center p-2">No tools found.</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-zinc-700 mx-1 hidden sm:block" />

            {/* FIX: Add Undo/Redo buttons */}
            <button 
                onClick={onUndo}
                disabled={!canUndo}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Undo"
                title="Undo"
            >
                <UndoIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={onRedo}
                disabled={!canRedo}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Redo"
                title="Redo"
            >
                <RedoIcon className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-zinc-700 mx-1 hidden sm:block" />

            <button 
                onClick={onRotate}
                disabled={!hasImage}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Rotate Clockwise"
                title="Rotate 90°"
            >
                <RotateClockwiseIcon className="w-5 h-5" />
            </button>
             <button 
                onClick={onFlipHorizontal}
                disabled={!hasImage}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Flip Horizontal"
                title="Flip Horizontal"
            >
                <FlipHorizontalIcon className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-zinc-700 mx-1 hidden sm:block" />

            <button 
                onClick={onOpenFile}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                aria-label="Open File"
                title="Open File"
            >
                <OpenFileIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={onDownload}
                disabled={!hasImage}
                className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download Image"
                title="Download Image"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;