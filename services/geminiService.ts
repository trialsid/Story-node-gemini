import { GoogleGenAI } from "@google/genai";

// The API key is loaded from env.js, which should be created in the project root.
const getApiKey = (): string | undefined => {
    // The `process.env.API_KEY` is polyfilled by `env.js` on the window object.
    const apiKey = (globalThis as any).process?.env?.API_KEY;
    if (apiKey && apiKey !== "PASTE_YOUR_GEMINI_API_KEY_HERE") {
        return apiKey;
    }
    return undefined;
};

const API_KEY = getApiKey();

// Initialize the GenAI client only if the API key is available.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const stylePrompts: { [key: string]: string } = {
  'Studio Portrait Photo': 'A professional studio portrait with controlled lighting. Use a three-point lighting setup (key, fill, and back light) to create depth. The background should be a solid, neutral color. The subject should be in sharp focus with a shallow depth of field (e.g., f/2.8). High-resolution, crisp details.',
  'Cinematic Film Still': 'A cinematic film still with dramatic, moody lighting and high contrast (chiaroscuro). The color grading should be distinct, like teal and orange. Add a slight film grain and a widescreen aspect ratio feel. Look for anamorphic lens flares if appropriate.',
  'Action Shot Photo': 'A dynamic action shot, captured with a fast shutter speed to freeze motion. The image should convey movement and energy. Use motion blur on the background to emphasize the subject. The lighting should be dramatic and highlight the action.',
  'Golden Hour Portrait': 'A portrait taken during the golden hour (just after sunrise or before sunset). The lighting should be soft, warm, and directional, creating long shadows and a warm glow on the subject. A beautiful, natural bokeh effect in the background is desired.',
  'Fashion Magazine Shot': 'A high-fashion shot, styled like a page from a magazine. Posing should be deliberate and artistic. Lighting should be bold and creative, possibly using colored gels or hard light for dramatic effect. The composition should be strong and editorial.',
  'Candid Photo': 'A candid, unposed shot that looks natural and spontaneous. Use natural lighting. The setting should feel authentic, like a street scene or a cafe. The focus should be on capturing a genuine moment or emotion.',
  'Black and White Photo': 'A classic black and white photograph. Emphasize contrast, texture, and form. The lighting should create strong highlights and deep shadows to define the subject. The mood can range from dramatic to nostalgic.',
  'Documentary Style Photo': 'An authentic, documentary-style photo that tells a story. Use available light. The composition should be observational and unobtrusive, capturing the subject in their natural environment without staging. Focus on realism and narrative.',
};

const layoutPrompts: { [key: string]: string } = {
  '4-panel grid': 'A 4-panel grid layout. Each panel should showcase the character from a different perspective to provide a comprehensive reference. Include a mix of shots such as a full body view, a close-up portrait, an action pose, and a view showing an alternate expression or costume.',
  '6-panel grid': 'A 6-panel grid layout. Each panel must feature a distinct and unique shot of the character, showcasing various angles, costumes, and actions to create a detailed character sheet. Include front, back, and side profiles, along with action poses and emotional close-ups.',
  'T-pose reference sheet': 'A character reference sheet for 3D modeling. Display the character in a standard T-pose, providing clear, unobstructed front and back views on a neutral background.',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 2000;

const getFriendlyErrorMessage = (error: unknown): string => {
    if (!(error instanceof Error)) {
        return "An unknown error occurred.";
    }

    const message = error.message;

    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
        return "API quota exceeded. Please wait a moment and try again.";
    }

    // Try to parse for a more specific message from the API response
    try {
        const jsonStringMatch = message.match(/{.*}/);
        if (jsonStringMatch) {
            const errorObj = JSON.parse(jsonStringMatch[0]);
            if (errorObj?.error?.message) {
                return errorObj.error.message;
            }
        }
    } catch (e) {
        // Parsing failed, fall through to return the original message
    }
    
    return message;
};


export const generateImageFromPrompt = async (
  characterDescription: string,
  style: string,
  layout: string,
  aspectRatio: string
): Promise<string> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    const layoutInstruction = layoutPrompts[layout] || '';
    const styleInstruction = stylePrompts[style] || `A ${style}.`;

    const finalPrompt = `
    Create a photorealistic character reference sheet.
    **Character Description:** ${characterDescription}.
    **Style:** ${styleInstruction}
    **Layout:** ${layoutInstruction}
    Ensure the character is consistent across all panels/views. The background should be a solid, neutral color unless the style dictates otherwise. High-resolution, professional photography, photorealistic detail.
    `;

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: finalPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            } else {
                throw new Error("No image was generated by the API.");
            }
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            if ((errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) && attempt < MAX_RETRIES) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
                console.log(`Rate limit exceeded. Retrying in ${delay / 1000}s...`);
                await sleep(delay);
            } else {
                break; // Non-retriable error or max retries reached
            }
        }
    }
    
    console.error("Failed to generate image after all retries.", lastError);
    const friendlyMessage = getFriendlyErrorMessage(lastError);
    throw new Error(friendlyMessage);
};