export enum NodeType {
  CharacterGenerator = 'CHARACTER_GENERATOR',
  ImageGenerator = 'IMAGE_GENERATOR',
  Text = 'TEXT_NODE',
  Image = 'IMAGE_NODE',
  ImageEditor = 'IMAGE_EDITOR',
  VideoGenerator = 'VIDEO_GENERATOR',
  VideoInterpolator = 'VIDEO_INTERPOLATOR',
  TextGenerator = 'TEXT_GENERATOR_NODE',
  ImageMixer = 'IMAGE_MIXER',
  StoryCharacterCreator = 'STORY_CHARACTER_CREATOR_NODE',
  CharacterPortfolio = 'STORY_CHARACTER_SHEET_NODE',
  StoryExpander = 'STORY_EXPANDER_NODE',
  ShortStoryWriter = 'SHORT_STORY_WRITER_NODE',
  ScreenplayWriter = 'SCREENPLAY_WRITER_NODE',
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

export interface StoryCharacter {
  name: string;
  description: string;
}

export interface CharacterPortfolioItem {
  name: string;
  description: string;
  imageUrl?: string;
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
    minimizedHandleYOffsets?: { [handleId: string]: number };

    // For Text Node
    text?: string;
    
    // For TextGenerator Node
    prompt?: string;
    // `text` is used for the output
    
    // For Image Editor & Image Mixer
    editDescription?: string;
    inputImageUrl?: string;
    // `imageUrl` from CharacterGenerator is used for the output image
    
    // For Video Generator
    videoModel?: string;
    videoResolution?: '720p' | '1080p';
    videoDuration?: '4' | '6' | '8';
    videoAspectRatio?: '16:9' | '9:16' | '1:1';
    videoUrl?: string;
    generationProgressMessage?: string;
    generationStartTimeMs?: number;
    generationElapsedMs?: number;
    // `inputImageUrl` is shared
    // `editDescription` is used for the video prompt

    // For Video Interpolator
    startImageUrl?: string;
    endImageUrl?: string;
    // `videoUrl`, `videoResolution`, `videoAspectRatio`, `generationProgressMessage`,
    // `generationStartTimeMs`, `generationElapsedMs` are shared with Video Generator
    // `editDescription` is used for the interpolation prompt (optional)
    // videoDuration is fixed to '8' for interpolation

    // For Image Node
    // `imageUrl` is used for the uploaded image

    // For Image Generator
    numberOfImages?: number;
    imageUrls?: string[];
    // `prompt` is shared
    // `aspectRatio` is shared

    // For Story Character Creator
    storyPrompt?: string;
    characters?: StoryCharacter[];

    // For Character Portfolio
    portfolio?: CharacterPortfolioItem[];

    // For Story Expander
    premise?: string;
    length?: 'short' | 'medium';
    genre?: string;

    // For Short Story Writer
    storyPremise?: string;
    pointOfView?: string;
    fullStory?: string;

    // For Screenplay Writer
    screenplayMode?: 'default' | 'qt';
    pitch?: string;
    screenplayText?: string;
  };
}

export interface CanvasState {
  nodes: NodeData[];
  connections: Connection[];
}

export type GalleryMediaType = 'image' | 'video';

export type GalleryStatus = 'loading' | 'ready' | 'error';

export interface GalleryItem {
  id: string;
  type: GalleryMediaType;
  fileName: string;
  createdAt: number;
  prompt?: string;
  nodeType?: NodeType;
  nodeId?: string;
  mimeType: string;
  url: string;
  projectId?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectState {
  canvas: CanvasState;
}

export interface ProjectDetail {
  metadata: ProjectMetadata;
  state: ProjectState | null;
}
