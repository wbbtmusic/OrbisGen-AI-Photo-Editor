/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";
import { AddPersonOptions, Theme, AspectRatio } from "../types";

export const THEMES: Record<string, Omit<Theme, 'key'>> = {
  professional: {
    title: 'Professional Headshots',
    description: 'Generate polished, corporate-style headshots for your professional profiles.',
    categories: ['Corporate CEO', 'Startup Founder', 'Creative Director', 'LinkedIn Profile', 'Author Photo', 'Consultant'],
    getPrompt: (category: string) => `Reimagine the person as a ${category}. The image should be a high-quality, professional headshot suitable for a corporate website or professional network. The background should be a clean, professional setting (like a modern office or a neutral studio backdrop). The person's facial features and identity must be clearly preserved. The output must be a photorealistic image.`,
  },
  fantasy: {
    title: 'Fantasy Avatars',
    description: 'Transform your portrait into a character from a high-fantasy world.',
    categories: ['Noble Elf', 'Wise Wizard', 'Brave Knight', 'Mysterious Rogue', 'Dwarven Blacksmith', 'Forest Dryad'],
    getPrompt: (category: string) => `Transform the person into a fantasy character: a ${category}. This should include appropriate fantasy-style clothing, accessories, and a fitting magical or medieval background. The person's facial features and identity must be clearly preserved but integrated into the fantasy aesthetic. The style should be epic, detailed, and photorealistic fantasy art.`,
  },
  cyberpunk: {
    title: 'Cyberpunk Edgerunners',
    description: 'Enter a high-tech, low-life future with neon-drenched cyberpunk aesthetics.',
    categories: ['Netrunner', 'Street Samurai', 'Corporate Agent', 'Ripperdoc', 'Nomad', 'Techie'],
    getPrompt: (category:string) => `Reimagine the person as a Cyberpunk ${category}. The image should be set in a neon-lit, rainy, futuristic city. Include cybernetic enhancements, futuristic clothing, and a gritty, high-tech aesthetic. The person's facial features and identity must be clearly preserved. The output must be a photorealistic image with a cinematic, Blade Runner-esque feel.`,
  },
  historical: {
    title: 'Historical Portraits',
    description: 'Travel back in time and see yourself as a figure from a different era.',
    categories: ['Roman Senator', 'Viking Shieldmaiden', 'Victorian Aristocrat', '1920s Flapper', 'Ancient Egyptian Royalty', 'Renaissance Artist'],
    getPrompt: (category: string) => `Recreate the person's portrait in the style of a ${category}. This should include historically appropriate clothing, hairstyle, and a setting that evokes the correct time period. The person's facial features and identity must be preserved. The final image should look like a realistic painting or photograph from that era.`
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
        ? "CRITICAL COLOR & LIGHTING INTEGRATION: The added person must be flawlessly lit to match the lighting, shadows, and color grading of the Original Image. They must look like they were photographed in that scene at the same time."
        : "The original lighting on the added person should be kept as much as possible, for a collage effect."

    const prompt = `You are a master digital compositor AI. Your task is to add a person to the provided 'Original Image'.

**Person Source:** ${personSourcePrompt}
**Placement:** Place the new person on the ${options.placement} side of the main subject.
**Interaction/Pose:** The new person's pose should be natural for the scene. ${options.familiarity}. Their gaze should be ${options.gazeDirection} and their face should be ${options.faceDirection}. If a custom pose is specified, prioritize it: "${options.posePrompt}". Any generated pose must be physically plausible.
**Style:** The style should be photorealistic. Prioritize this style: ${options.style}.

CRITICAL INSTRUCTIONS:
1.  **Analyze Scene Geometry:** Analyze the perspective, scale, and 3D space of the original image.
2.  **Insert Person:** Place the new person into the scene, scaled correctly relative to the environment and any existing subjects.
3.  **${lightingInstruction}**
4.  **Main Subject Preservation:** ${posePreservation} The main subject's identity, facial features, and clothing must always be perfectly preserved.
5.  **Expand Canvas if Necessary:** If the new person does not fit within the original dimensions, you are allowed to expand the canvas (outpainting) to accommodate them naturally. The main subject from the original image should remain central.
6.  **Seamless Integration:** The final composition must be seamless and photorealistic.

Output: Return ONLY the final composited image. Do not return text.`;

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
 * Changes the clothing of a person in an image based on a text prompt.
 * @param originalImage The image of the person.
 * @param prompt The description of the new clothing.
 * @returns A promise that resolves to the data URL of the edited image.
 */
export const generateFashionImage = async (
    originalImage: File,
    prompt: string,
): Promise<string> => {
    console.log(`Starting fashion generation with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const textPart = { text: `You are an AI fashion stylist. Your task is to change the clothing of the person in this image based on the user's request.
    
    Clothing Request: "${prompt}"
    
    CRITICAL INSTRUCTIONS:
    1.  **CRITICAL POSE & IDENTITY PRESERVATION:** You MUST perfectly preserve the pose, angle, facial expression, hair, and identity of the person. Do not change them.
    2.  **CRITICAL BACKGROUND PRESERVATION:** The background of the image MUST be preserved.
    3.  **Realistic Fit:** The new clothing must realistically fit the person's body and pose.
    4.  **CRITICAL COLOR & LIGHTING INTEGRATION:** The new clothing must be flawlessly lit to match the lighting, shadows, and color grading of the original image.
    5.  **Preserve Dimensions:** The final image MUST have the exact same dimensions as the original image.
    
    Output: Return ONLY the final edited image. Do not return text.` };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [originalImagePart, textPart] },
        config: {
          safetySettings,
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    return handleApiResponse(response, 'fashion generation');
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const originalImagePart = await fileToPart(originalImage);
    const textPart = { text: `You are an AI makeup artist. Your task is to apply makeup to the person in this image based on the user's request.
    
    Makeup Request: "${prompt}"
    
    CRITICAL INSTRUCTIONS:
    1.  **CRITICAL IDENTITY & POSE PRESERVATION:** You MUST perfectly preserve the facial features, identity, pose, expression, and hair of the person. Only add the described makeup.
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
 * Expands the image canvas with generative content.
 * @param originalImage The original image file.
 * @param prompt A creative prompt for the expansion.
 * @returns A promise that resolves to the data URL of the expanded image.
 */
export const expandImage = async (
    originalImage: File,
    prompt: string,
): Promise<string> => {
    console.log(`Expanding image with prompt: ${prompt}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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

/**
 * Generates AI-powered suggestions for a given tool context.
 * @param toolContext A string describing the tool, e.g., "Artistic Filters".
 * @returns A promise that resolves to an array of suggestion objects.
 */
export const generateAiSuggestions = async (toolContext: string): Promise<{name: string, prompt: string}[]> => {
    console.log(`Generating suggestions for: ${toolContext}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
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
    const fullOptions: AddPersonOptions = {
        prompt: personOptions.prompt || '',
        personRefImage: personOptions.personRefImage || null,
        placement: personOptions.placement || 'center',
        familiarity: personOptions.familiarity || 'Pose the person to be standing naturally and respectfully within the scene.',
        gazeDirection: personOptions.gazeDirection || 'looking at camera',
        faceDirection: personOptions.faceDirection || 'facing camera',
        preserveMainSubjectPose: false, // Not applicable here
        style: 'realistic', // Prioritize realism for compositing
        posePrompt: posePrompt,
        lightingMatch: 'match', // Always match lighting in Design Studio
    };

    // We can reuse the main compositing function
    return generateCompositedPersonImage(sceneImage, fullOptions);
};

/**
 * Generates a new AI persona theme based on a user idea.
 * @param idea The user's idea for a theme.
 * @returns A promise that resolves to the new theme object.
 */
export const createAiTheme = async (idea: string): Promise<{ title: string; description:string; categories: string[] }> => {
    console.log(`Generating AI theme for: ${idea}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a creative assistant. Based on the user's idea, generate a theme for an AI persona generator.
The theme needs a "title", a short "description", and a list of 6-8 distinct "categories" (character types, styles, or sub-genres) within that theme.
User Idea: "${idea}"
Return the response as a single, valid JSON object with the keys "title", "description", and "categories". The categories should be an array of strings.`,
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
                    }
                }
            }
        },
    });
    
    const jsonString = response.text.trim();
    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.title && parsed.description && Array.isArray(parsed.categories)) {
            return parsed;
        }
        throw new Error('Invalid theme structure received from AI.');
    } catch (e) {
        console.error('Failed to parse AI theme response:', jsonString, e);
        throw new Error('Could not generate a valid theme from the AI. Please try a different idea.');
    }
}