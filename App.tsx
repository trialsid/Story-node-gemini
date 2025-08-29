import React, { useState, useCallback, useRef } from 'react';
import { NodeData, NodeType } from './types';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ImageModal from './components/ImageModal';
import { generateImageFromPrompt } from './services/geminiService';

const NODE_WIDTH = 256; 
const NODE_HEIGHT = 580;

const initialNodes: NodeData[] = [
  {
    id: 'initial_node_1',
    type: NodeType.ImageGenerator,
    position: { x: 100, y: 50 },
    data: {
      characterDescription: 'A cat astronaut on Mars, wearing a detailed high-resolution spacesuit',
      style: 'Studio Portrait Photo',
      layout: '4-panel grid',
      aspectRatio: '1:1',
    },
  },
];

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = useCallback(() => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random()}`,
      type: NodeType.ImageGenerator,
      position: { x: 150, y: 150 },
      data: {
        characterDescription: 'A brave knight with a scar over his left eye',
        style: 'Studio Portrait Photo',
        layout: 'T-pose reference sheet',
        aspectRatio: '1:1',
      },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData['data']>) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  }, []);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const offsetX = e.clientX - canvasRect.left - node.position.x;
        const offsetY = e.clientY - canvasRect.top - node.position.y;
        setDragOffset({ x: offsetX, y: offsetY });
    }
  }, [nodes]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - canvasRect.left - dragOffset.x;
      const y = e.clientY - canvasRect.top - dragOffset.y;
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggingNodeId ? { ...node, position: { x, y } } : node
        )
      );
    }
  }, [draggingNodeId, dragOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);

  const handleGenerateImage = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || !sourceNode.data.characterDescription) {
      updateNodeData(nodeId, { error: 'Character description cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
      const { characterDescription, style, layout, aspectRatio } = sourceNode.data;
      const imageUrl = await generateImageFromPrompt(
        characterDescription!, 
        style!, 
        layout!,
        aspectRatio!
      );
      updateNodeData(nodeId, { imageUrl, isLoading: false });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);
  
  const handleImageClick = useCallback((imageUrl: string) => {
    setModalImageUrl(imageUrl);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalImageUrl(null);
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-900 text-white overflow-hidden flex flex-col font-sans">
      <Toolbar onAddNode={addNode} />
      <Canvas
        ref={canvasRef}
        nodes={nodes}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onNodeDragStart={handleNodeDragStart}
        onUpdateNodeData={updateNodeData}
        onGenerateImage={handleGenerateImage}
        onImageClick={handleImageClick}
        nodeDimensions={{NODE_WIDTH, NODE_HEIGHT}}
      />
      <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />
    </div>
  );
};

export default App;
