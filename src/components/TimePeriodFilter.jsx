import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PERIOD_OPTIONS = [
  { key: 'week', label: 'This Week', shortLabel: '1W' },
  { key: 'month', label: 'This Month', shortLabel: '1M' },
  { key: '3months', label: '3 Months', shortLabel: '3M' },
  { key: 'year', label: 'This Year', shortLabel: '1Y' },
  { key: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
];

/**
 * Calculates the start date for a given period key.
 */
export const getPeriodStartDate = (periodKey, customStart) => {
  const now = new Date();
  switch (periodKey) {
    case 'week': {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return start;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case '3months':
      return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    case 'custom':
      return customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

export const TimePeriodFilter = ({
  value = 'month',
  onChange,
  showCustom = true,
  className = '',
}) => {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  const options = showCustom ? PERIOD_OPTIONS : PERIOD_OPTIONS.filter(o => o.key !== 'custom');
  const selectedOption = options.find(o => o.key === value) || options[1];

  const handleSelect = (key) => {
    if (key === 'custom') {
      // Keep popover open for custom date inputs
      return;
    }
    onChange?.(key, getPeriodStartDate(key));
    setPopoverOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart) {
      onChange?.('custom', new Date(customStart), customEnd ? new Date(customEnd) : new Date());
      setPopoverOpen(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Time period filter">
      {/* Quick toggle buttons for common periods */}
      <div className="hidden sm:flex items-center bg-muted rounded-lg p-1" role="tablist" aria-label="Period selection">
        {options.filter(o => o.key !== 'custom').map((option) => (
          <button
            key={option.key}
            role="tab"
            aria-selected={value === option.key}
            onClick={() => handleSelect(option.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              value === option.key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {option.shortLabel}
          </button>
        ))}
      </div>

      {/* Mobile dropdown + custom range */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden gap-2 text-xs"
            aria-label={`Period: ${selectedOption.label}`}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {selectedOption.shortLabel}
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Period</p>
            {options.map((option) => (
              <button
                key={option.key}
                onClick={() => option.key !== 'custom' && handleSelect(option.key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                  value === option.key
                    ? 'bg-violet-600 text-white'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {option.label}
              </button>
            ))}
            {showCustom && (
              <div className="border-t border-border pt-3 mt-2 space-y-2">
                <label className="text-xs text-muted-foreground" htmlFor="custom-start">Start Date</label>
                <input
                  id="custom-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <label className="text-xs text-muted-foreground" htmlFor="custom-end">End Date</label>
                <input
                  id="custom-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Button size="sm" className="w-full" onClick={handleCustomApply} disabled={!customStart}>
                  Apply Range
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Desktop custom range button */}
      {showCustom && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-2 text-xs"
              aria-label="Custom date range"
            >
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Range</p>
              <label className="text-xs text-muted-foreground" htmlFor="desktop-custom-start">Start</label>
              <input
                id="desktop-custom-start"
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <label className="text-xs text-muted-foreground" htmlFor="desktop-custom-end">End</label>
              <input
                id="desktop-custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Button size="sm" className="w-full" onClick={handleCustomApply} disabled={!customStart}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
