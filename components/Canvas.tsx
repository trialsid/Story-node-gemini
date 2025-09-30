import React, { forwardRef } from 'react';
import { NodeData, Connection, NodeType, HandleType } from '../types';
import Node from './Node';
import Connector from './Connector';
import { useTheme } from '../contexts/ThemeContext';
import { getHandleSpec, getMinimizedHandleY } from '../utils/handlePositions';

interface TempConnectionInfo {
  startNodeId: string;
  startHandleId: string;
  startHandleType: HandleType;
}

interface HoveredInputInfo {
  nodeId: string;
  handleId: string;
}

interface CanvasProps {
  allNodes: NodeData[];
  connections: Connection[];
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onWheel: (e: React.WheelEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onNodeDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onNodeClick: (nodeId: string, e: React.MouseEvent) => void;
  selectedNodeIds: Set<string>;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateCharacterImage: (nodeId: string) => void;
  onGenerateImages: (nodeId: string) => void;
  onEditImage: (nodeId: string) => void;
  onMixImages: (nodeId: string) => void;
  onGenerateVideo: (nodeId: string) => void;
  onGenerateText: (nodeId: string) => void;
  onGenerateCharacters: (nodeId: string) => void;
  onExpandStory: (nodeId: string) => void;
  onGenerateShortStory: (nodeId: string) => void;
  onOpenTextModal: (title: string, text: string) => void;
  onImageClick: (imageUrl: string) => void;
  onOutputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseDown: (nodeId: string, handleId: string) => void;
  onInputMouseUp: (nodeId: string, handleId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteNodeDirectly: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onResetNode: (nodeId: string) => void;
  onToggleNodeMinimization: (nodeId: string) => void;
  nodeDimensions: { [key in NodeType]: { width: number; height?: number } };
  canvasOffset: { x: number; y: number };
  zoom: number;
  tempConnectionInfo: TempConnectionInfo | null;
  mousePosition: { x: number; y: number };
  hoveredInputHandle: HoveredInputInfo | null;
  setHoveredInputHandle: (info: HoveredInputInfo | null) => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  allNodes,
  connections,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onContextMenu,
  onNodeDragStart,
  onNodeClick,
  selectedNodeIds,
  onUpdateNodeData,
  onGenerateCharacterImage,
  onGenerateImages,
  onEditImage,
  onMixImages,
  onGenerateVideo,
  onGenerateText,
  onGenerateCharacters,
  onExpandStory,
  onGenerateShortStory,
  onOpenTextModal,
  onImageClick,
  onOutputMouseDown,
  onInputMouseDown,
  onInputMouseUp,
  onDeleteNode,
  onDeleteNodeDirectly,
  onDuplicateNode,
  onResetNode,
  onToggleNodeMinimization,
  nodeDimensions,
  canvasOffset,
  zoom,
  tempConnectionInfo,
  mousePosition,
  hoveredInputHandle,
  setHoveredInputHandle,
}, ref) => {
  const { styles } = useTheme();
  const baseGridSize = 24;

  const getNodeHandlePosition = (node: NodeData, handleId: string, handleSide: 'input' | 'output'): { x: number; y: number } => {
    const dims = nodeDimensions[node.type];
    const isMinimized = node.data.isMinimized;
    const yOffset = node.data.handleYOffsets?.[handleId];

    const xPos = handleSide === 'input' ? node.position.x : node.position.x + dims.width;

    if (isMinimized) {
        return {
          x: xPos,
          y: node.position.y + getMinimizedHandleY(node, handleId, handleSide),
        };
    }
    

    if (yOffset !== undefined) {
        return { x: xPos, y: node.position.y + yOffset };
    }
    
    // Fallback if offset is not calculated yet
    return { x: xPos, y: node.position.y + 100 };
  };

  const tempConnectionStartNode = allNodes.find(n => n.id === tempConnectionInfo?.startNodeId);
  let tempConnectionPath = null;
  if (tempConnectionInfo && tempConnectionStartNode) {
    const fromPos = getNodeHandlePosition(tempConnectionStartNode, tempConnectionInfo.startHandleId, 'output');
    const toPos = {
      x: (mousePosition.x - canvasOffset.x) / zoom,
      y: (mousePosition.y - canvasOffset.y) / zoom,
    };
    tempConnectionPath = <Connector from={fromPos} to={toPos} isTemporary color={styles.connector.tempColor} />;
  }

  return (
    <div
      ref={ref}
      className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, ${styles.canvas.grid} 1px, transparent 0)`,
        backgroundSize: `${baseGridSize * zoom}px ${baseGridSize * zoom}px`,
        backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onWheel={onWheel}
      onContextMenu={onContextMenu}
    >
      <div 
        className="absolute top-0 left-0"
        style={{ 
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {allNodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            allNodes={allNodes}
            connections={connections}
            onDragStart={onNodeDragStart}
            onNodeClick={onNodeClick}
            isSelected={selectedNodeIds.has(node.id)}
            onUpdateData={onUpdateNodeData}
            onGenerateCharacterImage={onGenerateCharacterImage}
            onGenerateImages={onGenerateImages}
            onEditImage={onEditImage}
            onMixImages={onMixImages}
            onGenerateVideo={onGenerateVideo}
            onGenerateText={onGenerateText}
            onGenerateCharacters={onGenerateCharacters}
            onExpandStory={onExpandStory}
            onGenerateShortStory={onGenerateShortStory}
            onOpenTextModal={onOpenTextModal}
            onImageClick={onImageClick}
            onOutputMouseDown={onOutputMouseDown}
            onInputMouseDown={onInputMouseDown}
            onInputMouseUp={onInputMouseUp}
            onDelete={onDeleteNode}
            onDeleteDirectly={onDeleteNodeDirectly}
            onDuplicate={onDuplicateNode}
            onReset={onResetNode}
            onToggleMinimize={onToggleNodeMinimization}
            dimensions={nodeDimensions[node.type]}
            tempConnectionInfo={tempConnectionInfo}
            hoveredInputHandle={hoveredInputHandle}
            setHoveredInputHandle={setHoveredInputHandle}
            zoom={zoom}
            canvasOffset={canvasOffset}
          />
        ))}
      </div>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          <g style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
          }}>
              {connections.map(conn => {
                  const fromNode = allNodes.find(n => n.id === conn.fromNodeId);
                  const toNode = allNodes.find(n => n.id === conn.toNodeId);
                  if (!fromNode || !toNode) return null;

                  const fromPos = getNodeHandlePosition(fromNode, conn.fromHandleId, 'output');
                  const toPos = getNodeHandlePosition(toNode, conn.toHandleId, 'input');
                  
                  const isPendingReplacement = tempConnectionInfo !== null &&
                    conn.toNodeId === hoveredInputHandle?.nodeId &&
                    conn.toHandleId === hoveredInputHandle?.handleId;

                  const fromHandleSpec = getHandleSpec(fromNode, conn.fromHandleId, 'output');
                  if (!fromHandleSpec) return null;
                  const connectorColor = styles.handle.typeColors[fromHandleSpec.type].split(' ')[0].replace('bg-', 'border-');

                  return <Connector 
                            key={conn.id} 
                            from={fromPos} 
                            to={toPos} 
                            color={styles.connector.color}
                            isPendingReplacement={isPendingReplacement}
                         />;
              })}
              {tempConnectionPath}
          </g>
      </svg>
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
