import React from 'react';

export default function Skeleton({ className = '' }) {
  return (
    <div className={`bg-slate-800 animate-pulse rounded ${className}`} />
  );
}
