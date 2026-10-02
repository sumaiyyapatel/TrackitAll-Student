import React from 'react';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`bg-muted animate-pulse rounded ${className}`} />
  );
}
