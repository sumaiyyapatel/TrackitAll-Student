import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ExpenseForm = ({
  newExpense,
  setNewExpense,
  categories,
  onSubmit,
  onCancel,
  submitting,
  isEditing,
  recentCategory
}) => {
  // Smart pre-fill: if no category selected and we have a recent one, use it
  React.useEffect(() => {
    if (!isEditing && !newExpense.category && recentCategory && newExpense.type !== 'income') {
      setNewExpense(prev => ({ ...prev, category: recentCategory }));
    }
  }, [recentCategory, isEditing]);
  const type = newExpense.type || 'expense';

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
        <button
          type="button"
          onClick={() => setNewExpense({ ...newExpense, type: 'expense', category: categories[0] })}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'expense'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setNewExpense({ ...newExpense, type: 'income', category: '' })}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'income'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Income
        </button>
      </div>

      <div>
        <Label className="text-slate-300">Amount (₹)</Label>
        <Input
          data-testid="transaction-amount-input"
          type="number"
          step="0.01"
          value={newExpense.amount}
          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          required
          className="bg-slate-950 border-slate-800 text-slate-200"
        />
      </div>

      <div>
        <Label className="text-slate-300">Category</Label>
        {type === 'expense' ? (
          <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-slate-200">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            placeholder="Salary, Freelance, Gift..."
            className="bg-slate-950 border-slate-800 text-slate-200"
            required
          />
        )}
      </div>

      <div>
        <Label className="text-slate-300">Description (Optional)</Label>
        <Input
          value={newExpense.description}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          className="bg-slate-950 border-slate-800 text-slate-200"
          placeholder={type === 'expense' ? "Lunch, Movie, Books..." : "Monthly salary, Project X..."}
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={submitting}
          className={`flex-1 ${type === 'expense' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
        >
          {submitting ? 'Saving...' : (isEditing ? `Update ${type}` : `Save ${type}`)}
        </Button>
        <Button type="button" onClick={onCancel} disabled={submitting} variant="outline" className="flex-1 border-white/10 text-slate-300">
          Cancel
        </Button>
      </div>
    </form>
  );
};
