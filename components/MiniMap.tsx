import React, { useRef, useEffect } from 'react';
import { NodeData, Connection, NodeType } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface MiniMapProps {
  nodes: NodeData[];
  connections: Connection[];
  nodeDimensions: { [key in NodeType]: { width: number; height?: number } };
  canvasOffset: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  onNavigate: (x: number, y: number) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  connections,
  nodeDimensions,
  canvasOffset,
  zoom,
  viewportWidth,
  viewportHeight,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { styles } = useTheme();

  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;
  const PADDING = 20;

  // Calculate bounds of all nodes
  const calculateBounds = () => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const dims = nodeDimensions[node.type];
      const nodeWidth = dims.width;
      const nodeHeight = dims.height || 200;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // Include viewport in bounds calculation
    const viewportWorldWidth = viewportWidth / zoom;
    const viewportWorldHeight = viewportHeight / zoom;
    const viewportWorldX = -canvasOffset.x / zoom;
    const viewportWorldY = -canvasOffset.y / zoom;

    minX = Math.min(minX, viewportWorldX);
    minY = Math.min(minY, viewportWorldY);
    maxX = Math.max(maxX, viewportWorldX + viewportWorldWidth);
    maxY = Math.max(maxY, viewportWorldY + viewportWorldHeight);

    // Add padding
    const paddingX = (maxX - minX) * 0.1;
    const paddingY = (maxY - minY) * 0.1;

    return {
      minX: minX - paddingX,
      minY: minY - paddingY,
      maxX: maxX + paddingX,
      maxY: maxY + paddingY,
    };
  };

  const bounds = calculateBounds();
  const worldWidth = bounds.maxX - bounds.minX;
  const worldHeight = bounds.maxY - bounds.minY;

  // Calculate scale to fit everything in minimap
  const scaleX = (MINIMAP_WIDTH - PADDING * 2) / worldWidth;
  const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Convert world coordinates to minimap coordinates
  const worldToMinimap = (x: number, y: number) => ({
    x: (x - bounds.minX) * scale + PADDING,
    y: (y - bounds.minY) * scale + PADDING,
  });

  // Convert minimap coordinates to world coordinates
  const minimapToWorld = (x: number, y: number) => ({
    x: (x - PADDING) / scale + bounds.minX,
    y: (y - PADDING) / scale + bounds.minY,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = MINIMAP_WIDTH;
    canvas.height = MINIMAP_HEIGHT;

    // Clear canvas
    ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw background
    ctx.fillStyle = styles.canvas.grid === '#4A5568' ? '#1F2937' :
                    styles.canvas.grid === '#D1D5DB' ? '#F9FAFB' : '#292524';
    ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

    // Draw connections
    ctx.strokeStyle = styles.connector.color;
    ctx.lineWidth = 1;
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.fromNodeId);
      const toNode = nodes.find(n => n.id === conn.toNodeId);

      if (fromNode && toNode) {
        const fromDims = nodeDimensions[fromNode.type];
        const toDims = nodeDimensions[toNode.type];

        const fromPos = worldToMinimap(
          fromNode.position.x + fromDims.width,
          fromNode.position.y + (fromDims.height || 200) / 2
        );
        const toPos = worldToMinimap(
          toNode.position.x,
          toNode.position.y + (toDims.height || 200) / 2
        );

        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const dims = nodeDimensions[node.type];
      const nodeWidth = dims.width;
      const nodeHeight = dims.height || 200;

      const pos = worldToMinimap(node.position.x, node.position.y);
      const width = nodeWidth * scale;
      const height = nodeHeight * scale;

      // Node background
      ctx.fillStyle = styles.canvas.grid === '#4A5568' ? '#374151' :
                      styles.canvas.grid === '#D1D5DB' ? '#E5E7EB' : '#44403c';
      ctx.fillRect(pos.x, pos.y, width, height);

      // Node border
      ctx.strokeStyle = styles.canvas.grid === '#4A5568' ? '#6B7280' :
                        styles.canvas.grid === '#D1D5DB' ? '#9CA3AF' : '#a8a29e';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(pos.x, pos.y, width, height);
    });

    // Draw viewport rectangle
    const viewportWorldWidth = viewportWidth / zoom;
    const viewportWorldHeight = viewportHeight / zoom;
    const viewportWorldX = -canvasOffset.x / zoom;
    const viewportWorldY = -canvasOffset.y / zoom;

    const viewportPos = worldToMinimap(viewportWorldX, viewportWorldY);
    const viewportSize = {
      width: viewportWorldWidth * scale,
      height: viewportWorldHeight * scale,
    };

    // Viewport border - use accent color
    ctx.strokeStyle = styles.canvas.grid === '#4A5568' ? '#3B82F6' :
                      styles.canvas.grid === '#D1D5DB' ? '#2563EB' : '#F59E0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(viewportPos.x, viewportPos.y, viewportSize.width, viewportSize.height);

    // Viewport fill with transparency
    ctx.fillStyle = styles.canvas.grid === '#4A5568' ? 'rgba(59, 130, 246, 0.1)' :
                    styles.canvas.grid === '#D1D5DB' ? 'rgba(37, 99, 235, 0.1)' : 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(viewportPos.x, viewportPos.y, viewportSize.width, viewportSize.height);

  }, [nodes, connections, nodeDimensions, canvasOffset, zoom, viewportWidth, viewportHeight, bounds, scale, styles]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const worldPos = minimapToWorld(x, y);

    // Center the viewport on the clicked position
    const viewportWorldWidth = viewportWidth / zoom;
    const viewportWorldHeight = viewportHeight / zoom;

    const newWorldX = worldPos.x - viewportWorldWidth / 2;
    const newWorldY = worldPos.y - viewportWorldHeight / 2;

    const newOffsetX = -newWorldX * zoom;
    const newOffsetY = -newWorldY * zoom;

    onNavigate(newOffsetX, newOffsetY);
  };

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-20 right-4 ${
        styles.canvas.grid === '#4A5568' ? 'bg-gray-800/90' :
        styles.canvas.grid === '#D1D5DB' ? 'bg-white/90' : 'bg-stone-800/90'
      } rounded-lg shadow-2xl border ${
        styles.canvas.grid === '#4A5568' ? 'border-gray-700' :
        styles.canvas.grid === '#D1D5DB' ? 'border-gray-200' : 'border-stone-700'
      } backdrop-blur-sm z-40`}
      style={{
        width: MINIMAP_WIDTH + 16,
        height: MINIMAP_HEIGHT + 16,
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer m-2"
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
        }}
      />
    </div>
  );
};

export default MiniMap;
