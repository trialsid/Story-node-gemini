import { NodeData, Connection, NodeType } from '../types';

export interface Template {
    name: string;
    description: string;
    nodes: NodeData[];
    connections: Connection[];
}

export const templates: { [key: string]: Template } = {
    storyCharacterPipeline: {
        name: 'Story Character Ensemble',
        description: 'Turn a logline into character bios and ready-to-render sheets.',
        nodes: [
            {
                id: 'story_premise_1',
                type: NodeType.Text,
                position: { x: 40, y: 140 },
                data: {
                    text: 'In a floating city above a raging storm, an exiled pilot returns to stop her former squadmate from triggering a world-ending device.',
                },
            },
            {
                id: 'story_characters_1',
                type: NodeType.StoryCharacterCreator,
                position: { x: 360, y: 80 },
                data: {
                    storyPrompt: 'In a floating city above a raging storm, an exiled pilot returns to stop her former squadmate from triggering a world-ending device.',
                    characters: [
                        {
                            name: 'Captain Lyra Hale',
                            description: 'A fearless stormrider with silver hair and a battle-worn flight jacket, anchored by a compass pendant that glows when danger nears.',
                        },
                        {
                            name: 'Commander Ivo Draeg',
                            description: 'Once a disciplined tactician, now an obsessed visionary with ember tattoos creeping up his arms and a prototype lightning gauntlet.',
                        },
                    ],
                },
            },
            {
                id: 'character_sheet_hero',
                type: NodeType.CharacterGenerator,
                position: { x: 680, y: 40 },
                data: {
                    style: 'Cinematic Film Still',
                    layout: '4-panel grid',
                    aspectRatio: '3:4',
                },
            },
            {
                id: 'character_sheet_rival',
                type: NodeType.CharacterGenerator,
                position: { x: 680, y: 260 },
                data: {
                    style: 'Fashion Magazine Shot',
                    layout: '6-panel grid',
                    aspectRatio: '3:4',
                },
            },
        ],
        connections: [
            {
                id: 'conn_story_prompt_to_creator',
                fromNodeId: 'story_premise_1',
                fromHandleId: 'text_output',
                toNodeId: 'story_characters_1',
                toHandleId: 'prompt_input',
            },
            {
                id: 'conn_character_1_to_sheet',
                fromNodeId: 'story_characters_1',
                fromHandleId: 'character_output_1',
                toNodeId: 'character_sheet_hero',
                toHandleId: 'description_input',
            },
            {
                id: 'conn_character_2_to_sheet',
                fromNodeId: 'story_characters_1',
                fromHandleId: 'character_output_2',
                toNodeId: 'character_sheet_rival',
                toHandleId: 'description_input',
            },
        ],
    },
    cinematicStoryboard: {
        name: 'Cinematic Storyboard',
        description: 'Outline trailer beats and visualize key frames while prepping motion.',
        nodes: [
            {
                id: 'story_outline_writer',
                type: NodeType.TextGenerator,
                position: { x: 40, y: 100 },
                data: {
                    prompt: 'Outline three dramatic shots for a neon-soaked heist trailer set in the rain.',
                    text: 'Shot 1: A gloved hand unlocks a floating vault during a lightning strike.\nShot 2: The crew sprints across glass terraces as drones ignite red sirens.\nShot 3: The mastermind leaps onto a fleeing train, silhouetted by neon thunder.',
                },
            },
            {
                id: 'story_frame_generator',
                type: NodeType.ImageGenerator,
                position: { x: 400, y: 40 },
                data: {
                    numberOfImages: 3,
                    aspectRatio: '16:9',
                },
            },
            {
                id: 'story_video_concept',
                type: NodeType.VideoGenerator,
                position: { x: 400, y: 240 },
                data: {
                    videoModel: 'veo-3.1-generate-preview',
                    editDescription: 'A sweeping camera move through neon rain as the crew escapes across suspended railways.',
                },
            },
        ],
        connections: [
            {
                id: 'conn_outline_to_images',
                fromNodeId: 'story_outline_writer',
                fromHandleId: 'text_output',
                toNodeId: 'story_frame_generator',
                toHandleId: 'prompt_input',
            },
            {
                id: 'conn_outline_to_video',
                fromNodeId: 'story_outline_writer',
                fromHandleId: 'text_output',
                toNodeId: 'story_video_concept',
                toHandleId: 'prompt_input',
            },
            {
                id: 'conn_frame_to_video',
                fromNodeId: 'story_frame_generator',
                fromHandleId: 'image_output_1',
                toNodeId: 'story_video_concept',
                toHandleId: 'image_input',
            },
        ],
    },
    worldMoodboard: {
        name: 'World Moodboard Mixer',
        description: 'Blend stylistic references into a unified look-and-feel for your setting.',
        nodes: [
            {
                id: 'world_prompt_text',
                type: NodeType.Text,
                position: { x: 40, y: 120 },
                data: {
                    text: 'Moodboard the floating city of Aerie: bioluminescent markets, storm-lit skies, and wind-carved architecture.',
                },
            },
            {
                id: 'world_reference_one',
                type: NodeType.ImageGenerator,
                position: { x: 360, y: 20 },
                data: {
                    numberOfImages: 1,
                    aspectRatio: '3:2',
                },
            },
            {
                id: 'world_reference_two',
                type: NodeType.ImageGenerator,
                position: { x: 360, y: 220 },
                data: {
                    numberOfImages: 1,
                    aspectRatio: '3:2',
                },
            },
            {
                id: 'world_mixer',
                type: NodeType.ImageMixer,
                position: { x: 680, y: 120 },
                data: {
                    editDescription: 'Fuse the references into a cohesive moodboard with glowing signage, rain trails, and soaring silhouettes.',
                },
            },
        ],
        connections: [
            {
                id: 'conn_world_prompt_to_reference_one',
                fromNodeId: 'world_prompt_text',
                fromHandleId: 'text_output',
                toNodeId: 'world_reference_one',
                toHandleId: 'prompt_input',
            },
            {
                id: 'conn_world_prompt_to_reference_two',
                fromNodeId: 'world_prompt_text',
                fromHandleId: 'text_output',
                toNodeId: 'world_reference_two',
                toHandleId: 'prompt_input',
            },
            {
                id: 'conn_reference_one_to_mixer',
                fromNodeId: 'world_reference_one',
                fromHandleId: 'image_output_1',
                toNodeId: 'world_mixer',
                toHandleId: 'image_input',
            },
            {
                id: 'conn_reference_two_to_mixer',
                fromNodeId: 'world_reference_two',
                fromHandleId: 'image_output_1',
                toNodeId: 'world_mixer',
                toHandleId: 'image_input',
            },
        ],
    },
};
