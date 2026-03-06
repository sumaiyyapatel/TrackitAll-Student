import React from 'react';

/**
 * Skeleton loading components for different page layouts.
 * Provides visual placeholders while data loads.
 */

const SkeletonPulse = ({ className = '' }) => (
  <div className={`bg-muted animate-pulse rounded-xl ${className}`} aria-hidden="true" />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-card/50 border border-border rounded-2xl p-6 space-y-3 ${className}`} aria-hidden="true">
    <div className="flex items-center justify-between">
      <SkeletonPulse className="h-4 w-24" />
      <SkeletonPulse className="h-8 w-8 rounded-lg" />
    </div>
    <SkeletonPulse className="h-8 w-32" />
    <SkeletonPulse className="h-3 w-20" />
  </div>
);

export const SkeletonHero = ({ className = '' }) => (
  <div className={`bg-muted/30 rounded-2xl p-8 space-y-4 ${className}`} aria-hidden="true">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-10 w-48" />
      </div>
      <SkeletonPulse className="h-16 w-16 rounded-2xl" />
    </div>
    <SkeletonPulse className="h-10 w-36 rounded-lg" />
  </div>
);

export const SkeletonChart = ({ className = '' }) => (
  <div className={`bg-card/50 border border-border rounded-2xl p-6 ${className}`} aria-hidden="true">
    <div className="flex items-center justify-between mb-6">
      <SkeletonPulse className="h-5 w-36" />
      <SkeletonPulse className="h-8 w-48 rounded-lg" />
    </div>
    <div className="flex items-end gap-3 h-48">
      {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
        <SkeletonPulse key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

export const SkeletonList = ({ count = 5, className = '' }) => (
  <div className={`bg-card/50 border border-border rounded-2xl p-6 space-y-4 ${className}`} aria-hidden="true">
    <div className="flex items-center justify-between mb-2">
      <SkeletonPulse className="h-5 w-36" />
      <SkeletonPulse className="h-6 w-20 rounded-lg" />
    </div>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
        <SkeletonPulse className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-3/4" />
          <SkeletonPulse className="h-3 w-1/2" />
        </div>
        <SkeletonPulse className="h-4 w-16" />
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ count = 3, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${count} gap-6 ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

/**
 * Full page skeleton for Finance page
 */
export const FinanceSkeleton = () => (
  <div className="max-w-container mx-auto space-y-8 animate-fade-in" role="status" aria-label="Loading finance data">
    <span className="sr-only">Loading...</span>
    <SkeletonHero />
    <SkeletonChart />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <SkeletonList count={4} />
      <div className="lg:col-span-2">
        <SkeletonList count={5} />
      </div>
    </div>
  </div>
);

/**
 * Full page skeleton for Dashboard
 */
export const DashboardSkeleton = () => (
  <div className="max-w-container mx-auto space-y-8 animate-fade-in" role="status" aria-label="Loading dashboard">
    <span className="sr-only">Loading...</span>
    <SkeletonHero />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
    </div>
    <SkeletonList count={4} />
  </div>
);

/**
 * Full page skeleton for Mood page
 */
export const MoodSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-8 animate-fade-in" role="status" aria-label="Loading mood data">
    <span className="sr-only">Loading...</span>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-64" />
      </div>
      <SkeletonPulse className="h-10 w-28 rounded-lg" />
    </div>
    <SkeletonStats count={3} />
    <SkeletonList count={5} />
  </div>
);

/**
 * Full page skeleton for Goals page
 */
export const GoalsSkeleton = () => (
  <div className="max-w-7xl mx-auto space-y-8 animate-fade-in" role="status" aria-label="Loading goals">
    <span className="sr-only">Loading...</span>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-32" />
        <SkeletonPulse className="h-4 w-56" />
      </div>
      <SkeletonPulse className="h-10 w-32 rounded-lg" />
    </div>
    <SkeletonStats count={3} />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-card/50 border border-border rounded-2xl p-6 space-y-4">
          <SkeletonPulse className="h-5 w-20 rounded-full" />
          <SkeletonPulse className="h-6 w-3/4" />
          <SkeletonPulse className="h-3 w-full rounded-full" />
          <div className="flex gap-2">
            <SkeletonPulse className="h-8 flex-1 rounded-lg" />
            <SkeletonPulse className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Full page skeleton for Health page
 */
export const HealthSkeleton = () => (
  <div className="max-w-container mx-auto space-y-8 animate-fade-in" role="status" aria-label="Loading health data">
    <span className="sr-only">Loading...</span>
    <SkeletonHero />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
    </div>
    <SkeletonChart />
  </div>
);
