import { NodeData, NodeType, StoryCharacter, HandleType } from '../types';
import { NODE_SPEC, NodeHandleSpec } from './node-spec';

export const MINIMIZED_HEADER_HEIGHT = 40;
export const DEFAULT_MINIMIZED_PREVIEW_HEIGHT = 64;
export const SLICE_HEIGHT_PX = 32;

const buildStoryCharacterHandles = (characters: StoryCharacter[] = []): NodeHandleSpec[] => {
  return characters.map((character, index) => ({
    id: `character_output_${index + 1}`,
    type: HandleType.Text,
    label: character.name || `Character ${index + 1}`,
  }));
};

export const getHandlesForSide = (node: NodeData, side: 'input' | 'output'): NodeHandleSpec[] => {
  const spec = NODE_SPEC[node.type];
  const specHandles = side === 'input' ? spec.inputs : spec.outputs;

  if (node.type === NodeType.ImageGenerator && side === 'output') {
    const visibleCount = Math.max(1, node.data.numberOfImages || 1);
    return specHandles.slice(0, visibleCount);
  }

  if (node.type === NodeType.StoryCharacterCreator && side === 'output') {
    const characters = buildStoryCharacterHandles(node.data.characters);
    return characters.length > 0 ? characters : [];
  }

  return specHandles;
};

export const getHandleSpec = (node: NodeData, handleId: string, side: 'input' | 'output'): NodeHandleSpec | undefined => {
  return getHandlesForSide(node, side).find(handle => handle.id === handleId);
};

export const getMinimizedHandleY = (node: NodeData, handleId: string, side: 'input' | 'output'): number => {
  const minimizedOffsets = node.data.minimizedHandleYOffsets;
  if (side === 'output' && minimizedOffsets && minimizedOffsets[handleId] !== undefined) {
    return minimizedOffsets[handleId];
  }

  const visibleHandles = getHandlesForSide(node, side);
  const totalVisibleHandles = visibleHandles.length;
  const currentIndex = visibleHandles.findIndex(handle => handle.id === handleId);

  if (node.type === NodeType.ImageGenerator && side === 'output') {
    const generatedImages = (node.data.imageUrls || []).filter(Boolean).length;
    if (generatedImages > 1 && generatedImages >= totalVisibleHandles && currentIndex !== -1) {
      return MINIMIZED_HEADER_HEIGHT + (SLICE_HEIGHT_PX * currentIndex) + (SLICE_HEIGHT_PX / 2);
    }
  }

  const previewHeight = node.data.minimizedHeight || DEFAULT_MINIMIZED_PREVIEW_HEIGHT;

  if (currentIndex === -1 || totalVisibleHandles === 0) {
    return MINIMIZED_HEADER_HEIGHT + (previewHeight / 2);
  }

  return MINIMIZED_HEADER_HEIGHT + (previewHeight * (currentIndex + 1)) / (totalVisibleHandles + 1);
};

export const getVisibleHandleById = (node: NodeData, handleId: string, side: 'input' | 'output'): NodeHandleSpec | undefined => {
  return getHandleSpec(node, handleId, side);
};
