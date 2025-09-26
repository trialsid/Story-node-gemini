import React from 'react';

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1" />
    <path d="M12 10a4 4 0 11-8 0 4 4 0 018 0z" />
    <path d="M21 20v-1a3 3 0 00-3-3h-1" />
    <path d="M17 4a3 3 0 010 6" />
  </svg>
);

export default UsersIcon;
