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
  [NodeType.ShortStoryWriter]: {
    inputs: [{ id: 'premise_input', type: HandleType.Text, label: 'Story Premise' }],
    outputs: [{ id: 'story_output', type: HandleType.Text, label: 'Full Story' }],
  },
  [NodeType.ScreenplayWriter]: {
    inputs: [{ id: 'prompt_input', type: HandleType.Text, label: 'Story Prompt' }],
    outputs: [
      { id: 'pitch_output', type: HandleType.Text, label: "Director's Pitch" },
      { id: 'screenplay_output', type: HandleType.Text, label: 'Screenplay Text' },
    ],
  },
  [NodeType.WorldBible]: {
    inputs: [{ id: 'world_prompt_input', type: HandleType.Text, label: 'World Prompt' }],
    outputs: [
      { id: 'world_summary_output', type: HandleType.Text, label: 'World Summary' },
      { id: 'key_locations_output', type: HandleType.Text, label: 'Key Locations' },
      { id: 'factions_output', type: HandleType.Text, label: 'Factions & Cast' },
      { id: 'visual_motifs_output', type: HandleType.Text, label: 'Visual Motifs' },
      { id: 'continuity_rules_output', type: HandleType.Text, label: 'Continuity Rules' },
    ],
  },
  [NodeType.SceneBeatPlanner]: {
    inputs: [{ id: 'story_input', type: HandleType.Text, label: 'Story / Premise' }],
    outputs: [
      { id: 'scene_beats_output', type: HandleType.Text, label: 'Scene Beats' },
      { id: 'asset_checklist_output', type: HandleType.Text, label: 'Asset Checklist' },
    ],
  },
  [NodeType.ShotStoryboard]: {
    inputs: [{ id: 'beat_input', type: HandleType.Text, label: 'Scene Beat' }],
    outputs: [
      { id: 'shot_prompts_output', type: HandleType.Text, label: 'Shot Prompts' },
    ],
  },
  [NodeType.VideoKeyframeInitializer]: {
    inputs: [
      { id: 'character_ref_input', type: HandleType.Image, label: 'Character Ref' },
      { id: 'location_ref_input', type: HandleType.Image, label: 'Location Ref' },
      { id: 'continuity_ref_input', type: HandleType.Image, label: 'Continuity Frame' },
      { id: 'prompt_input', type: HandleType.Text, label: 'Keyframe Prompt' },
    ],
    outputs: [{ id: 'keyframe_image_output', type: HandleType.Image, label: 'Keyframe' }],
  },
  [NodeType.VideoSequencePlanner]: {
    inputs: [
      { id: 'clip_input', type: HandleType.Video, label: 'Video Clips' },
      { id: 'notes_input', type: HandleType.Text, label: 'Notes (Optional)' },
    ],
    outputs: [{ id: 'timeline_output', type: HandleType.Text, label: 'Timeline Plan' }],
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
