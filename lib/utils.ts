/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RecentProject } from "../types";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to convert a data URL to a File object
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
  
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


// Helper to create a thumbnail from a data URL
const createThumbnail = (imageUrl: string, size: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const aspect = img.width / img.height;
            canvas.width = size;
            canvas.height = size / aspect;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
        img.src = imageUrl;
    });
};

// Helper to save a file as a recent project to localStorage
export const saveRecentProject = (file: File) => {
    const MAX_RECENT_PROJECTS = 4;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        try {
            const imageUrl = reader.result as string;
            const thumbnailUrl = await createThumbnail(imageUrl, 300);

            const newProject: RecentProject = {
                id: Date.now(),
                name: file.name,
                thumbnailUrl,
                imageUrl
            };

            const stored = localStorage.getItem('orbisGenRecentProjects');
            let recentProjects: RecentProject[] = stored ? JSON.parse(stored) : [];

            // Prevent duplicates of the same image file name
            recentProjects = recentProjects.filter(p => p.name !== file.name);

            const updatedProjects = [newProject, ...recentProjects].slice(0, MAX_RECENT_PROJECTS);
            
            localStorage.setItem('orbisGenRecentProjects', JSON.stringify(updatedProjects));
        } catch(error) {
            console.error("Failed to save recent project:", error);
        }
    };
    reader.onerror = (error) => {
        console.error("Failed to read file for recent project:", error);
    };
};

// --- New Client-Side Image Manipulation Utilities ---

const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
});

export const rotateImage = async (imageUrl: string, degrees: number): Promise<string> => {
    const image = await loadImageFromUrl(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    const radians = (degrees * Math.PI) / 180;
    
    // For 90 or 270 degree rotations, swap width and height
    if (degrees % 180 !== 0) {
        canvas.width = image.height;
        canvas.height = image.width;
    } else {
        canvas.width = image.width;
        canvas.height = image.height;
    }
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);

    return canvas.toDataURL('image/png');
};

export const flipImageHorizontal = async (imageUrl: string): Promise<string> => {
    const image = await loadImageFromUrl(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0);

    return canvas.toDataURL('image/png');
};