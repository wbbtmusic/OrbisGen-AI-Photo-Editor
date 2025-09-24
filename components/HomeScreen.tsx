/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback } from 'react';
import { dataURLtoFile } from '../lib/utils';
import { RecentProject, Tool } from '../types';
import { SparklesIcon, UploadIcon } from './icons';
import { cn } from '../lib/utils';

interface HomeScreenProps {
  onFileSelect: (file: File, initialTool?: Tool) => void;
  onGoToDesignStudio: () => void;
}

const ProjectCard: React.FC<{ project: RecentProject, onClick: () => void }> = ({ project, onClick }) => (
    <div className="group relative rounded-xl overflow-hidden cursor-pointer aspect-[4/3]" onClick={onClick}>
        <img src={project.thumbnailUrl} alt={project.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
            <h3 className="text-white font-semibold text-sm truncate">{project.name}</h3>
        </div>
    </div>
);


const HomeScreen: React.FC<HomeScreenProps> = ({ onFileSelect, onGoToDesignStudio }) => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [initialTool, setInitialTool] = useState<Tool | undefined>(undefined);

  useEffect(() => {
    try {
        const storedProjects = localStorage.getItem('orbisGenRecentProjects');
        if (storedProjects) {
            setRecentProjects(JSON.parse(storedProjects));
        }
    } catch (error) {
        console.error("Failed to parse recent projects from localStorage:", error);
        localStorage.removeItem('orbisGenRecentProjects');
    }
  }, []);
  
  const handleFile = useCallback((file: File | null | undefined, tool?: Tool) => {
    if (file && file.type.startsWith('image/')) {
        onFileSelect(file, tool);
    } else if (file) {
        alert('Please select a valid image file.');
    }
  }, [onFileSelect]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
        const file = event.clipboardData?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            event.preventDefault();
            handleFile(file, initialTool);
            setInitialTool(undefined);
        }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
        document.removeEventListener('paste', handlePaste);
    };
  }, [handleFile, initialTool]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file, initialTool);
    setInitialTool(undefined); // Reset after use
    if(e.target) e.target.value = ''; // Allow re-uploading the same file
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFile(e.dataTransfer.files?.[0], initialTool);
      setInitialTool(undefined);
  }, [handleFile, initialTool]);
  
  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragging(true);
    } else if (e.type === 'dragleave') {
        setIsDragging(false);
    }
  }, []);
  
  const handleProjectClick = (project: RecentProject) => {
      try {
        const file = dataURLtoFile(project.imageUrl, project.name);
        onFileSelect(file);
      } catch (error) {
          console.error("Failed to load project:", error);
          alert("Sorry, there was an issue loading this project. It might be corrupted.");
      }
  };

  const openFilePicker = () => {
    setInitialTool(undefined);
    document.getElementById('file-upload-homescreen')?.click();
  };

  const handleTryAddPerson = () => {
    setInitialTool('addPerson');
    document.getElementById('file-upload-homescreen')?.click();
  };


  return (
    <div className="w-full h-screen bg-zinc-950 flex flex-col items-center p-4 sm:p-8 animate-fade-in overflow-y-auto">
        <input id="file-upload-homescreen" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        <main className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center flex-grow">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                    OrbisGen
                </h1>
                <p className="mt-4 text-lg text-zinc-400">
                    The next-generation creative suite, powered by AI.
                </p>
            </div>
            
             {/* Main Action Zone & Promo */}
            <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-8">
                {/* Upload Zone */}
                <div
                    onClick={openFilePicker}
                    onDrop={handleDrop}
                    onDragEnter={handleDragEvents}
                    onDragLeave={handleDragEvents}
                    onDragOver={handleDragEvents}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900 p-10 text-center transition-all duration-200",
                        isDragging ? "border-blue-500 bg-blue-900/20 scale-105" : "hover:border-zinc-600 hover:bg-zinc-800/50"
                    )}
                >
                    <div className="flex flex-col items-center text-zinc-500 pointer-events-none">
                        <UploadIcon className="w-12 h-12 mb-4 text-zinc-600" />
                        <span className="font-semibold text-zinc-300">Drag & drop an image or paste</span>
                        <p className="text-sm">or click to browse your files</p>
                    </div>
                </div>

                {/* Featured Tool: Add Person Promo */}
                <div className="flex-1">
                    <div className="group h-full relative rounded-xl p-6 bg-gradient-to-br from-teal-500 to-green-600 text-white shadow-2xl shadow-teal-500/30 transition-all duration-300 hover:shadow-green-500/50 flex flex-col justify-center">
                        <h2 className="text-2xl font-bold mb-2">Featured Tool: Add Person</h2>
                        <p className="text-sm text-teal-100 mb-4">
                           Seamlessly add anyone to your photos. Describe them with text or use a reference image for a perfect match.
                        </p>
                        <button
                            onClick={handleTryAddPerson}
                            className="bg-white text-black font-semibold py-2 px-5 rounded-lg transition-all hover:bg-zinc-200 active:scale-95 group-hover:scale-105 self-start"
                        >
                            Try Now
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Separator / Secondary Action */}
            <div className="flex items-center w-full max-w-xl mt-8">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-4 text-xs text-zinc-600 uppercase font-medium">Or</span>
                <div className="flex-grow border-t border-zinc-800"></div>
            </div>
            
            <button
                onClick={onGoToDesignStudio}
                className="mt-8 flex items-center gap-2 bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:bg-blue-500 active:bg-blue-700 hover:scale-105 active:scale-100 shadow-md shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-500/50"
            >
                <SparklesIcon className="w-5 h-5" />
                Create an Image with AI
            </button>
        </main>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
            <section className="w-full max-w-5xl mx-auto mt-16 mb-8 flex-shrink-0 animate-fade-in">
                <h2 className="text-xl font-semibold text-white mb-6 text-center">Recent Projects</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {recentProjects.map((proj) => (
                        <ProjectCard 
                            key={proj.id} 
                            project={proj} 
                            onClick={() => handleProjectClick(proj)} 
                        />
                    ))}
                </div>
            </section>
        )}

        {/* Footer */}
        <footer className="w-full text-center text-xs text-zinc-600 py-4 flex-shrink-0 space-y-1">
            <p>Powered by Google Gemini</p>
            <p>Developed by <a href="https://www.instagram.com/burakcanogut" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400 transition-colors">Burak Can Öğüt</a></p>
            <p>&copy; {new Date().getFullYear()} OrbisGen</p>
        </footer>
    </div>
  );
};

export default HomeScreen;