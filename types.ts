export enum NodeType {
  CharacterSheet = 'CHARACTER_SHEET',
  ImageGenerator = 'IMAGE_GENERATOR',
}

export interface NodeData {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    // For CharacterSheet node
    characterDescription?: string;
    style?: string;
    layout?: string;
    
    // For both nodes
    aspectRatio?: string;
    
    // For ImageGenerator node
    imageUrl?: string;
    isLoading?: boolean;
    error?: string;
  };
}

export interface ConnectionData {
  id: string;
  fromNodeId: string;
  fromHandleId: string;
  toNodeId: string;
  toHandleId: string;
}