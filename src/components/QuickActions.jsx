import React from 'react';
import { Plus, Calendar, DollarSign, Activity, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_THEMES } from '@/utils/categoryColors';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: Calendar, label: 'Mark Attendance', category: 'attendance', path: '/attendance' },
    { icon: DollarSign, label: 'Log Expense', category: 'finance', path: '/finance' },
    { icon: Activity, label: 'Log Workout', category: 'health', path: '/health' },
    { icon: Smile, label: 'Log Mood', category: 'mood', path: '/mood' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {actions.map((action, index) => {
        const Icon = action.icon;
        const theme = CATEGORY_THEMES[action.category];
        return (
          <button
            key={index}
            data-testid={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}
            onClick={() => navigate(action.path)}
            className={`${theme.iconBg} text-white font-semibold py-4 px-6 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] flex items-center justify-center gap-3`}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden text-sm">{action.label.split(' ')[1]}</span>
          </button>
        );
      })}
    </div>
  );
};