export enum NodeType {
  ImageGenerator = 'IMAGE_GENERATOR',
}

export interface NodeData {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    characterDescription?: string;
    style?: string;
    layout?: string;
    aspectRatio?: string;
    imageUrl?: string;
    isLoading?: boolean;
    error?: string;
  };
}
