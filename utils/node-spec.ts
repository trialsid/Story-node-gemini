import { NodeType, HandleType } from '../types';

export interface NodeHandleSpec {
  id: string;
  type: HandleType;
  label: string;
}

export interface NodeSpec {
  inputs: NodeHandleSpec[];
  outputs: NodeHandleSpec[];
}

export const NODE_SPEC: { [key in NodeType]: NodeSpec } = {
  [NodeType.Text]: {
    inputs: [],
    outputs: [{ id: 'text_output', type: HandleType.Text, label: 'Text' }],
  },
  [NodeType.Image]: {
    inputs: [],
    outputs: [{ id: 'image_output', type: HandleType.Image, label: 'Image' }],
  },
  [NodeType.CharacterGenerator]: {
    inputs: [{ id: 'description_input', type: HandleType.Text, label: 'Character Description' }],
    outputs: [{ id: 'image_output', type: HandleType.Image, label: 'Output Image' }],
  },
  [NodeType.ImageEditor]: {
    inputs: [{ id: 'image_input', type: HandleType.Image, label: 'Input Image' }],
    outputs: [{ id: 'image_output', type: HandleType.Image, label: 'Output Image' }],
  },
  [NodeType.VideoGenerator]: {
    inputs: [
      { id: 'image_input', type: HandleType.Image, label: 'Input Image (Optional)' },
      { id: 'prompt_input', type: HandleType.Text, label: 'Video Prompt' },
    ],
    outputs: [], // No video output handle yet
  },
};

// Compatibility check
export const areHandlesCompatible = (fromType: HandleType, toType: HandleType): boolean => {
  return fromType === toType;
};
