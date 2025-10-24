import React from 'react';

interface ConnectorProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isTemporary?: boolean;
  isPendingReplacement?: boolean;
  color: string;
}

const Connector: React.FC<ConnectorProps> = ({ from, to, isTemporary = false, isPendingReplacement = false, color }) => {
  const controlPointOffset = Math.max(75, Math.abs(to.x - from.x) * 0.4);
  const pathData = `M ${from.x} ${from.y} C ${from.x + controlPointOffset} ${from.y}, ${to.x - controlPointOffset} ${to.y}, ${to.x} ${to.y}`;
  
  const strokeColor = isPendingReplacement ? '#EF4444' : color;
  const strokeWidth = isPendingReplacement ? '4' : '3';
  const dashArray = isTemporary ? '4 4' : isPendingReplacement ? '8 4' : 'none';

  return (
    <path
      d={pathData}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={dashArray}
      style={{ 
        animation: isTemporary || isPendingReplacement ? 'dash 1s linear infinite' : 'none',
        transition: 'stroke 0.2s ease-in-out, stroke-width 0.2s ease-in-out',
      }}
    />
  );
};

export default Connector;