export enum NodeType {
  CharacterGenerator = 'CHARACTER_GENERATOR',
  Text = 'TEXT_NODE',
  ImageEditor = 'IMAGE_EDITOR',
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface NodeData {
  id: string;
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

    // For Text Node
    text?: string;
    
    // For Image Editor
    editDescription?: string;
    inputImageUrl?: string;
    // `imageUrl` from CharacterGenerator is used for the output image
  };
}