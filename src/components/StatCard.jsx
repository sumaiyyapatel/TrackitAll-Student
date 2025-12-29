import React from 'react';
import { DataCard } from './cards/DataCard';

/**
 * StatCard - Legacy component, now uses DataCard
 * Maintained for backward compatibility
 * @deprecated Use DataCard directly
 */
export const StatCard = ({ title, value, icon, testId, ...props }) => {
  // Remove deprecated props: color, trend, trendValue
  return (
    <DataCard
      title={title}
      value={value}
      icon={icon}
      testId={testId}
    />
  );
};