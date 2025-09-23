import React from 'react';

const RedoIcon: React.FC<{className?: string}> = ({ className }) => (
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
      d="M13 15l3-3m0 0l-3-3m3 3H5a5 5 0 000 10h2"
    />
  </svg>
);

export default RedoIcon;
