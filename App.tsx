
import React, { useState, useCallback, useRef } from 'react';
import { NodeData, NodeType, Connection } from './types';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import ImageModal from './components/ImageModal';
import { generateImageFromPrompt, editImageWithPrompt } from './services/geminiService';

const NODE_DIMENSIONS = {
  [NodeType.CharacterGenerator]: { width: 256, height: 580 },
  [NodeType.Text]: { width: 256, height: 180 },
  [NodeType.ImageEditor]: { width: 256, height: 650 },
};

const initialNodes: NodeData[] = [
  {
    id: 'initial_node_1',
    type: NodeType.CharacterGenerator,
    position: { x: 400, y: 50 },
    data: {
      characterDescription: 'A cat astronaut on Mars, wearing a detailed high-resolution spacesuit',
      style: 'Studio Portrait Photo',
      layout: '4-panel grid',
      aspectRatio: '1:1',
    },
  },
  {
    id: 'initial_node_2',
    type: NodeType.Text,
    position: { x: 50, y: 150 },
    data: {
      text: 'A majestic lion with a crown of stars, photorealistic, cinematic lighting',
    },
  },
];

interface DragStartInfo {
  startMouseX: number;
  startMouseY: number;
  startNodeX: number;
  startNodeY: number;
}

const App: React.FC = () => {
  const [nodes, setNodes] = useState<NodeData[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartInfo, setDragStartInfo] = useState<DragStartInfo | null>(null);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [tempConnectionStartNodeId, setTempConnectionStartNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // State for canvas transform
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);

  const addNode = useCallback(() => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random()}`,
      type: NodeType.CharacterGenerator,
      position: { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: {
        characterDescription: 'A brave knight with a scar over his left eye',
        style: 'Studio Portrait Photo',
        layout: 'T-pose reference sheet',
        aspectRatio: '1:1',
      },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);

  const addTextNode = useCallback(() => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random()}`,
      type: NodeType.Text,
      position: { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: { text: 'A futuristic cityscape at dusk.' },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);

  const addImageEditorNode = useCallback(() => {
    const newNode: NodeData = {
      id: `node_${Date.now()}_${Math.random()}`,
      type: NodeType.ImageEditor,
      position: { x: (150 - canvasOffset.x) / zoom, y: (150 - canvasOffset.y) / zoom },
      data: { editDescription: 'Add a golden crown' },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, [canvasOffset, zoom]);
  
  const updateNodeData = useCallback((nodeId: string, data: Partial<NodeData['data']>) => {
    setNodes((currentNodes) => {
        let newNodes = [...currentNodes];
        const nodeIndex = newNodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) return currentNodes;
        
        const updatedNode = { ...newNodes[nodeIndex], data: { ...newNodes[nodeIndex].data, ...data } };
        newNodes[nodeIndex] = updatedNode;

        connections.forEach(conn => {
            if (conn.fromNodeId === nodeId) {
                const toNodeIndex = newNodes.findIndex(n => n.id === conn.toNodeId);
                if (toNodeIndex === -1) return;

                const toNode = newNodes[toNodeIndex];
                
                // Propagate text from Text Node to Character Generator
                if (updatedNode.type === NodeType.Text && 'text' in data && toNode.type === NodeType.CharacterGenerator) {
                    newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, characterDescription: data.text } };
                }
                
                // Propagate image from Character Generator to Image Editor
                if (updatedNode.type === NodeType.CharacterGenerator && 'imageUrl' in data && toNode.type === NodeType.ImageEditor) {
                    newNodes[toNodeIndex] = { ...toNode, data: { ...toNode.data, inputImageUrl: data.imageUrl } };
                }
            }
        });
        return newNodes;
    });
  }, [connections]);

  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
        setDragStartInfo({
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startNodeX: node.position.x,
            startNodeY: node.position.y,
        });
    }
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (draggingNodeId && dragStartInfo) {
      const dx = e.clientX - dragStartInfo.startMouseX;
      const dy = e.clientY - dragStartInfo.startMouseY;
      const x = dragStartInfo.startNodeX + dx / zoom;
      const y = dragStartInfo.startNodeY + dy / zoom;
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === draggingNodeId ? { ...node, position: { x, y } } : node
        )
      );
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [draggingNodeId, dragStartInfo, isPanning, panStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setDragStartInfo(null);
    setIsPanning(false);
    setTempConnectionStartNodeId(null); // Cancel connection on mouse up
  }, []);
  
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(0.2, Math.min(2, zoom + direction * zoomSpeed));
    if (newZoom === zoom) return;
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const zoomRatio = newZoom / zoom;
    const newOffsetX = mouseX - zoomRatio * (mouseX - canvasOffset.x);
    const newOffsetY = mouseY - zoomRatio * (mouseY - canvasOffset.y);
    setZoom(newZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }, [zoom, canvasOffset]);

  const handleOutputMouseDown = useCallback((nodeId: string) => {
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId));
    setTempConnectionStartNodeId(nodeId);
  }, []);

  const handleInputMouseDown = useCallback((nodeId: string) => {
    const connection = connections.find(c => c.toNodeId === nodeId);
    if (connection) {
        setConnections(prev => prev.filter(c => c.id !== connection.id));
        setTempConnectionStartNodeId(connection.fromNodeId);
    }
  }, [connections]);

  const handleInputMouseUp = useCallback((toNodeId: string) => {
    if (!tempConnectionStartNodeId) return;

    const fromNode = nodes.find(n => n.id === tempConnectionStartNodeId);
    const toNode = nodes.find(n => n.id === toNodeId);

    if (!fromNode || !toNode || fromNode.id === toNode.id) {
        setTempConnectionStartNodeId(null);
        return;
    }

    // Connection validation
    const isTextToCharGen = fromNode.type === NodeType.Text && toNode.type === NodeType.CharacterGenerator;
    const isCharGenToImageEditor = fromNode.type === NodeType.CharacterGenerator && toNode.type === NodeType.ImageEditor;

    if (!isTextToCharGen && !isCharGenToImageEditor) {
        setTempConnectionStartNodeId(null);
        return;
    }
    
    if(connections.some(c => c.toNodeId === toNodeId)){
        setTempConnectionStartNodeId(null);
        return;
    }

    const newConnection: Connection = {
      id: `conn_${tempConnectionStartNodeId}_${toNodeId}`,
      fromNodeId: tempConnectionStartNodeId,
      toNodeId: toNodeId,
    };
    
    setConnections(prev => [...prev.filter(c => c.toNodeId !== toNodeId && c.fromNodeId !== tempConnectionStartNodeId), newConnection]);
    
    // Update target node's data immediately based on connection type
    if (isTextToCharGen) {
        updateNodeData(toNodeId, { characterDescription: fromNode.data.text });
    } else if (isCharGenToImageEditor) {
        updateNodeData(toNodeId, { inputImageUrl: fromNode.data.imageUrl });
    }
    
    setTempConnectionStartNodeId(null);
  }, [tempConnectionStartNodeId, nodes, connections, updateNodeData]);

  const handleGenerateImage = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.CharacterGenerator || !sourceNode.data.characterDescription) {
      updateNodeData(nodeId, { error: 'Character description cannot be empty.' });
      return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
      const { characterDescription, style, layout, aspectRatio } = sourceNode.data;
      const imageUrl = await generateImageFromPrompt(characterDescription!, style!, layout!, aspectRatio!);
      updateNodeData(nodeId, { imageUrl, isLoading: false });
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);
  
  const handleEditImage = useCallback(async (nodeId: string) => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || sourceNode.type !== NodeType.ImageEditor) return;

    const { inputImageUrl, editDescription } = sourceNode.data;

    if (!inputImageUrl) {
        updateNodeData(nodeId, { error: 'Please connect an input image.' });
        return;
    }
    if (!editDescription) {
        updateNodeData(nodeId, { error: 'Please provide an edit description.' });
        return;
    }

    updateNodeData(nodeId, { isLoading: true, error: undefined, imageUrl: undefined });
    try {
        const editedImageUrl = await editImageWithPrompt(inputImageUrl, editDescription);
        updateNodeData(nodeId, { imageUrl: editedImageUrl, isLoading: false });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        updateNodeData(nodeId, { error: errorMessage, isLoading: false });
    }
  }, [nodes, updateNodeData]);

  const handleImageClick = useCallback((imageUrl: string) => setModalImageUrl(imageUrl), []);
  const handleCloseModal = useCallback(() => setModalImageUrl(null), []);

  const isDragging = draggingNodeId !== null || tempConnectionStartNodeId !== null;

  return (
    <div className={`w-screen h-screen bg-gray-900 text-white overflow-hidden flex flex-col font-sans ${isDragging ? 'select-none' : ''}`}>
      <Toolbar onAddNode={addNode} onAddTextNode={addTextNode} onAddImageEditorNode={addImageEditorNode} />
      <Canvas
        ref={canvasRef}
        nodes={nodes}
        connections={connections}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onNodeDragStart={handleNodeDragStart}
        onUpdateNodeData={updateNodeData}
        onGenerateImage={handleGenerateImage}
        onEditImage={handleEditImage}
        onImageClick={handleImageClick}
        onOutputMouseDown={handleOutputMouseDown}
        onInputMouseDown={handleInputMouseDown}
        onInputMouseUp={handleInputMouseUp}
        nodeDimensions={NODE_DIMENSIONS}
        canvasOffset={canvasOffset}
        zoom={zoom}
        tempConnectionStartNodeId={tempConnectionStartNodeId}
        mousePosition={mousePosition}
      />
      <ImageModal imageUrl={modalImageUrl} onClose={handleCloseModal} />
    </div>
  );
};

export default App;