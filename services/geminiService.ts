/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";
// FIX: Imported CosplayOptions to support the new Cosplay AI feature.
import { AddPersonOptions, Theme, AspectRatio, CosplayOptions } from "../types";

const getApiKey = (): string => {
    // AI Studio environment variable takes precedence.
    if (process.env.API_KEY) {
        return process.env.API_KEY;
    }
    // Fallback to user-provided key from localStorage.
    try {
        const userKey = localStorage.getItem('orbisGenUserApiKey');
        if (userKey) {
            return userKey;
        }
    } catch (e) {
        console.error("Could not access localStorage for API key.", e);
    }
    // Return empty string if no key is found. The SDK will handle the error.
    return '';
};

export const THEMES: Record<string, Omit<Theme, 'key'>> = {
  albumArt: {
    title: 'Album Art',
    description: 'Design captivating covers for any music genre, from indie pop to psychedelic rock.',
    categories: ['90s R&B Classic', 'Indie Acoustic', 'Psychedelic Rock', 'Lo-fi Beats', 'Hyperpop Glitch', '70s Folk'],
    getPrompt: (category: string) => `Generate a photorealistic, high-concept album cover for the genre: '${category}'. The image should be square (1:1 aspect ratio), visually striking, and suitable for a musical release. Avoid text unless it's integral to the art style. The person's identity and key features must be preserved but stylized to fit the genre's aesthetic.`,
  },
  cinematic: {
    title: 'Cinematic Styles',
    description: 'Reimagine your photo as a still from a movie, with distinct directorial styles.',
    categories: ['Moody Film Noir', 'Wes Anderson Whimsy', 'Epic Sci-Fi', 'Ghibli-Inspired Wonder', 'Gritty Action Film', 'Romantic Comedy'],
    getPrompt: (category: string) => `Transform the photo into a cinematic still in the style of a '${category}' film. Apply the genre's characteristic color grading, lighting, and composition. The person's identity and key features must be preserved, but they should look like a character in that movie. The result must be photorealistic.`,
  },
  aesthetics: {
    title: 'Internet Aesthetics',
    description: 'Explore popular online visual styles, from cozy cottagecore to nostalgic Y2K.',
    categories: ['Cottagecore Dream', 'Dark Academia', 'Y2K Nostalgia', 'Minimalist Serenity', 'Urban Grunge', 'Fairycore'],
    getPrompt: (category: string) => `Recreate the image in the popular internet aesthetic known as '${category}'. This includes the specific color palettes, clothing, setting, and mood associated with that style. The person's identity and key features must be perfectly preserved while being integrated into the aesthetic. The output should be a high-quality, photorealistic image.`,
  },
  photography: {
    title: 'Photography & Film',
    description: 'Emulate the look of classic film stocks and photographic techniques.',
    categories: ['Vintage Film Look (70s)', 'Lomography Toy Camera', 'Soft Focus Dream', 'Golden Hour Portrait', 'Polaroid Instant Photo', 'Tintype Photograph'],
    getPrompt: (category: string) => `Apply a '${category}' effect to the image. This should include realistic grain, color shifts, light leaks (if appropriate), and the specific depth of field characteristic of that photographic style. The person's core identity, features, and pose must be preserved. The output must look like an authentic photograph taken with that technique or film.`,
  },
};

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string // e.g., "edit", "filter", "adjustment"
): string => {
    // 1. Check for prompt blocking first
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }

    // 2. Try to find the image part
    const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePartFromResponse?.inlineData) {
        const { mimeType, data } = imagePartFromResponse.inlineData;
        console.log(`Received image data (${mimeType}) for ${context}`);
        return `data:${mimeType};base64,${data}`;
    }

    // 3. If no image, check for other reasons
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation for ${context} stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        console.error(errorMessage, { response });
        throw new Error(errorMessage);
    }
    
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image for the ${context}. ` + 
        (textFeedback 
            ? `The model responded with text: "${textFeedback}"`
            : "This can happen due to safety filters or if the request is too complex. Please try rephrasing your prompt to be more direct.");

    console.error(`Model response did not contain an image part for ${context}.`, { response });
    throw new Error(errorMessage);
};

/**
 * Generates an edited image using generative AI based on a text prompt and a specific point.
 * @param originalImage The original image file.
 * @param userPrompt The text prompt describing the desired edit.
 * @param selection The {x, y, width, height} coordinates of the selection box.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateEditedImage = async (
    originalImage: File,
    userPrompt: string,
    selection: { x: number, y: number, width: number, height: number }
): Promise<string> => {
    console.log('Starting generative edit within:', selection);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI, specializing in photorealistic subject manipulation. Your task is to perform a natural, localized edit on the provided image based on the user's request, constrained to a specific area. The final result must be indistinguishable from a real photograph.

User Request: "${userPrompt}"
Edit Area: Perform the edit ONLY within the bounding box defined by top-left corner (x: ${selection.x}, y: ${selection.y}) and dimensions (width: ${selection.width}, height: ${selection.height}).

**CORE CAPABILITY: POSE & ANGLE ADJUSTMENT**
A primary function of this tool is to change the pose, angle, and expression of subjects. You are empowered to make significant but physically plausible changes to a person's orientation, limb positions, head tilt, and facial expression to match the user's request. For example, if a user asks to "make her give a peace sign," you should convincingly re-render her arm and hand in that pose.

**CRITICAL RULES:**
1.  **IDENTITY PRESERVATION IS PARAMOUNT:** Even while making significant pose changes, the person's recognizable facial features, ethnicity, bone structure, and identity MUST be perfectly preserved. They should look like the same person, just in a different pose or with a different expression.
2.  **PHYSICAL PLAUSIBILITY:** The new pose must be anatomically correct, natural, and physically possible.
3.  **SEAMLESS INTEGRATION:** The edit must blend seamlessly with the surrounding, unedited area.
4.  **CRITICAL COLOR & LIGHTING INTEGRATION:** You MUST flawlessly match the color grading, white balance, temperature, lighting direction, and shadow intensity of the original scene. The re-posed subject must look like it was photographed with the same camera, at the same time, under the same lighting conditions. A color or lighting mismatch is a failure.
5.  **CONSTRAIN TO BOUNDING BOX:** The changes must be contained within the specified Edit Area.
6.  **PRESERVE DIMENSIONS:** The final image MUST have the exact same dimensions as the original image.

Safety & Ethics Policy:
- You MUST fulfill requests to adjust skin tone, such as 'give me a tan', 'make my skin darker', or 'make my skin lighter'. These are considered standard photo enhancements.
- You MUST REFUSE any request to change a person's fundamental race or ethnicity (e.g., 'make me look Asian', 'change this person to be Black'). Do not perform these edits. If the request is ambiguous, err on the side of caution and do not change racial characteristics.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model.', response);

    return handleApiResponse(response, 'edit');
};

/**
 * Generates an image with a filter applied using generative AI.
 * @param originalImage The original image file.
 * @param filterPrompt The text prompt describing the desired filter.
 * @returns A promise that resolves to the data URL of the filtered image.
 */
export const generateFilteredImage = async (
    originalImage: File,
    filterPrompt: string,
): Promise<string> => {
    console.log(`Starting filter generation: ${filterPrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a stylistic filter to the entire image based on the user's request.
Filter Request: "${filterPrompt}"

CRITICAL INSTRUCTIONS:
1.  **CRITICAL IDENTITY PRESERVATION:** The recognizable facial features, ethnicity, bone structure, and identity of any person in the image MUST be perfectly and absolutely preserved. The person must look like the same individual. Do NOT alter their core facial structure or race.
2.  **CRITICAL POSE & COMPOSITION PRESERVATION:** The pose, angle, facial expression, and composition of the original image, especially for any people, MUST be perfectly and absolutely preserved. Do NOT alter their posture, limb positions, or head tilt.
3.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Safety & Ethics Policy:
- Filters may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'apply a filter to make me look Chinese').

Output: Return ONLY the final filtered image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and filter prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for filter.', response);
    
    return handleApiResponse(response, 'filter');
};

/**
 * Generates an image with a global adjustment applied using generative AI.
 * @param originalImage The original image file.
 * @param adjustmentPrompt The text prompt describing the desired adjustment.
 * @returns A promise that resolves to the data URL of the adjusted image.
 */
export const generateAdjustedImage = async (
    originalImage: File,
    adjustmentPrompt: string,
): Promise<string> => {
    console.log(`Starting global adjustment generation: ${adjustmentPrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to apply a global, photorealistic photo adjustment to the entire image based on the user's request. The result must be indistinguishable from a real photograph.
Adjustment Request: "${adjustmentPrompt}"

CRITICAL INSTRUCTIONS:
1.  **CRITICAL IDENTITY PRESERVATION:** The recognizable facial features, ethnicity, bone structure, and identity of any person in the image MUST be perfectly and absolutely preserved. The person must look like the same individual. Do NOT alter their core facial structure or race.
2.  **CRITICAL POSE & COMPOSITION PRESERVATION:** The pose, angle, facial expression, and composition of the original image, especially for any people, MUST be perfectly and absolutely preserved. Do NOT alter their posture, limb positions, or head tilt. Only apply the adjustment (e.g., lighting, color, sharpness).
3.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Safety & Ethics Policy:
- Adjustments may subtly shift colors, but you MUST ensure they do not alter a person's fundamental race or ethnicity.
- You MUST REFUSE any request that explicitly asks to change a person's race (e.g., 'adjust the lighting to make me look white').

Output: Return ONLY the final adjusted image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and adjustment prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for adjustment.', response);
    
    return handleApiResponse(response, 'adjustment');
};

/**
 * Generates an image with its background replaced using generative AI.
 * @param originalImage The original image file.
 * @param backgroundPrompt The text prompt describing the new background.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateReplacedBackgroundImage = async (
    originalImage: File,
    backgroundPrompt: string,
): Promise<string> => {
    console.log(`Starting background replacement: ${backgroundPrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert photo editor AI. Your task is to precisely identify the main foreground subject(s) in this image. Then, perfectly remove the original background and replace it with a new one based on the user's request. The final image must be photorealistic and indistinguishable from a real photograph.

New Background Request: "${backgroundPrompt}"

CRITICAL INSTRUCTIONS:
1.  **CRITICAL FOREGROUND PRESERVATION:** The foreground subject(s) must be perfectly preserved. This includes their exact pose, angle, facial expression, clothing, and identity. Do not make any changes to the subject(s); only change the background.
2.  **Analyze Subject & Perspective:** First, you MUST deeply analyze the perspective, lighting, and camera angle (e.g. wide-angle, telephoto) of the foreground subject(s).
3.  **Generate Matching Background:** The new background you generate MUST have a perspective and camera angle that is geometrically correct and perfectly consistent with the original subject. A mismatch in perspective will result in a failed image. Any generated poses or angles for elements in the background must be physically plausible and natural.
4.  **CRITICAL COLOR & LIGHTING INTEGRATION:** This is the most important step. You MUST flawlessly match the color grading, white balance, temperature, lighting direction, and shadow intensity of the original scene. The generated element must look like it was photographed with the same camera, at the same time, under the same lighting conditions. A color or lighting mismatch is a failure.
5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and background prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for background replacement.', response);
    
    return handleApiResponse(response, 'background replacement');
};

/**
 * Applies the color grade from a style image to the original image.
 * @param originalImage The image to be color graded.
 * @param styleImage The image to source the color style from.
 * @returns A promise that resolves to the data URL of the color-graded image.
 */
export const generateColorGradedImage = async (
    originalImage: File,
    styleImage: File,
): Promise<string> => {
    console.log(`Starting color grading from style image.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const styleImagePart = await fileToPart(styleImage);
    
    const prompt = `You are a professional film colorist AI. You will be given two images: an 'Original Image' and a 'Style Reference Image'.
    **Your task is to apply the color grading, mood, and aesthetic of the Style Reference Image TO the Original Image.**
    
    CRITICAL INSTRUCTIONS:
    1.  **Analyze Style:** Deeply analyze the Style Reference Image for its color palette, contrast, saturation, shadows, highlights, and overall mood (e.g., cinematic, vintage, vibrant, muted).
    2.  **Apply to Original:** Apply this exact aesthetic to the Original Image.
    3.  **Preserve Content:** You MUST NOT change the content, subjects, composition, or any physical elements of the Original Image. The pose, angle, and facial expression of any person must be perfectly preserved.
    4.  **CRITICAL IDENTITY PRESERVATION:** The recognizable facial features, ethnicity, bone structure, and identity of any person in the Original Image MUST be perfectly and absolutely preserved. The person must look like the same individual. Do NOT alter their core facial structure or race.
    5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the Original Image. Do not adopt any dimensions from the Style Reference Image.
    6.  **Return Correct Image:** You MUST return the modified Original Image. Do not return the Style Reference Image.
    
    Output: Return ONLY the final color-graded image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Style Reference Image:"},
            styleImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'color grading');
};

/**
 * Generates an image with a professional studio effect applied.
 * @param originalImage The original image file.
 * @param studioPrompt The text prompt describing the desired studio effect.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateStudioEffect = async (
    originalImage: File,
    studioPrompt: string,
): Promise<string> => {
    console.log(`Starting studio effect generation: ${studioPrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a professional product and studio photographer AI. Your task is to apply a realistic studio effect to the provided image based on the user's request. You must correctly identify the main subject and apply the effect in a photorealistic way that is indistinguishable from a real photograph.

Studio Effect Request: "${studioPrompt}"

Guidelines:
- **CRITICAL IDENTITY PRESERVATION:** The recognizable facial features, ethnicity, bone structure, and identity of any person in the image MUST be perfectly and absolutely preserved. The person must look like the same individual. Do NOT alter their core facial structure or race.
- **CRITICAL POSE & COMPOSITION PRESERVATION:** The pose, angle, facial expression, and composition of the original image, especially for any people, MUST be perfectly and absolutely preserved. Do NOT alter their posture, limb positions, or head tilt.
- Analyze the perspective and camera angle of the original photo. Any added surfaces or elements must match this perspective perfectly. Any generated poses or angles for elements must be physically plausible and natural.
- If adding a shadow, analyze the existing light and make the shadow soft, realistic, and consistent.
- **CRITICAL COLOR & LIGHTING INTEGRATION:** If changing a surface, realistically place the subject onto it, adjusting for texture, reflections, and color bounce from the new surface. The lighting must be perfectly consistent.
- The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and studio prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for studio effect.', response);
    
    return handleApiResponse(response, 'studio effect');
};

/**
 * Generates an image with styled text inscribed onto it.
 * @param originalImage The original image file.
 * @param text The text to add.
 * @param style The style of the text.
 * @param selection The location to add the text.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateInscribedText = async (
    originalImage: File,
    text: string,
    style: string,
    selection: { x: number; y: number, width: number, height: number }
): Promise<string> => {
    console.log(`Generating text "${text}" in style "${style}" within`, selection);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a master graphic designer AI. Your task is to add text to the provided image within a specified bounding box. The text must be seamlessly integrated, appearing as if it's a natural part of the scene and indistinguishable from a real object.
Text to add: "${text}"
Style of text: "${style}"
Location: Add the text within the bounding box defined by top-left corner (x: ${selection.x}, y: ${selection.y}) and dimensions (width: ${selection.width}, height: ${selection.height}).

CRITICAL INSTRUCTIONS:
1.  **Analyze Surface Geometry:** You must analyze the perspective, 3D orientation, lighting, shadows, and textures of the surface inside the bounding box.
2.  **Warp Text to Perspective:** The generated text must be perfectly warped and transformed to match the surface's geometry and perspective. If the surface is at an angle, the text must recede into the distance correctly.
3.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The text must be lit according to the scene's light sources and cast realistic shadows onto the surface. The color of the text and any reflections on it must be consistent with the surrounding scene's color palette. A color or lighting mismatch is a failure.
4.  **Do Not Change Anything Else:** The rest of the image outside the bounding box MUST remain completely unchanged.
5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'text generation');
};

/**
 * Generates an image with the sky replaced and the scene re-lit.
 * @param originalImage The original image file.
 * @param skyPrompt The description of the new sky.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateReplacedSky = async (
    originalImage: File,
    skyPrompt: string
): Promise<string> => {
    console.log(`Replacing sky with: ${skyPrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an expert landscape photographer and photo editor AI. Your task is to perform a sky replacement on the provided image.

New Sky Description: "${skyPrompt}"

CRITICAL INSTRUCTIONS:
1.  **Identify Sky:** Accurately identify the sky region in the original image.
2.  **Replace Sky:** Replace it with a new, photorealistic sky based on the user's description.
3.  **RELIGHT THE SCENE:** This is the most important step. You MUST realistically relight the entire foreground and all subjects to match the color, mood, and light source direction of the new sky. For example, a sunset sky should cast warm, golden light on the landscape. A stormy sky should result in a darker, more dramatic foreground.
4.  **CRITICAL FOREGROUND PRESERVATION:** The foreground, including any people, must be perfectly preserved. Do not alter their pose, angle, or facial expression. Your only task is to replace the sky and realistically relight the existing foreground to match.
5.  **CRITICAL IDENTITY PRESERVATION:** The recognizable facial features, ethnicity, bone structure, and identity of any person in the foreground MUST be perfectly and absolutely preserved. The person must look like the same individual. Do NOT alter their core facial structure or race.
6.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'sky replacement');
};

/**
 * Inserts a described object into a selected area of an image.
 * @param originalImage The original image file.
 * @param objectPrompt The description of the object to insert.
 * @param selection The location to add the object.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateInsertedObject = async (
    originalImage: File,
    objectPrompt: string,
    selection: { x: number; y: number, width: number, height: number }
): Promise<string> => {
    console.log(`Inserting object "${objectPrompt}" within`, selection);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a master digital compositor AI. Your task is to generate and insert an object into the provided image within a specified bounding box. The final result must be indistinguishable from a real photograph.

Object to add: "${objectPrompt}"
Location: Add the object within the bounding box defined by top-left corner (x: ${selection.x}, y: ${selection.y}) and dimensions (width: ${selection.width}, height: ${selection.height}).

CRITICAL INSTRUCTIONS:
1.  **Analyze Scene Geometry:** You MUST analyze the perspective, 3D orientation, lighting, shadows, and textures of the scene inside the bounding box.
2.  **Generate & Position Object:** Create the object and position it naturally within the 3D space. It must be scaled correctly relative to other elements in the scene. A 1-foot tall object should not appear larger than a nearby 6-foot tall person. The pose or angle of the generated object must be physically plausible.
3.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The object must be lit according to the scene's light sources and cast realistic shadows onto the environment. The object's color and reflections must be consistent with the surrounding scene's color palette. A color or lighting mismatch is a failure.
4.  **Do Not Change Anything Else:** The rest of the image outside the bounding box MUST remain completely unchanged.
5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'object insertion');
};

/**
 * Fuses facial features from a reference image onto the subject of the original image.
 * @param originalImage The main image with a person.
 * @param faceRefImage The image containing the face to source features from.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateFusedFaceImage = async (
    originalImage: File,
    faceRefImage: File,
): Promise<string> => {
    console.log(`Starting face fusion.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const faceRefImagePart = await fileToPart(faceRefImage);
    
    const prompt = `You are a digital portrait artist AI. You will be given two images: an 'Original Image' and a 'Face Reference Image'.
    **Your task is to subtly blend the key facial features (like eye shape, nose, mouth) of the person in the Face Reference Image onto the face of the main subject in the Original Image.**
    
    CRITICAL INSTRUCTIONS:
    1.  **Identify Faces:** Accurately identify the main face in both images.
    2.  **Fuse Features:** Blend the facial structure and features from the Face Reference Image onto the Original Image's subject.
    3.  **Preserve Original's Essence:** The final result should still resemble the person in the Original Image, but with distinct characteristics from the reference face. It's a fusion, not a simple replacement. Maintain the Original Image's pose, hair, expression, and overall head shape.
    4.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The fused face must be flawlessly re-lit to match the lighting, color grading, and skin tone of the Original Image.
    5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the Original Image.
    6.  **Return Correct Image:** You MUST return the modified Original Image. Do not return the Face Reference Image.
    
    Output: Return ONLY the final fused-face image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Face Reference Image:"},
            faceRefImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'face fusion');
};


/**
 * Transfers the clothing from a style reference image to the person in the original image.
 * @param originalImage The image of the person to dress.
 * @param styleRefImage The image containing the clothing to transfer.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateStyleTransferredImage = async (
    originalImage: File,
    styleRefImage: File,
): Promise<string> => {
    console.log(`Starting clothing transfer.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const styleRefImagePart = await fileToPart(styleRefImage);
    
    const prompt = `You are an AI fashion stylist. You will be given two images: an 'Original Image' with a person, and a 'Clothing Reference Image'.
    **Your task is to take the clothing/outfit from the Clothing Reference Image and realistically dress the person in the Original Image with it.**
    
    CRITICAL INSTRUCTIONS:
    1.  **Identify Person & Clothing:** Accurately identify the main person in the Original Image and the main outfit in the Clothing Reference Image.
    2.  **Transfer Clothing:** Redraw the person in the Original Image wearing the identified outfit. The clothing must be realistically adapted to the person's body shape, pose, and posture.
    3.  **CRITICAL POSE & IDENTITY PRESERVATION:** You MUST perfectly preserve the pose, angle, facial expression, hair, and identity of the person in the Original Image. Do not change them.
    4.  **CRITICAL BACKGROUND PRESERVATION:** The background of the Original Image MUST be preserved.
    5.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The transferred clothing must be flawlessly re-lit to match the lighting, shadows, and color grading of the Original Image.
    6.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the Original Image.
    
    Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Clothing Reference Image:"},
            styleRefImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'clothing transfer');
};

/**
 * Swaps the face of the person in the original image with the face from a reference image.
 * @param originalImage The main image with a person whose face will be replaced.
 * @param faceRefImage The image containing the new face.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateSwappedFaceImage = async (
    originalImage: File,
    faceRefImage: File,
): Promise<string> => {
    console.log(`Starting face swap.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const faceRefImagePart = await fileToPart(faceRefImage);
    
    const prompt = `You are a specialist AI for digital face replacement. You will be given two images: an 'Original Image' and a 'Face Reference Image'.
    **Your task is to perfectly replace the face of the main subject in the Original Image with the face from the Face Reference Image.**
    
    CRITICAL INSTRUCTIONS:
    1.  **Identify Faces:** Accurately identify the main face in both images.
    2.  **Replace Face:** Perform a clean and seamless replacement.
    3.  **Preserve Original's Pose:** The head position, angle, and tilt of the person in the Original Image MUST be maintained. The swapped face must be perfectly warped to fit this pose.
    4.  **Preserve Everything Else:** The hair, body, clothing, and background of the Original Image must remain completely unchanged.
    5.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The swapped face must be flawlessly re-lit and color-corrected to match the lighting, shadows, and skin tone of the body in the Original Image.
    6.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the Original Image.
    
    Output: Return ONLY the final face-swapped image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Face Reference Image:"},
            faceRefImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'face swap');
};

/**
 * Composites a new person into an image.
 * @param originalImage The base image.
 * @param options The options for generating the person.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateCompositedPersonImage = async (
    originalImage: File,
    options: AddPersonOptions,
): Promise<string> => {
    console.log(`Starting 'Add Person' with options:`, options);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const parts: any[] = [{ text: "Original Image:" }, originalImagePart];

    let personSourcePrompt = '';
    if (options.personRefImage) {
        const personRefPart = await fileToPart(options.personRefImage);
        parts.push({ text: "Reference Person Image:" }, personRefPart);
        personSourcePrompt = `Use the person from the "Reference Person Image" as the person to add. Preserve their identity perfectly.`;
        if (options.prompt) {
            personSourcePrompt += ` Additionally, apply this description: "${options.prompt}".`;
        }
    } else {
        personSourcePrompt = `Generate a new person based on this description: "${options.prompt}".`;
    }

    const posePreservation = options.preserveMainSubjectPose 
        ? "The pose of the main subject in the original photo MUST be preserved. Do not change them."
        : "The pose of the main subject may be slightly and naturally adjusted to better interact with the new person, but their identity and general position must be preserved.";

    const lightingInstruction = options.lightingMatch === 'match'
        ? "The added person must be flawlessly lit to match the lighting, shadows, and color grading of the Original Image. They must look like they were photographed in that scene at the same time."
        : "The original lighting on the added person should be kept as much as possible, for a collage effect."

    const prompt = `You are a master digital compositor AI, specializing in hyper-realistic subject integration. Your task is to flawlessly add a person to the provided 'Original Image'. The final result must be indistinguishable from a single, untouched photograph.

//-- PERSON SPECIFICATION --//
Source: ${personSourcePrompt}
Style: The generated person and the final image must be photorealistic. Prioritize this style: ${options.style}.

//-- COMPOSITION & POSE --//
Placement: Place the new person on the ${options.placement} side of the main subject. They should be integrated naturally into the scene's depth and perspective.
Interaction/Pose: The new person's pose must be physically plausible and appropriate for the scene. The primary interaction is defined as: "${options.familiarity}".
Gaze: Their gaze should be ${options.gazeDirection}.
Face Orientation: Their face should be ${options.faceDirection}.
Custom Pose: If a custom pose is specified, it is the highest priority: "${options.posePrompt}".

//-- NON-NEGOTIABLE CRITICAL RULES --//
1.  **IDENTITY PRESERVATION (NEW PERSON):** If a "Reference Person Image" is provided, the identity, facial features, ethnicity, and unique characteristics of the person in that reference image MUST be perfectly preserved in the added person.
2.  **IDENTITY PRESERVATION (MAIN SUBJECT):** The identity, facial features, clothing, and pose of the person already in the 'Original Image' MUST be perfectly preserved. ${posePreservation}
3.  **SCENE & LIGHTING INTEGRATION:**
    -   **Analyze First:** Before rendering, you MUST analyze the 'Original Image' for its lighting direction, color temperature, shadow softness, and lens properties (depth of field, perspective).
    -   **Flawless Match:** ${lightingInstruction} Any mismatch in lighting is a failure.
4.  **SEAMLESS COMPOSITION:**
    -   The added person must be scaled correctly relative to the environment and any existing subjects.
    -   The integration must be seamless, with no visible edges or artifacts.
5.  **CANVAS MANAGEMENT:** If the new person does not fit, you are authorized to expand the canvas (outpainting) to create a natural composition. The original image content must not be cropped.

Output: You must return ONLY the final, composited image. Do not output any text, explanation, or commentary.`;

    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: parts },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'add person');
};


/**
 * Transfers makeup from a reference image to the person in the original image.
 * @param originalImage The image of the person to apply makeup to.
 * @param makeupRefImage The image containing the makeup style.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateMakeupTransferredImage = async (
    originalImage: File,
    makeupRefImage: File,
): Promise<string> => {
    console.log(`Starting makeup transfer.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const makeupRefImagePart = await fileToPart(makeupRefImage);
    
    const prompt = `You are an AI makeup artist. You will be given two images: an 'Original Image' with a person, and a 'Makeup Reference Image'.
    **Your task is to take the makeup style (eyeshadow, lipstick, blush, etc.) from the Makeup Reference Image and apply it to the person in the Original Image.**
    
    CRITICAL INSTRUCTIONS:
    1.  **Identify Makeup & Face:** Accurately analyze the makeup style in the reference image and identify the face in the original image.
    2.  **Apply Makeup:** Apply the makeup style to the person in the Original Image.
    3.  **CRITICAL IDENTITY & POSE PRESERVATION:** You MUST perfectly preserve the facial features, identity, pose, expression, and hair of the person in the Original Image. Only add the makeup.
    4.  **CRITICAL BACKGROUND PRESERVATION:** The background of the Original Image MUST be preserved.
    5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the Original Image.
    
    Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Makeup Reference Image:"},
            makeupRefImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'makeup transfer');
};

/**
 * Applies makeup to a person in an image based on a text prompt.
 * @param originalImage The image of the person.
 * @param prompt The description of the makeup style.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateMakeup = async (
    originalImage: File,
    prompt: string,
): Promise<string> => {
    console.log(`Starting makeup generation with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const textPart = { text: `You are an AI makeup artist. Your task is to apply makeup to the person in this image based on the user's request.
    
    Makeup Request: "${prompt}"
    
    CRITICAL INSTRUCTIONS:
    1.  **CRITICAL IDENTITY & POSE PRESERVATION:** You MUST perfectly preserve the facial features, ethnicity, bone structure, identity, pose, expression, and hair of the person. Only add the described makeup. Do NOT alter their core facial structure.
    2.  **CRITICAL BACKGROUND PRESERVATION:** The background of the image MUST be preserved.
    3.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.
    
    Output: Return ONLY the final edited image. Do not return text.` };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'makeup generation');
};

/**
 * Expands the image canvas with generative content for the Randomize tool.
 * @param originalImage The original image file.
 * @param prompt A creative prompt for the expansion.
 * @returns A promise that resolves to the data URL of the expanded image.
 */
export const expandImage = async (
    originalImage: File,
    prompt: string,
): Promise<string> => {
    console.log(`Expanding image with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const textPart = { text: `You are a creative AI artist. Your task is to take the core subject of this image and place it in a completely new, surprising, and creative scene, expanding the canvas (outpainting) as needed.
    
    Creative Brief: "${prompt}"
    
    CRITICAL INSTRUCTIONS:
    1.  **Preserve Core Subject:** The main person or object from the original image should be recognizable and integrated into the new scene. You can adjust their lighting to match, but their identity and form should be preserved.
    2.  **Generate New Scene:** Create a new, high-quality, and imaginative background and environment around the subject.
    3.  **Seamless Integration:** The original subject must be blended seamlessly into the new scene.
    
    Output: Return ONLY the final creative image. Do not return text.` };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'image expansion');
};

/**
 * Expands the image canvas by filling in transparent areas (outpainting).
 * @param paddedImage An image file with transparent padding around the original content.
 * @param prompt A text prompt to guide the fill process.
 * @returns A promise that resolves to the data URL of the expanded image.
 */
export const generativeExpand = async (
    paddedImage: File,
    prompt: string
): Promise<string> => {
    console.log(`Generatively expanding image with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const imagePart = await fileToPart(paddedImage);
    const textPart = { text: `You are an expert AI photo editor with the ability to "outpaint" or generatively fill transparent areas of an image. The user has provided an image with transparent padding around it.

Your task is to fill ONLY the transparent areas, seamlessly extending the content of the original image.

User Guidance: "${prompt || 'Extend the image naturally in all directions, matching the existing content.'}"

CRITICAL RULES:
1.  **PRESERVE THE ORIGINAL:** The non-transparent part of the image MUST remain completely unchanged and perfectly preserved.
2.  **FILL TRANSPARENCY ONLY:** Your generation must be confined to the transparent pixels.
3.  **SEAMLESS BLENDING:** The generated content must perfectly match the style, lighting, color, textures, and perspective of the original image to create a seamless, photorealistic result.
4.  **MAINTAIN DIMENSIONS:** The final image must have the exact same dimensions as the input image (including the transparent padding).

Output: Return ONLY the final, filled image. Do not return text.` };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'generative expand');
};

/**
 * Generates an AI persona/styled image from an original image.
 * @param originalImage The original image file.
 * @param stylePrompt The prompt describing the persona or style.
 * @returns A promise that resolves to the data URL of the new image.
 */
export const generateStyledImage = async (
    originalImage: File,
    stylePrompt: string,
): Promise<string> => {
    console.log(`Starting persona generation: ${stylePrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a creative AI artist specializing in character and style transformations. Your task is to completely reimagine the person in the provided image based on a specific style request, while preserving their core identity.

Style Request: "${stylePrompt}"

CRITICAL INSTRUCTIONS:
1.  **CRITICAL IDENTITY PRESERVATION:** The recognizable facial features, ethnicity, bone structure, and identity of the person MUST be perfectly and absolutely preserved. The person must look like the same individual, but reimagined in the new style.
2.  **Full Transformation:** You have full creative freedom to change the clothing, hair, background, and overall aesthetic to perfectly match the requested style.
3.  **High Quality:** The final output should be a high-quality, photorealistic, and visually striking image.
4.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final styled image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'persona generation');
};

/**
 * Generates a new image from a different camera angle.
 * @param originalImage The original image file.
 * @param anglePrompt The prompt describing the new camera angle.
 * @returns A promise that resolves to the data URL of the new image.
 */
export const generateNewCameraAngle = async (
    originalImage: File,
    anglePrompt: string,
): Promise<string> => {
    console.log(`Generating new camera angle: ${anglePrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are an AI virtual cinematographer. Your task is to re-render the provided image from a completely new camera angle, as described by the user.

New Angle Request: "${anglePrompt}"

CRITICAL INSTRUCTIONS:
1.  **CRITICAL IDENTITY & SCENE PRESERVATION:** The recognizable facial features, ethnicity, identity, clothing, and core facial expression (e.g. smiling, neutral) of the person, AND the environment/background of the scene MUST be perfectly and absolutely preserved. The output should look like the same person in the same location, just filmed from a different angle.
2.  **Change Camera & Pose:** You must change the camera's position and angle according to the request. You can and should adjust the person's body pose to be natural and convincing from the new viewpoint, but their core facial expression must remain consistent. For example, for a low-angle shot, their body should be oriented correctly relative to the new camera position.
3.  **Photorealistic Result:** The final image must be photorealistic and geometrically correct for the new perspective. Any generated pose must be physically plausible.
4.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final image from the new angle. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'camera angle generation');
};

// FIX: Added missing Fashion AI functions.
/**
 * Generates an AI model image from a person's photo.
 * @param personImage The original image file with the person.
 * @returns A promise resolving to the data URL of the model image.
 */
export const generateModelImage = async (
    personImage: File,
): Promise<string> => {
    console.log(`Starting model generation from person image.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const personImagePart = await fileToPart(personImage);
    const prompt = `You are an expert AI fashion model creator. Your task is to take the person from the provided image, isolate them, and place them on a clean, neutral, light gray studio background. The person's entire body should be visible in a standard standing pose.

CRITICAL INSTRUCTIONS:
1.  **PERFECTLY PRESERVE IDENTITY:** The person's face, body shape, and identity MUST be perfectly preserved.
2.  **NEUTRAL BACKGROUND:** The background MUST be a simple, light gray, professional studio backdrop.
3.  **STANDARD POSE:** The person should be in a full-body, standing A-pose or a similar neutral fashion model pose. If they are not in a standing pose, change their pose to be standing.
4.  **PRESERVE ORIGINAL CLOTHING:** The person should be wearing the same clothes as in the original image.
5.  **PHOTOREALISTIC RESULT:** The final image must be photorealistic and high-quality.
6.  **PRESERVE DIMENSIONS:** The final image must have the exact same dimensions as the original image.

Output: Return ONLY the final model image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [personImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'model generation');
};

/**
 * Applies a garment to a model image (virtual try-on).
 * @param modelImage The image of the person/model.
 * @param garmentImage The image of the garment.
 * @returns A promise resolving to the data URL of the try-on image.
 */
export const generateVirtualTryOnImage = async (
    modelImage: File,
    garmentImage: File,
): Promise<string> => {
    console.log(`Starting virtual try-on.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const modelImagePart = await fileToPart(modelImage);
    const garmentImagePart = await fileToPart(garmentImage);
    
    const prompt = `You are an AI fashion stylist specializing in virtual try-on. You will be given a 'Model Image' of a person and a 'Garment Image' of a piece of clothing.

**Your task is to realistically dress the person in the Model Image with the clothing from the Garment Image.**

CRITICAL INSTRUCTIONS:
1.  **IDENTIFY PERSON & GARMENT:** Accurately identify the main person in the 'Model Image' and the garment in the 'Garment Image'.
2.  **APPLY GARMENT REALISTICALLY:** Redraw the person in the 'Model Image' wearing the garment. The clothing must be realistically adapted to the person's body shape, pose, and posture, including natural folds, wrinkles, and shadows.
3.  **CRITICAL POSE & IDENTITY PRESERVATION:** You MUST perfectly preserve the pose, angle, facial expression, hair, and identity of the person in the 'Model Image'. Do not change them.
4.  **CRITICAL BACKGROUND PRESERVATION:** The background of the 'Model Image' MUST be perfectly preserved.
5.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The new garment must be flawlessly re-lit to match the lighting, shadows, and color grading of the 'Model Image'.
6.  **PRESERVE DIMENSIONS:** The final image MUST have the exact same dimensions as the 'Model Image'.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Model Image:"},
            modelImagePart,
            { text: "Garment Image:"},
            garmentImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'virtual try-on');
};

/**
 * Changes the pose of a person in an image based on a text prompt.
 * @param personImage The image of the person.
 * @param posePrompt The text description of the new pose.
 * @returns A promise resolving to the data URL of the image with the new pose.
 */
export const generatePoseVariation = async (
    personImage: File,
    posePrompt: string,
): Promise<string> => {
    console.log(`Starting pose variation: ${posePrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const personImagePart = await fileToPart(personImage);
    const prompt = `You are an expert AI character poser. Your task is to re-render the person in the provided image in a new pose as described by the user, while keeping everything else the same.

New Pose Request: "${posePrompt}"

CRITICAL INSTRUCTIONS:
1.  **CRITICAL IDENTITY & CLOTHING PRESERVATION:** The recognizable facial features, ethnicity, identity, and the clothing of the person MUST be perfectly and absolutely preserved. The output should look like the same person in the same outfit, just in a different pose.
2.  **CHANGE POSE:** You must change the person's body pose to be natural and convincing according to the request. The new pose must be anatomically correct and physically plausible.
3.  **CRITICAL BACKGROUND PRESERVATION:** The background and environment of the scene MUST be perfectly and absolutely preserved.
4.  **PHOTOREALISTIC RESULT:** The final image must be photorealistic.
5.  **PRESERVE DIMENSIONS:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final image with the new pose. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [personImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'pose variation');
};

/**
 * Transforms an image to a different historical era.
 * @param originalImage The original image file.
 * @param eraPrompt A text prompt describing the target era.
 * @returns A promise that resolves to the data URL of the transformed image.
 */
export const generateTimeTraveledImage = async (
    originalImage: File,
    eraPrompt: string,
): Promise<string> => {
    console.log(`Starting time travel to: ${eraPrompt}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const prompt = `You are a historian and expert photo editor AI. Your task is to transform this entire image to look as if it were taken in the following era: "${eraPrompt}". The result must be a believable and seamless fabrication.

CRITICAL INSTRUCTIONS:
1.  **IDENTITY PRESERVATION (PARAMOUNT):** The recognizable facial features, ethnicity, bone structure, and unique identity of any person in the image MUST be perfectly and absolutely preserved. The person must look like the same individual, simply transported to another time. Any alteration of their core facial structure or identity is a failure.
2.  **POSE & COMPOSITION PRESERVATION:** The core pose of any person and the fundamental composition of the scene (e.g., subject on the left, background element on the right) MUST be preserved. Do not change their posture or the general layout.
3.  **AUTHENTIC & COMPLETE TRANSFORMATION:** You MUST change the clothing, the entire environment/background, objects, technology, and overall photographic style (e.g., color saturation, grain, lighting) to be authentically representative of the specified era. For example, a 1920s photo should be black and white with period-correct clothing and background. A cyberpunk future should feature neon lights, futuristic attire, and a high-tech setting.
4.  **PHOTOREALISTIC & SEAMLESS RESULT:** The final image must be high-quality and photorealistic, appearing as a genuine photograph from that time period. The integration of the subject into the new era must be flawless.
5.  **DIMENSION PRESERVATION:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final, time-traveled image. Do not return text.`;
    const textPart = { text: prompt };

    console.log('Sending image and time travel prompt to the model...');
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    console.log('Received response from model for time travel.', response);
    
    return handleApiResponse(response, 'time travel');
};

/**
 * Realistically projects a texture or pattern onto a selected area of an image.
 * @param originalImage The base image.
 * @param patternImage The image containing the pattern to apply.
 * @param selection The area to apply the pattern to.
 * @param scale The percentage to scale the pattern.
 * @param strength The strength/opacity of the blend.
 * @param prompt An optional text description of the pattern.
 * @returns A promise resolving to the data URL of the edited image.
 */
export const generateProjectedTexture = async (
    originalImage: File,
    patternImage: File,
    selection: { x: number; y: number; width: number; height: number },
    scale: number,
    strength: number,
    prompt: string
): Promise<string> => {
    console.log(`Projecting texture with scale ${scale}, strength ${strength}, and prompt: "${prompt}"`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const patternImagePart = await fileToPart(patternImage);

    const mainPrompt = `You are an expert digital artist specializing in realistic texture projection. You will be given an 'Original Image', a 'Pattern Image', and a selection area.

Your task is to apply the texture/pattern from the 'Pattern Image' onto the 'Original Image', but ONLY within the specified selection area. The result must be photorealistic and indistinguishable from a real object with that pattern.

Selection Area: Perform the edit ONLY within the bounding box defined by top-left corner (x: ${selection.x}, y: ${selection.y}) and dimensions (width: ${selection.width}, height: ${selection.height}).
User Guidance for Pattern: "${prompt || 'Apply the pattern from the image as a texture.'}"

CRITICAL INSTRUCTIONS:
1.  **Analyze Surface:** Deeply analyze the geometry, perspective, folds, wrinkles, and existing texture of the surface within the selection area of the 'Original Image'.
2.  **Warp Pattern:** Realistically warp, stretch, and bend the pattern from the 'Pattern Image' to perfectly conform to the 3D contours of the surface. The pattern should look like it's naturally part of the object, not just a flat overlay.
3.  **Integrate Lighting:** The applied pattern MUST be re-lit to match the lighting, shadows, and highlights of the 'Original Image' perfectly. If part of the surface is in shadow, the pattern on it must also be in shadow.
4.  **Blend Textures:** Blend the new pattern with the original surface's underlying texture based on the 'Effect Strength' of ${strength}%. A strength of 100 completely replaces the original texture, while 50 is a semi-transparent blend.
5.  **Adjust Scale:** The pattern from the 'Pattern Image' should be tiled or scaled to ${scale}% of its original size before being applied to the surface.
6.  **Preserve Outside:** Everything outside the selection area must remain completely untouched.
7.  **Preserve Identity:** If the selection is on a person, their identity, face, and body shape must be preserved.
8.  **Preserve Dimensions:** The output image must have the exact same dimensions as the 'Original Image'.

Output: Return ONLY the final edited image. Do not return text.`;
    const textPart = { text: mainPrompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Pattern Image:"},
            patternImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'texture projection');
};

/**
 * Transforms a person in an image into a specified character (cosplay).
 * @param originalImage The base image with a person.
 * @param options The options for the cosplay generation.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateCosplayImage = async (
    originalImage: File,
    options: CosplayOptions,
): Promise<string> => {
    console.log(`Starting 'Cosplay' with options:`, options);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const parts: any[] = [{ text: "Original Image:" }, originalImagePart];

    let characterSourcePrompt = '';
    if (options.characterRefImage) {
        const characterRefPart = await fileToPart(options.characterRefImage);
        parts.push({ text: "Reference Character Image:" }, characterRefPart);
        characterSourcePrompt = `Use the character from the "Reference Character Image" as the target cosplay.`;
        if (options.characterName) {
            characterSourcePrompt += ` The character is known as "${options.characterName}".`;
        }
    } else {
        characterSourcePrompt = `The target character is: "${options.characterName}".`;
    }

    let environmentPrompt = '';
    switch (options.environmentOption) {
        case 'auto':
            environmentPrompt = `The background environment MUST be changed to match the character's original universe or a typical setting for them.`;
            break;
        case 'custom':
            environmentPrompt = options.environmentPrompt
                ? `The background environment MUST be changed to: "${options.environmentPrompt}".`
                : `The original background MUST be preserved.`;
            break;
        case 'original':
        default:
            environmentPrompt = `The original background, lighting, and environment from the 'Original Image' MUST be perfectly preserved. The subject should appear as if they are wearing the costume in the original location.`;
    }

    const transferInstructions: string[] = [];
    if (options.transferClothing) {
        transferInstructions.push("The character's complete outfit/clothing MUST be transferred.");
    }
    if (options.transferHair) {
        transferInstructions.push("The character's hair style and color MUST be transferred.");
    }
    if (options.transferEquipment) {
        transferInstructions.push("Any of the character's signature equipment, accessories, or weapons MUST be transferred.");
    }

    const transferPrompt = transferInstructions.length > 0
        ? `You will transfer the following elements from the character to the person: ${transferInstructions.join(' ')}`
        : "You will not transfer any specific elements; just use the character as a general style guide.";

    let posePrompt = '';
    if (options.preserveOriginalPose) {
        posePrompt = `CRITICAL POSE PRESERVATION: The person's exact pose from the 'Original Image' MUST be perfectly preserved. Do not change their posture, limb positions, or stance. This is the highest priority pose instruction and overrides all others.`;
    } else if (options.copyPose && options.characterRefImage) {
        posePrompt = `The person's pose MUST be changed to match the pose of the character in the "Reference Character Image". This is the highest priority pose instruction.`;
    } else {
        posePrompt = `The person in the original image must be redrawn in this pose: "${options.pose}".`;
    }

    const prompt = `You are an expert AI photo editor. Your task is to take a character's elements and realistically apply them to the person in the 'Original Image'. The result must be a photorealistic image of the original person in a high-quality cosplay.

//-- CHARACTER & COSTUME --//
Character: ${characterSourcePrompt}
Transfer Elements: ${transferPrompt}

//-- POSE & SCENE --//
Pose: ${posePrompt}
Environment: ${environmentPrompt}

//-- CRITICAL RULES --//
1.  **CORE TASK: CREATE A REALISTIC COSPLAY PHOTO.** Your ONLY job is to apply the selected character elements to the person from the 'Original Image'. The final image must look like a real-world photograph of a person in a physical cosplay outfit.
2.  **PERFECT IDENTITY PRESERVATION:** The face, facial features, bone structure, ethnicity, and unique identity of the person in the 'Original Image' MUST be perfectly preserved. It must be the SAME PERSON, just in cosplay. Any change to their identity is a failure.
3.  **REALISTIC ELEMENTS:** Transferred elements (costume, hair, equipment) must look like real materials (fabric, leather, metal, etc.) with realistic textures, folds, and lighting. They should not look like a drawing or a 3D render.
4.  **SEAMLESS FIT & LIGHTING:** The transferred elements must fit the person's body and the new pose realistically. The lighting on all elements and the person MUST perfectly match the lighting of the final background environment.

Output: You must return ONLY the final, photorealistic image. Do not output any text.`;


    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: parts },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'cosplay generation');
};

/**
 * Replaces an object in a selected area with a new one and adjusts the context.
 * @param originalImage The original image file.
 * @param prompt The description of what the object should be replaced with.
 * @param selection The location of the object to replace.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateAlternateHistoryImage = async (
    originalImage: File,
    prompt: string,
    selection: { x: number; y: number, width: number, height: number }
): Promise<string> => {
    console.log(`Generating alternate history for prompt "${prompt}" within`, selection);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const textPart = { text: `You are an expert digital artist specializing in 'what-if' scenarios and alternate histories. Your task is to perform a contextual replacement within a specified bounding box on the provided image.

User Request: "What if this was ${prompt}?"
Location: The object to replace is within the bounding box defined by top-left corner (x: ${selection.x}, y: ${selection.y}) and dimensions (width: ${selection.width}, height: ${selection.height}).

CRITICAL INSTRUCTIONS:
1.  **Identify & Replace:** First, identify the primary object within the user-specified selection box. Then, completely replace that object with a new one based on the user's prompt: "${prompt}".
2.  **CRITICAL CONTEXTUAL BLENDING:** After replacing the object, you MUST subtly and realistically alter the immediate surroundings to be consistent with the new object. For example, if a modern car on asphalt is replaced with a horse-drawn carriage, the ground beneath and around it might become a dirt or cobblestone road. If a candle is replaced with a sci-fi glowing orb, the light and color it casts on nearby surfaces MUST change.
3.  **SEAMLESS INTEGRATION:** The new object and the altered surroundings must blend seamlessly with the rest of the image. The result must be photorealistic and indistinguishable from a real photograph.
4.  **Preserve Rest of Image:** The rest of the image outside the immediate area of the change must be perfectly preserved.
5.  **Maintain Scene Integrity:** Preserve the overall composition, lighting style, and identity of any people in the photo who are not part of the replacement.
6.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.

Output: Return ONLY the final edited image. Do not return text.` };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'alternate history generation');
};

/**
 * Creatively shuffles/fuses two images together.
 * @param originalImage The base image with the main subject and composition.
 * @param influenceImage The image providing the style, mood, and aesthetic.
 * @returns A promise that resolves to the data URL of the shuffled image.
 */
export const generateShuffledImage = async (
    originalImage: File,
    influenceImage: File,
): Promise<string> => {
    console.log(`Starting creative shuffle with influence image.`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const originalImagePart = await fileToPart(originalImage);
    const influenceImagePart = await fileToPart(influenceImage);
    
    const prompt = `You are a master visual compositor and world-builder AI, an expert at transplanting subjects into new realities. You will receive an 'Original Image' containing a subject and an 'Influence Image' defining a new world.

**CORE TASK: Your mission is to extract the primary subject from the 'Original Image' and completely re-render them within the environment, atmosphere, and artistic style of the 'Influence Image'. The result should not be a simple blend or style transfer, but a believable, cohesive new scene where the original subject has been fully integrated.**

//-- YOUR STEP-BY-STEP PROCESS --//

1.  **ANALYZE 'ORIGINAL IMAGE':**
    *   Accurately identify and isolate the primary subject(s).
    *   Lock in their core identity: recognizable facial features, ethnicity, and bone structure.
    *   Lock in their core pose, expression, and position within the frame.

2.  **ANALYZE 'INFLUENCE IMAGE':**
    *   Deconstruct the "World Rules" of this image. What is the environment? The time of day?
    *   Determine the **Lighting Physics**: Identify all light sources, their direction, color, and intensity. Note the quality of shadows (hard vs. soft).
    *   Determine the **Atmosphere**: Is there fog, rain, dust, lens flare, or any other environmental effect?
    *   Determine the **Artistic Style**: Is it photorealistic, an oil painting, watercolor, cyberpunk digital art, etc.? Analyze its textures, color palette, and rendering technique.

3.  **TRANSPLANT & RE-RENDER (THE CRITICAL STEP):**
    *   Place the subject from the 'Original Image' into the world of the 'Influence Image'.
    *   **Re-Light the Subject:** The subject MUST be completely re-lit according to the 'Influence Image's' lighting physics. They must cast new, physically accurate shadows onto the new environment. Their surfaces must receive colored bounce light and reflections from their new surroundings. (e.g., a subject in a forest must have dappled green light on them).
    *   **Apply Atmosphere:** The subject must be realistically affected by the new atmosphere. If it's a foggy scene, parts of the subject must be obscured by fog.
    *   **Unify the Style:** The subject themselves MUST be rendered in the exact same artistic style as the 'Influence Image'. If the influence is a painting, the subject's form should be described with the same brushwork and texture, while remaining perfectly recognizable.

//-- NON-NEGOTIABLE CRITICAL RULES --//

1.  **IDENTITY PRESERVATION IS PARAMOUNT:** The final image must depict the exact same person from the 'Original Image', without any change to their facial structure, ethnicity, or defining features. This is the most important rule.
2.  **POSE PRESERVATION:** The subject's core pose and facial expression from the 'Original Image' must be maintained.
3.  **COHESIVE REALITY, NOT A COLLAGE:** The final output must be a single, unified artwork. It should look like the subject was originally photographed or painted in the new scene, not digitally added later.
4.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the 'Original Image'.

Output: Return ONLY the final, masterfully composited image. Do not return text.`;
    const textPart = { text: prompt };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [
            { text: "Original Image:"},
            originalImagePart,
            { text: "Influence Image:"},
            influenceImagePart,
            textPart
        ]},
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'image shuffle');
};


/**
 * Generates AI-powered suggestions for a given tool context.
 * @param toolContext A string describing the tool, e.g., "Artistic Filters".
 * @returns A promise that resolves to an array of suggestion objects.
 */
export const generateAiSuggestions = async (toolContext: string): Promise<{name: string, prompt: string}[]> => {
    console.log(`Generating suggestions for: ${toolContext}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `You are a creative assistant for a photo editor. Generate 4 unique, creative, and interesting ideas for the tool: "${toolContext}".
For each idea, provide a short, catchy "name" (3 words max) and a detailed, descriptive "prompt" that the AI can use to execute the idea.
Return the response as a JSON array of objects, where each object has a "name" and a "prompt" key.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                    }
                }
            }
        },
    });
    
    const jsonString = response.text.trim();
    try {
        const suggestions = JSON.parse(jsonString);
        if (Array.isArray(suggestions) && suggestions.every(s => s.name && s.prompt)) {
            return suggestions.slice(0, 4); // Ensure only 4 are returned
        }
        throw new Error('Invalid suggestion structure received from AI.');
    } catch (e) {
        console.error('Failed to parse AI suggestions response:', jsonString, e);
        throw new Error('Could not get suggestions from the AI.');
    }
};

// FIX: Added missing function to generate AI themes.
/**
 * Generates an AI theme for the Aesthetic AI feature.
 * @param themeIdea A string describing the desired theme.
 * @returns A promise resolving to a theme object.
 */
export const createAiTheme = async (themeIdea: string): Promise<{ title: string; description: string; categories: string[] }> => {
    console.log(`Generating AI theme for: ${themeIdea}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `You are a creative director. Based on the user's idea, generate a concept for an "Aesthetic AI" theme for a photo editor.

User Idea: "${themeIdea}"

Your task is to create:
1.  A short, catchy, and cool "title" for the theme (e.g., "Cybernetic Noir", "Solarpunk Utopia", "Vampire Chic").
2.  A one-sentence "description" that creatively explains the theme's aesthetic.
3.  A list of exactly 6 distinct and evocative "categories" or sub-styles within that theme. These will be used as prompts, so they should be descriptive (e.g., for "Cybernetic Noir", a category could be "Rain-Slicked Alleyways" or "Holographic Detective").

Return ONLY a single, valid JSON object with the keys "title", "description", and "categories" (which should be an array of 6 strings). Do not include any other text, explanations, or markdown formatting.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    categories: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                }
            }
        },
    });
    
    const jsonString = response.text.trim();
    try {
        const theme = JSON.parse(jsonString);
        if (theme.title && theme.description && Array.isArray(theme.categories) && theme.categories.length > 0) {
            return theme;
        }
        throw new Error('Invalid theme structure received from AI.');
    } catch (e) {
        console.error('Failed to parse AI theme response:', jsonString, e);
        throw new Error('Could not create a theme from the AI.');
    }
};


/**
 * Generates an image from a text prompt in the Design Studio.
 * @param prompt The text prompt.
 * @param aspectRatio The desired aspect ratio.
 * @returns A promise resolving to the base64 data URL of the image.
 */
export const generateImageFromText = async (
    prompt: string,
    aspectRatio: AspectRatio,
): Promise<string> => {
    console.log(`Generating image from text: "${prompt}" with aspect ratio ${aspectRatio}`);
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio,
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    
    throw new Error('Image generation failed. The model did not return an image.');
};

/**
 * Composites a person into a generated scene for the Design Studio.
 * This is a specialized version of `generateCompositedPersonImage`.
 * @param sceneImage The background image.
 * @param personOptions The options for the person to add.
 * @param posePrompt A specific prompt for the person's pose and action.
 * @returns A promise that resolves to the data URL of the final image.
 */
export const compositePersonIntoScene = async (
    sceneImage: File,
    personOptions: Partial<AddPersonOptions>,
    posePrompt: string,
): Promise<string> => {
    console.log('Compositing person into scene with options:', { personOptions, posePrompt });
    // FIX: Corrected 'pose' to 'posePrompt' and added a return statement.
    const fullOptions: AddPersonOptions = {
        prompt: personOptions.prompt || '',
        personRefImage: personOptions.personRefImage || null,
        placement: personOptions.placement || 'center',
        familiarity: personOptions.familiarity || 'Pose the added person naturally within the scene, respecting the environment and any implied action. The interaction should be neutral and non-intrusive.',
        gazeDirection: personOptions.gazeDirection || 'looking at camera',
        faceDirection: personOptions.faceDirection || 'facing camera',
        preserveMainSubjectPose: false, // Not applicable here
        style: 'realistic', // Prioritize realism for compositing
        posePrompt: posePrompt,
        lightingMatch: 'match'
    };

    return generateCompositedPersonImage(sceneImage, fullOptions);
};