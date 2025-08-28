import React, { useState, useCallback, useRef, useMemo } from 'react';
import { NodeData, ConnectionData, NodeType } from './types';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ImageModal from './components/ImageModal';
import { generateImageFromPrompt } from './services/geminiService';

const NODE_WIDTH = 256; // 64 * 4
const NODE_HEIGHT_CHARACTER_SHEET = 340; 
const NODE_HEIGHT_IMAGE = 340; // 85 * 4

const initialTextNodeId = 'initial_character_node_1';
const initialImageNodeId = 'initial_image_node_1';

const initialNodes: NodeData[] = [
  {
    id: initialTextNodeId,
    type: NodeType.CharacterSheet,
    position: { x: 100, y: 120 },
    data: {
      characterDescription: 'A cat astronaut on Mars, wearing a detailed high-resolution spacesuit',
      style: 'Studio Portrait Photo',
      layout: '4-panel grid',
      aspectRatio: '1:1',
    },
  },
  {
    id: initialImageNodeId,
    type: NodeType.ImageGenerator,
    position: { x: 450, y: 120 },
    data: {},
  },
];

const initialConnections: ConnectionData[] = [
    {
        id: 'initial_connection_1',
        fromNodeId: initialTextNodeId,
        fromHandleId: 'output',
        toNodeId: initialImageNodeId,
        toHandleId: 'input',
    }
]

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [connections, setConnections] = useState<ConnectionData[]>(initialConnections);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const [newConnection, setNewConnection] = useState<{ fromNodeId: string; fromHandleId: string; toPosition: { x: number; y: number } } | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = useCallback((type: NodeType) => {
    let data: NodeData['data'] = {};
    if (type === NodeType.CharacterSheet) {
      data = {
        characterDescription: 'A brave knight with a scar over his left eye',
        style: 'Studio Portrait Photo',
        layout: 'T-pose reference sheet',
        aspectRatio: '1:1',
      };
    }

    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random()}`,
      type,
      position: { x: 100, y: 100 },
      data,
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
    if (newConnection) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setNewConnection(prev => prev ? ({ ...prev, toPosition: { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top } }) : null);
    }
  }, [draggingNodeId, dragOffset, newConnection]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setNewConnection(null);
  }, []);

  const handleStartConnection = useCallback((fromNodeId: string, fromHandleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(canvasRef.current){
        const canvasRect = canvasRef.current.getBoundingClientRect();
        setNewConnection({ fromNodeId, fromHandleId, toPosition: { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top } });
    }
  }, []);

  const handleCompleteConnection = useCallback((toNodeId: string, toHandleId: string) => {
    if (newConnection) {
        // Prevent connecting to self
        if (newConnection.fromNodeId === toNodeId) {
            setNewConnection(null);
            return;
        }
        // Prevent duplicate connections to the same input handle
        if (connections.some(c => c.toNodeId === toNodeId && c.toHandleId === toHandleId)) {
            setNewConnection(null);
            return;
        }

      const newConn: ConnectionData = {
        id: `conn_${Date.now()}_${Math.random()}`,
        fromNodeId: newConnection.fromNodeId,
        fromHandleId: newConnection.fromHandleId,
        toNodeId,
        toHandleId,
      };
      setConnections((prev) => [...prev, newConn]);
    }
    setNewConnection(null);
  }, [newConnection, connections]);

  const handleGenerateImage = useCallback(async (nodeId: string) => {
    const connection = connections.find(c => c.toNodeId === nodeId);
    if (!connection) {
      updateNodeData(nodeId, { error: 'Input not connected' });
      return;
    }
    const sourceNode = nodes.find(n => n.id === connection.fromNodeId);
    if (!sourceNode || !sourceNode.data.characterDescription) {
      updateNodeData(nodeId, { error: 'Source node has no description' });
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
  }, [connections, nodes, updateNodeData]);
  
  const handleTriggerGenerationFromNode = useCallback((sourceNodeId: string) => {
    const connectedImageNodes = connections
      .filter(c => c.fromNodeId === sourceNodeId)
      .map(c => nodes.find(n => n.id === c.toNodeId))
      .filter(n => n && n.type === NodeType.ImageGenerator) as NodeData[];

    connectedImageNodes.forEach(node => {
      if (node) {
        handleGenerateImage(node.id);
      }
    });
  }, [connections, nodes, handleGenerateImage]);

  const handleImageClick = useCallback((imageUrl: string) => {
    setModalImageUrl(imageUrl);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalImageUrl(null);
  }, []);

  const nodeHelpers = useMemo(() => ({
    getNodePosition: (nodeId: string) => nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 },
    isInputConnected: (nodeId: string, handleId: string) => connections.some(c => c.toNodeId === nodeId && c.toHandleId === handleId),
  }), [nodes, connections]);

  return (
    <div className="w-screen h-screen bg-gray-900 text-white overflow-hidden flex flex-col font-sans">
      <Toolbar onAddNode={addNode} />
      <Canvas
        ref={canvasRef}
        nodes={nodes}
        connections={connections}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onNodeDragStart={handleNodeDragStart}
        onStartConnection={handleStartConnection}
        onCompleteConnection={handleCompleteConnection}
        onUpdateNodeData={updateNodeData}
        onGenerateImage={handleGenerateImage}
        onImageClick={handleImageClick}
        onTriggerGenerationFromNode={handleTriggerGenerationFromNode}
        newConnection={newConnection}
        nodeHelpers={nodeHelpers}
        nodeDimensions={{NODE_WIDTH, NODE_HEIGHT_CHARACTER_SHEET, NODE_HEIGHT_IMAGE}}
      />
      <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />
    </div>
  );
};

export default App;