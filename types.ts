import { GoogleGenAI } from "@google/genai";

export enum NodeType {
  CharacterGenerator = 'CHARACTER_GENERATOR',
  Text = 'TEXT_NODE',
  Image = 'IMAGE_NODE',
  ImageEditor = 'IMAGE_EDITOR',
  VideoGenerator = 'VIDEO_GENERATOR',
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
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
    inputHandleYOffset?: number;
    outputHandleYOffset?: number;
    isMinimized?: boolean;
    minimizedHeight?: number;

    // For Text Node
    text?: string;
    
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
  };
}

export interface CanvasState {
  nodes: NodeData[];
  connections: Connection[];
}
