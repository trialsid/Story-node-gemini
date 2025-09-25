import { NodeData, Connection, NodeType } from '../types';

export interface Template {
    name: string;
    description: string;
    nodes: NodeData[];
    connections: Connection[];
}

export const templates: { [key: string]: Template } = {
    characterConcept: {
        name: 'Character Concept Sheet',
        description: 'Generate a character and then edit it.',
        nodes: [
            {
                id: 'char_gen_1',
                type: NodeType.CharacterGenerator,
                position: { x: 50, y: 100 },
                data: {
                    characterDescription: 'A cat astronaut on Mars, wearing a detailed high-resolution spacesuit',
                    style: 'Studio Portrait Photo',
                    layout: '4-panel grid',
                    aspectRatio: '1:1',
                },
            },
            {
                id: 'img_edit_1',
                type: NodeType.ImageEditor,
                position: { x: 400, y: 150 },
                data: { editDescription: 'Add a small alien friend on his shoulder' },
            },
        ],
        connections: [
            {
                id: 'conn_char_edit_1',
                fromNodeId: 'char_gen_1',
                fromHandleId: 'image_output',
                toNodeId: 'img_edit_1',
                toHandleId: 'image_input',
            }
        ],
    },
    quickVideo: {
        name: 'Quick Video Animation',
        description: 'Upload an image and animate it with a prompt.',
        nodes: [
            {
                id: 'img_node_1',
                type: NodeType.Image,
                position: { x: 50, y: 100 },
                data: {},
            },
            {
                id: 'vid_gen_1',
                type: NodeType.VideoGenerator,
                position: { x: 400, y: 100 },
                data: {
                    editDescription: 'A cinematic zoom in, with dust particles floating in the air',
                    videoModel: 'veo-3.0-fast-generate-001',
                },
            }
        ],
        connections: [
            {
                id: 'conn_img_vid_1',
                fromNodeId: 'img_node_1',
                fromHandleId: 'image_output',
                toNodeId: 'vid_gen_1',
                toHandleId: 'image_input',
            }
        ],
    },
    textToVideo: {
        name: 'Text-to-Video Story',
        description: 'Write a prompt to generate a video directly.',
        nodes: [
            {
                id: 'text_node_1',
                type: NodeType.Text,
                position: { x: 50, y: 100 },
                data: {
                    text: 'A majestic eagle soaring over snow-capped mountains at sunrise',
                },
            },
            {
                id: 'vid_gen_2',
                type: NodeType.VideoGenerator,
                position: { x: 400, y: 50 },
                data: { videoModel: 'veo-3.0-fast-generate-001' },
            }
        ],
        connections: [
            {
                id: 'conn_text_vid_1',
                fromNodeId: 'text_node_1',
                fromHandleId: 'text_output',
                toNodeId: 'vid_gen_2',
                toHandleId: 'prompt_input',
            }
        ],
    }
};