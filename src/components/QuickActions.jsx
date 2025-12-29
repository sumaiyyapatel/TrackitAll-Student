import React from 'react';
import { Plus, Calendar, DollarSign, Activity, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    { icon: Calendar, label: 'Mark Attendance', color: 'violet', path: '/attendance' },
    { icon: DollarSign, label: 'Log Expense', color: 'amber', path: '/finance' },
    { icon: Activity, label: 'Log Workout', color: 'violet', path: '/health' },
    { icon: Smile, label: 'Log Mood', color: 'cyan', path: '/mood' }
  ];

  const colorClasses = {
    violet: 'bg-[#8b5cf6] hover:bg-[#7c3aed]',
    amber: 'bg-warning hover:opacity-90',
    cyan: 'bg-info hover:opacity-90'
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <button
            key={index}
            data-testid={`quick-action-${action.label.toLowerCase().replace(' ', '-')}`}
            onClick={() => navigate(action.path)}
            className={`${colorClasses[action.color]} text-white font-semibold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3`}
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