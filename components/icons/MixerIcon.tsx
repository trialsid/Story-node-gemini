import React from 'react';

const MixerIcon: React.FC<{className?: string}> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M4 6h16M4 12h16M4 18h16" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M6 4v16M12 4v16M18 4v16" 
    />
  </svg>
);

export default MixerIcon;