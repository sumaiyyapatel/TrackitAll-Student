import React from 'react';
import { cn } from '@/lib/utils';

/**
 * TimeSlider - Custom range slider for duration inputs
 * Replaces plain number inputs with a visual slider.
 *
 * @param {number} value - Current value
 * @param {function} onChange - Callback with new value
 * @param {number} min - Minimum value (default 5)
 * @param {number} max - Maximum value (default 120)
 * @param {number} step - Step increment (default 5)
 * @param {string} unit - Unit label (default 'min')
 * @param {string} accentColor - Tailwind color class for the fill
 * @param {string} className - Additional classes
 */
export const TimeSlider = ({
    value,
    onChange,
    min = 5,
    max = 120,
    step = 5,
    unit = 'min',
    accentColor = 'bg-violet-600',
    className = '',
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={cn('space-y-3', className)}>
            {/* Value Display */}
            <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {value}
                </span>
                <span className="text-sm text-muted-foreground">{unit}</span>
            </div>

            {/* Slider Track */}
            <div className="relative h-10 flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value, 10))}
                    className="w-full h-2 appearance-none rounded-full cursor-pointer outline-none"
                    style={{
                        background: `linear-gradient(to right, var(--slider-fill, #8b5cf6) ${percentage}%, var(--slider-track, rgba(255,255,255,0.1)) ${percentage}%)`,
                    }}
                />
            </div>

            {/* Range Labels */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{min} {unit}</span>
                <span>{max} {unit}</span>
            </div>

            {/* Slider custom styles */}
            <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 3px solid #8b5cf6;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
          background: transparent;
        }
      `}</style>
        </div>
    );
};
