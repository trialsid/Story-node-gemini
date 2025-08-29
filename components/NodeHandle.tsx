
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface NodeHandleProps {
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  isConnected: boolean;
  style: React.CSSProperties;
}

const NodeHandle: React.FC<NodeHandleProps> = ({ onMouseDown, onMouseUp, isConnected, style }) => {
  const { styles } = useTheme();
  const baseClasses = `absolute w-4 h-4 rounded-full border-2 ${styles.handle.border} ${styles.handle.bg} ${styles.handle.hoverBg} ${styles.handle.hoverBorder} transition-colors cursor-crosshair z-10`;
  const connectedClasses = isConnected ? `${styles.handle.connectedBg} ${styles.handle.connectedBorder}` : '';

  return (
    <div
      className={`${baseClasses} ${connectedClasses}`}
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        e.stopPropagation();
        onMouseUp?.(e);
      }}
      aria-label="Node handle"
    />
  );
};

export default NodeHandle;
