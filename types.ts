export enum NodeType {
  CharacterGenerator = 'CHARACTER_GENERATOR',
  ImageGenerator = 'IMAGE_GENERATOR',
  Text = 'TEXT_NODE',
  Image = 'IMAGE_NODE',
  ImageEditor = 'IMAGE_EDITOR',
  VideoGenerator = 'VIDEO_GENERATOR',
  TextGenerator = 'TEXT_GENERATOR_NODE',
  ImageMixer = 'IMAGE_MIXER',
  StoryCharacterCreator = 'STORY_CHARACTER_CREATOR_NODE',
  StoryExpander = 'STORY_EXPANDER_NODE',
  ShortStoryWriter = 'SHORT_STORY_WRITER_NODE',
  ScreenplayWriter = 'SCREENPLAY_WRITER_NODE',
  WorldBible = 'WORLD_BIBLE_NODE',
  SceneBeatPlanner = 'SCENE_BEAT_PLANNER_NODE',
  ShotStoryboard = 'SHOT_STORYBOARD_NODE',
  VideoKeyframeInitializer = 'VIDEO_KEYFRAME_INITIALIZER_NODE',
  VideoSequencePlanner = 'VIDEO_SEQUENCE_PLANNER_NODE',
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

export interface WorldBibleSections {
  worldSummary: string;
  keyLocations: string;
  factions: string;
  visualMotifs: string;
  continuityRules: string;
}

export interface SceneBeat {
  id: string;
  title: string;
  summary: string;
  setting: string;
  characters: string[];
  goal: string;
  conflict: string;
  visualNotes: string;
  requiredAssets: string[];
}

export interface ShotPrompt {
  id: string;
  title: string;
  description: string;
  framing: string;
  lens: string;
  lighting: string;
  motion: string;
  cameraMovement: string;
  outputPrompt: string;
}

export interface TimelineClipPlan {
  clipNodeId: string;
  clipLabel: string;
  prompt?: string;
  videoUrl?: string;
  durationSeconds?: number;
  transition?: string;
  notes?: string;
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
    videoUrl?: string;
    generationProgressMessage?: string;
    generationStartTimeMs?: number;
    generationElapsedMs?: number;
    // `inputImageUrl` is shared
    // `editDescription` is used for the video prompt

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

    // For Story Expander
    premise?: string;
    length?: 'short' | 'medium';
    genre?: string;

    // For Short Story Writer
    storyPremise?: string;
    pointOfView?: string;
    fullStory?: string;

    // For Screenplay Writer
    pitch?: string;
    screenplayText?: string;

    // For World Bible
    worldPrompt?: string;
    worldSummary?: string;
    keyLocations?: string;
    factionsAndAllies?: string;
    visualMotifs?: string;
    continuityRules?: string;

    // For Scene Beat Planner
    scenePlannerInput?: string;
    structurePreset?: string;
    sceneBeats?: SceneBeat[];
    sceneBeatsText?: string;
    assetChecklistText?: string;

    // For Shot Storyboard
    shotReferenceText?: string;
    shotStyleGuide?: string;
    shotPrompts?: ShotPrompt[];
    shotPromptsText?: string;

    // For Video Keyframe Initializer
    keyframePrompt?: string;
    keyframeSourceImageUrls?: string[];
    keyframeImageUrl?: string;

    // For Video Sequence Planner
    timelineNotes?: string;
    musicCue?: string;
    timelineClips?: TimelineClipPlan[];
    timelineExportText?: string;
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
