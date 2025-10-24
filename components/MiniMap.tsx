import React, { useRef, useEffect, useState, useCallback } from 'react';
import { NodeData, Connection, NodeType, HandleType } from '../types';
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
  selectedNodeIds: Set<string>;
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
  selectedNodeIds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { styles } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;
  const PADDING = 20;

  // Get color for node type based on primary handle type
  const getNodeColor = (nodeType: NodeType): string => {
    // Map node types to their primary output type
    switch (nodeType) {
      // Text nodes
      case NodeType.Text:
      case NodeType.TextGenerator:
      case NodeType.StoryCharacterCreator:
      case NodeType.StoryExpander:
      case NodeType.ShortStoryWriter:
      case NodeType.ScreenplayWriter:
        return styles.canvas.grid === '#4A5568' ? '#F59E0B' :  // Amber
               styles.canvas.grid === '#D1D5DB' ? '#F59E0B' : '#F59E0B';

      // Video nodes
      case NodeType.VideoGenerator:
      case NodeType.VideoInterpolator:
      case NodeType.VideoComposer:
      case NodeType.VideoExtender:
        return styles.canvas.grid === '#4A5568' ? '#10B981' :  // Emerald
               styles.canvas.grid === '#D1D5DB' ? '#10B981' : '#14B8A6';

      // Image nodes (default)
      case NodeType.Image:
      case NodeType.ImageGenerator:
      case NodeType.ImageEditor:
      case NodeType.ImageMixer:
      case NodeType.CharacterGenerator:
      case NodeType.CharacterPortfolio:
      default:
        return styles.canvas.grid === '#4A5568' ? '#6366F1' :  // Indigo
               styles.canvas.grid === '#D1D5DB' ? '#3B82F6' : '#6366F1';
    }
  };

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
      const isSelected = selectedNodeIds.has(node.id);

      // Node background - use color-coded type
      const nodeColor = getNodeColor(node.type);
      ctx.fillStyle = nodeColor;
      ctx.globalAlpha = isSelected ? 0.9 : 0.6;
      ctx.fillRect(pos.x, pos.y, width, height);
      ctx.globalAlpha = 1.0;

      // Node border - highlight selected nodes
      if (isSelected) {
        ctx.strokeStyle = styles.canvas.grid === '#4A5568' ? '#60A5FA' :
                          styles.canvas.grid === '#D1D5DB' ? '#2563EB' : '#FBBF24';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pos.x - 0.5, pos.y - 0.5, width + 1, height + 1);
      } else {
        ctx.strokeStyle = styles.canvas.grid === '#4A5568' ? '#1F2937' :
                          styles.canvas.grid === '#D1D5DB' ? '#D1D5DB' : '#44403c';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(pos.x, pos.y, width, height);
      }
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

  }, [nodes, connections, nodeDimensions, canvasOffset, zoom, viewportWidth, viewportHeight, bounds, scale, styles, selectedNodeIds]);

  // Check if click is inside viewport rectangle
  const isInsideViewport = useCallback((x: number, y: number): boolean => {
    const viewportWorldWidth = viewportWidth / zoom;
    const viewportWorldHeight = viewportHeight / zoom;
    const viewportWorldX = -canvasOffset.x / zoom;
    const viewportWorldY = -canvasOffset.y / zoom;

    const viewportPos = worldToMinimap(viewportWorldX, viewportWorldY);
    const viewportSize = {
      width: viewportWorldWidth * scale,
      height: viewportWorldHeight * scale,
    };

    return x >= viewportPos.x && x <= viewportPos.x + viewportSize.width &&
           y >= viewportPos.y && y <= viewportPos.y + viewportSize.height;
  }, [canvasOffset, zoom, viewportWidth, viewportHeight, worldToMinimap, scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking inside viewport for dragging
    if (isInsideViewport(x, y)) {
      setIsDragging(true);
      dragStartRef.current = { x, y };
      e.preventDefault();
    } else {
      // Click outside viewport - navigate to that position
      const worldPos = minimapToWorld(x, y);
      const viewportWorldWidth = viewportWidth / zoom;
      const viewportWorldHeight = viewportHeight / zoom;

      const newWorldX = worldPos.x - viewportWorldWidth / 2;
      const newWorldY = worldPos.y - viewportWorldHeight / 2;

      const newOffsetX = -newWorldX * zoom;
      const newOffsetY = -newWorldY * zoom;

      onNavigate(newOffsetX, newOffsetY);
    }
  }, [isInsideViewport, minimapToWorld, viewportWidth, viewportHeight, zoom, onNavigate]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - dragStartRef.current.x;
    const dy = y - dragStartRef.current.y;

    // Convert minimap delta to world delta
    const worldDx = (dx / scale);
    const worldDy = (dy / scale);

    // Update canvas offset (negative because offset moves opposite to viewport)
    const newOffsetX = canvasOffset.x - worldDx * zoom;
    const newOffsetY = canvasOffset.y - worldDy * zoom;

    onNavigate(newOffsetX, newOffsetY);

    // Update drag start position for next frame
    dragStartRef.current = { x, y };
  }, [isDragging, scale, zoom, canvasOffset, onNavigate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  }, [isDragging]);

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`m-2 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          width: MINIMAP_WIDTH,
          height: MINIMAP_HEIGHT,
        }}
      />
    </div>
  );
};

export default MiniMap;
