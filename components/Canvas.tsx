import React, { forwardRef } from 'react';
import { NodeData, ConnectionData, NodeType } from '../types';
import Node from './Node';
import Connector from './Connector';

interface CanvasProps {
  nodes: NodeData[];
  connections: ConnectionData[];
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onNodeDragStart: (nodeId: string, e: React.MouseEvent) => void;
  onStartConnection: (fromNodeId: string, fromHandleId: string, e: React.MouseEvent) => void;
  onCompleteConnection: (toNodeId: string, toHandleId: string) => void;
  onUpdateNodeData: (nodeId: string, data: Partial<NodeData['data']>) => void;
  onGenerateImage: (nodeId: string) => void;
  onImageClick: (imageUrl: string) => void;
  onTriggerGenerationFromNode: (nodeId: string) => void;
  newConnection: { fromNodeId: string; fromHandleId: string; toPosition: { x: number; y: number } } | null;
  nodeHelpers: {
      getNodePosition: (nodeId: string) => { x: number; y: number };
      isInputConnected: (nodeId: string, handleId: string) => boolean;
  };
  nodeDimensions: {
      NODE_WIDTH: number;
      NODE_HEIGHT_CHARACTER_SHEET: number;
      NODE_HEIGHT_IMAGE: number;
  };
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({
  nodes,
  connections,
  onMouseMove,
  onMouseUp,
  onNodeDragStart,
  onStartConnection,
  onCompleteConnection,
  onUpdateNodeData,
  onGenerateImage,
  onImageClick,
  onTriggerGenerationFromNode,
  newConnection,
  nodeHelpers,
  nodeDimensions
}, ref) => {

  const getHandlePosition = (nodeId: string, handleId: string) => {
    const pos = nodeHelpers.getNodePosition(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    const nodeHeight = node?.type === NodeType.CharacterSheet ? nodeDimensions.NODE_HEIGHT_CHARACTER_SHEET : nodeDimensions.NODE_HEIGHT_IMAGE;
    const y = pos.y + nodeHeight / 2;

    if (handleId === 'output') {
      return { x: pos.x + nodeDimensions.NODE_WIDTH, y };
    }
    return { x: pos.x, y }; // Input handle
  };

  return (
    <div
      ref={ref}
      className="flex-grow relative w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, #4A5568 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {connections.map((conn) => {
          const fromPos = getHandlePosition(conn.fromNodeId, conn.fromHandleId);
          const toPos = getHandlePosition(conn.toNodeId, conn.toHandleId);
          return <Connector key={conn.id} from={fromPos} to={toPos} />;
        })}
        {newConnection && (
            <Connector
                from={getHandlePosition(newConnection.fromNodeId, newConnection.fromHandleId)}
                to={newConnection.toPosition}
                isTemporary
            />
        )}
      </svg>
      
      {nodes.map((node) => (
        <Node
          key={node.id}
          node={node}
          onDragStart={onNodeDragStart}
          onStartConnection={onStartConnection}
          onCompleteConnection={onCompleteConnection}
          onUpdateData={onUpdateNodeData}
          onGenerateImage={onGenerateImage}
          onImageClick={onImageClick}
          onTriggerGenerationFromNode={onTriggerGenerationFromNode}
          isInputConnected={nodeHelpers.isInputConnected(node.id, 'input')}
          dimensions={{
              width: nodeDimensions.NODE_WIDTH,
              height: node.type === NodeType.CharacterSheet ? nodeDimensions.NODE_HEIGHT_CHARACTER_SHEET : nodeDimensions.NODE_HEIGHT_IMAGE
          }}
        />
      ))}
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;