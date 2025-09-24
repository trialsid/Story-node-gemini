import { GoogleGenAI } from "@google/genai";

export enum NodeType {
  CharacterGenerator = 'CHARACTER_GENERATOR',
  ImageGenerator = 'IMAGE_GENERATOR',
  Text = 'TEXT_NODE',
  Image = 'IMAGE_NODE',
  ImageEditor = 'IMAGE_EDITOR',
  VideoGenerator = 'VIDEO_GENERATOR',
  GeminiText = 'GEMINI_TEXT_NODE',
}

export enum HandleType {
  Text = 'TEXT',
  Image = 'IMAGE',
  Video = 'VIDEO',
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromHandleId: string;
  toNodeId: string;
  toHandleId: string;
}

export interface NodeData {
  id:string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    // For CharacterGenerator
    characterDescription?: string;
    style?: string;
    layout?: string;
    aspectRatio?: string;
    imageUrl?: string;
    isLoading?: boolean;
    error?: string;
    isMinimized?: boolean;
    minimizedHeight?: number;
    handleYOffsets?: { [handleId: string]: number };

    // For Text Node
    text?: string;
    
    // For Gemini Text Node
    prompt?: string;
    // `text` is used for the output
    
    // For Image Editor
    editDescription?: string;
    inputImageUrl?: string;
    // `imageUrl` from CharacterGenerator is used for the output image
    
    // For Video Generator
    videoModel?: string;
    videoUrl?: string;
    generationProgressMessage?: string;
    // `inputImageUrl` is shared
    // `editDescription` is used for the video prompt
    
    // For Image Node
    // `imageUrl` is used for the uploaded image

    // For Image Generator
    numberOfImages?: number;
    imageUrls?: string[];
    // `prompt` is shared
    // `aspectRatio` is shared
  };
}

export interface CanvasState {
  nodes: NodeData[];
  connections: Connection[];
}