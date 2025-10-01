

import { GoogleGenAI, Modality, Type } from "@google/genai";

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

const dataUrlToPart = (dataUrl: string) => {
    const [header, base64Data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType || !base64Data) {
        throw new Error('Invalid data URL format for image.');
    }
    return {
        inlineData: {
            mimeType,
            data: base64Data,
        },
    };
};

export const generateShortStory = async (
    premise: string,
    pointOfView: string
): Promise<string> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }
    if (!premise) {
        throw new Error("Please provide a story premise.");
    }

    const fullPrompt = `You are a master storyteller and creative writer. Your task is to take the following simple premise and expand it into a compelling, fully-fleshed short story of approximately 1500-2000 words. The final story must be a complete narrative with a clear beginning, middle, and end.

The Premise:
"${premise}"

Part 1: Character Development
Flesh out the characters with depth and nuance.
The Protagonist:
- Name & Demographics: Give them a name, an approximate age, and a profession.
- Core Motivation (The Want): What do they desperately want to achieve or obtain by the end of this story? This will be the engine of the plot.
- Internal Conflict (The Need): What do they actually need to learn or overcome? This often contradicts their "want." (e.g., They want revenge, but they need to find peace and let go).
- Defining Flaw: What is their greatest weakness? (e.g., Pride, insecurity, naivety, cynicism). How does this flaw sabotage their efforts?
- Key Skill or Strength: What are they uniquely good at? How will this help them face the story's central conflict?
The Antagonist / Antagonistic Force:
- Nature of the Conflict: Is the primary obstacle another person, a system/society, nature itself, or the protagonist's own inner demons? Define it clearly.
- Motivation (if a person): Why does this character oppose the protagonist? Give them a believable reason. A good antagonist doesn't see themselves as the villain.
- Relationship to Protagonist: How are they connected? Are they a rival, a family member, a former friend, a complete stranger?

Part 2: World & Atmosphere
Establish a vivid and immersive setting.
Setting:
- Location & Time Period: Be specific. Not just "a city," but "a rain-slicked, neon-lit alley in a cyberpunk Tokyo, 2077," or "a dusty, sun-baked Kansas town during the Great Depression."
- Sensory Details: Ground the story in the five senses. What are the dominant sights, sounds, and smells of this place? Is it cold? Humid? What does the air taste like?
Atmosphere & Tone:
- Mood: What feeling should the story evoke in the reader? (e.g., suspenseful, melancholic, hopeful, whimsical, unnerving).
- Tone: What is the authorial voice? (e.g., Ironic, sincere, journalistic, lyrical).

Part 3: Narrative Structure (The Plot Arc)
Structure the story using a clear three-act framework.
Act I: The Setup
- The Hook: Start with an engaging opening sentence that introduces the character and their world, and hints at the coming conflict.
- The "Normal" World: Briefly show the protagonist's life before the main conflict begins.
- The Inciting Incident: What is the specific event that kicks off the story and disrupts the protagonist's life, forcing them to act?
Act II: The Confrontation
- Rising Action: Create a sequence of 2-3 key events or obstacles. With each event, raise the stakes. The protagonist should try and fail, learn something new, and then try again. Show their flaw getting in their way.
- The Midpoint/Turning Point: A moment where the protagonist makes a crucial decision, gains new information, or the nature of the conflict changes, making it impossible to turn back.
- The Climax: This is the story's peak. The protagonist directly confronts the antagonistic force in a final, decisive showdown. The outcome here will resolve the central conflict.
Act III: The Resolution
- Falling Action: Describe the immediate aftermath of the climax. Show the dust settling.
- The Resolution: What is the new normal? Show, don't just tell, how the protagonist has changed. Did they get what they wanted or what they needed? End with a powerful, resonant final image or thought that connects back to the central theme.

Part 4: Writing Style & Execution
- Point of View: Write in ${pointOfView}, staying close to the protagonist's perspective, thoughts, and feelings.
- Show, Don't Tell: Instead of saying "she was sad," describe her "shoulders slumping and the single tear that traced a path through the dust on her cheek."
- Dialogue: Ensure dialogue is purposeful. It should reveal character, advance the plot, or build tension. Avoid simple exposition.
- Pacing: Vary the sentence and paragraph length. Use short, punchy sentences for action and longer, more descriptive sentences for moments of reflection.`;

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            return response.text;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }
    throw new Error(getFriendlyErrorMessage(lastError));
};

export const generateScreenplay = async (
    storyPrompt: string
): Promise<{ pitch: string; screenplay: string }> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    const trimmedPrompt = storyPrompt?.trim();
    if (!trimmedPrompt) {
        throw new Error("Please provide a story prompt.");
    }

    const prompt = `You are a viral screenplay writer. Your task is to take a story prompt and turn it into two things:
1. A short, punchy director's pitch that captures the essence of the story.
2. The first scene of the screenplay, written in standard screenplay format.

Story Prompt: "${trimmedPrompt}"

Return the result as a single JSON object with two keys: "pitch" and "screenplay".`;

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            pitch: { type: Type.STRING },
                            screenplay: { type: Type.STRING },
                        },
                        required: ['pitch', 'screenplay'],
                    },
                },
            });

            const text = response.text;
            if (!text) {
                throw new Error('The model returned an empty response.');
            }

            let parsed: { pitch?: unknown; screenplay?: unknown };
            try {
                parsed = JSON.parse(text);
            } catch (parseError) {
                throw new Error('The model returned an invalid format for the screenplay.');
            }

            if (typeof parsed.pitch !== 'string' || typeof parsed.screenplay !== 'string') {
                throw new Error('The model returned an invalid format for the screenplay.');
            }

            return { pitch: parsed.pitch, screenplay: parsed.screenplay };
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};

export const expandStoryFromPremise = async (
    premise: string,
    length: 'short' | 'medium' = 'short',
    genre?: string
): Promise<string> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    const trimmedPremise = premise?.trim();
    if (!trimmedPremise) {
        throw new Error('Please provide a story premise.');
    }

    const wordCounts = { short: '400-600', medium: '800-1200' };
    const wordTarget = wordCounts[length];

    const genreInstruction = genre && genre !== 'any' && genre !== ''
        ? `Genre: ${genre}. Follow ${genre} conventions and tropes.`
        : '';

    const fullPrompt = `You are a skilled storyteller. Expand this premise into a complete short story with:

PREMISE: "${trimmedPremise}"

REQUIREMENTS:
- Length: ${wordTarget} words
- Structure: Clear beginning, middle, and end (3-act structure)
- Characters: 2-4 well-developed characters with distinct personalities
- Setting: Vivid, immersive world-building
- Conflict: Compelling central conflict with satisfying resolution
- Dialogue: Natural, character-revealing conversations
- Pacing: Engaging flow from setup through climax to resolution
${genreInstruction}

Write the story in prose format. Focus on showing rather than telling. Create memorable characters the reader will care about.`;

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            return response.text;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};

export const generateTextFromPrompt = async (
    prompt: string
): Promise<string> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};

export const generateCharactersFromStory = async (
    storyPrompt: string,
): Promise<Array<{ name: string; description: string }>> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    const trimmedPrompt = storyPrompt?.trim();
    if (!trimmedPrompt) {
        throw new Error('Please provide a story prompt.');
    }

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: {
                    type: Type.STRING,
                    description: "The character's name.",
                },
                description: {
                    type: Type.STRING,
                    description: 'A detailed physical and personality description for the character, suitable for generating a character sheet image.',
                },
            },
            required: ['name', 'description'],
        },
    };

    const fullPrompt = `Based on the following story, identify or create the main characters that appear in it. Provide a name and a detailed description for each character.\nStory: "${trimmedPrompt}"`;

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema,
                },
            });

            const rawText = response.text;
            if (!rawText) {
                throw new Error('The API returned an empty response.');
            }

            const parsed = JSON.parse(rawText);
            if (!Array.isArray(parsed)) {
                throw new Error('The API returned an unexpected format.');
            }

            const sanitized = parsed
                .filter((item: any) => item && typeof item.name === 'string' && typeof item.description === 'string')
                .map((item: any) => ({
                    name: item.name.trim(),
                    description: item.description.trim(),
                }));

            if (sanitized.length === 0) {
                throw new Error('No characters were returned. Please try rephrasing your story.');
            }

            return sanitized;
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};

export const generateCharacterSheet = async (
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

            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;

        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};

export const generateImages = async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: string
): Promise<string[]> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
                },
            });

            return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);

        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};


const VIDEO_GENERATION_MESSAGES = [
    "Warming up the cinematic engine...",
    "Scripting the first scene...",
    "Casting digital actors...",
    "Setting up virtual cameras...",
    "Rolling action...",
    "Generating keyframes...",
    "Applying special effects...",
    "Rendering the sequence...",
    "In the cutting room...",
    "Finalizing audio mix...",
    "Adding color grading...",
    "Almost there, preparing for premiere..."
];

export const generateVideoFromPrompt = async (
  prompt: string,
  inputImage: string | undefined,
  model: string,
  onProgress: (message: string) => void
): Promise<string> => {
    if (!ai || !API_KEY) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }
    
    try {
        onProgress("Sending generation request...");
        
        const imageParam = inputImage ? (() => {
            const [header, base64Data] = inputImage.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1];
            if (!mimeType || !base64Data) {
                throw new Error('Invalid data URL format for image.');
            }
            return { imageBytes: base64Data, mimeType };
        })() : undefined;
        
        let operation = await ai.models.generateVideos({
            model: model,
            prompt: prompt,
            ...(imageParam && { image: imageParam }),
            config: {
                numberOfVideos: 1
            }
        });

        let messageIndex = 0;
        const totalMessages = VIDEO_GENERATION_MESSAGES.length;

        while (!operation.done) {
            onProgress(VIDEO_GENERATION_MESSAGES[messageIndex % totalMessages]);
            messageIndex++;
            await sleep(10000); // Poll every 10 seconds
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation finished, but no video was returned. This may be due to safety filters or an issue with the prompt.');
        }

        onProgress("Downloading generated video...");

        // The API key is required to download the video
        const videoResponse = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        
        // Convert Blob to data URL to display in the app
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(videoBlob);
        });

    } catch (error) {
        throw new Error(getFriendlyErrorMessage(error));
    }
};

export const editImageWithPrompt = async (
    base64Image: string,
    prompt: string
): Promise<string> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }
    
    const imagePart = dataUrlToPart(base64Image);
    const textPart = { text: prompt };
    
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("No image was generated. The model may have refused the prompt.");
        
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }
    
    throw new Error(getFriendlyErrorMessage(lastError));
};

export const mixImagesWithPrompt = async (
    base64Images: string[],
    prompt: string
): Promise<string> => {
    if (!ai) {
        throw new Error("API Key is not configured. Please add your key to the `env.js` file in the project root.");
    }

    if (base64Images.length === 0) {
        throw new Error("At least one input image is required for mixing.");
    }

    const imageParts = base64Images.map(dataUrlToPart);
    const textPart = { text: prompt };
    const allParts = [...imageParts, textPart];

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts: allParts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                }
            }
            throw new Error("No image was generated. The model may have refused the prompt.");

        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt < MAX_RETRIES) {
                await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }
    }

    throw new Error(getFriendlyErrorMessage(lastError));
};
