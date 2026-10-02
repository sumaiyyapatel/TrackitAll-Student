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
      <div className="flex p-1 bg-muted/50 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setNewExpense({ ...newExpense, type: 'expense', category: categories[0] })}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'expense'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setNewExpense({ ...newExpense, type: 'income', category: '' })}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${type === 'income'
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          Income
        </button>
      </div>

      <div>
        <Label className="text-foreground">Amount (₹)</Label>
        <Input
          data-testid="transaction-amount-input"
          type="number"
          step="0.01"
          value={newExpense.amount}
          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
          required
          className="bg-background border-border text-foreground"
        />
      </div>

      <div>
        <Label className="text-foreground">Category</Label>
        {type === 'expense' ? (
          <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-foreground">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={newExpense.category}
            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            placeholder="Salary, Freelance, Gift..."
            className="bg-background border-border text-foreground"
            required
          />
        )}
      </div>

      <div>
        <Label className="text-foreground">Description (Optional)</Label>
        <Input
          value={newExpense.description}
          onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
          className="bg-background border-border text-foreground"
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
        <Button type="button" onClick={onCancel} disabled={submitting} variant="outline" className="flex-1 border-border text-foreground">
          Cancel
        </Button>
      </div>
    </form>
  );
};
