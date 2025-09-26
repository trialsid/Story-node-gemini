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
  [NodeType.TextGenerator]: {
    inputs: [{ id: 'prompt_input', type: HandleType.Text, label: 'Prompt' }],
    outputs: [{ id: 'text_output', type: HandleType.Text, label: 'Text' }],
  },
  [NodeType.CharacterGenerator]: {
    inputs: [{ id: 'description_input', type: HandleType.Text, label: 'Character Description' }],
    outputs: [{ id: 'image_output', type: HandleType.Image, label: 'Output Image' }],
  },
  [NodeType.ImageGenerator]: {
    inputs: [{ id: 'prompt_input', type: HandleType.Text, label: 'Prompt' }],
    outputs: [
      { id: 'image_output_1', type: HandleType.Image, label: 'Image 1' },
      { id: 'image_output_2', type: HandleType.Image, label: 'Image 2' },
      { id: 'image_output_3', type: HandleType.Image, label: 'Image 3' },
      { id: 'image_output_4', type: HandleType.Image, label: 'Image 4' },
    ],
  },
  [NodeType.ImageEditor]: {
    inputs: [{ id: 'image_input', type: HandleType.Image, label: 'Input Image' }],
    outputs: [{ id: 'image_output', type: HandleType.Image, label: 'Output Image' }],
  },
  [NodeType.ImageMixer]: {
    inputs: [{ id: 'image_input', type: HandleType.Image, label: 'Images' }],
    outputs: [{ id: 'image_output', type: HandleType.Image, label: 'Mixed Image' }],
  },
  [NodeType.StoryCharacterCreator]: {
    inputs: [{ id: 'prompt_input', type: HandleType.Text, label: 'Story Prompt' }],
    outputs: [],
  },
  [NodeType.StoryExpander]: {
    inputs: [{ id: 'premise_input', type: HandleType.Text, label: 'Premise' }],
    outputs: [{ id: 'story_output', type: HandleType.Text, label: 'Story' }],
  },
  [NodeType.VideoGenerator]: {
    inputs: [
      { id: 'image_input', type: HandleType.Image, label: 'Input Image (Optional)' },
      { id: 'prompt_input', type: HandleType.Text, label: 'Video Prompt' },
    ],
    outputs: [{ id: 'video_output', type: HandleType.Video, label: 'Output Video' }],
  },
};

// Compatibility check
export const areHandlesCompatible = (fromType: HandleType, toType: HandleType): boolean => {
  return fromType === toType;
};
