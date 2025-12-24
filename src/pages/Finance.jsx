import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Wallet, Plus, TrendingDown, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { POINTS } from '@/utils/gamification';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { expenseSchema, validateFormData, sanitizeInput } from '@/utils/validation';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Bills', 'Health', 'Other'];
const CATEGORY_COLORS = {
  'Food': '#f59e0b',
  'Transport': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Education': '#10b981',
  'Bills': '#ef4444',
  'Health': '#06b6d4',
  'Other': '#6b7280'
};

export default function Finance() {
  const { user, addPoints } = useStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      const expensesSnap = await getDocs(userRecent(db, 'expenses', user.uid, 200));
      const expensesData = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const validation = validateFormData(
      {
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        description: newExpense.description
      },
      expenseSchema
    );

    if (!validation.valid) {
      Object.entries(validation.error).forEach(([field, message]) => {
        toast.error(`${field}: ${message}`);
      });
      return;
    }
    try {
      await addDoc(collection(db, 'expenses'), {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: new Date().toISOString(),
        userId: user.uid
      });
      addPoints(POINTS.LOG_EXPENSE);
      toast.success(`+${POINTS.LOG_EXPENSE} XP! Expense logged`);
      setShowAddExpense(false);
      setNewExpense({ amount: '', category: 'Food', description: '' });
      loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const getMonthlyTotal = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter(exp => {
        const d = typeof exp.date === 'object' && exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
        return d && d >= startOfMonth;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getCategoryData = () => {
    const categoryTotals = {};
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    expenses
      .filter(exp => {
        const d = typeof exp.date === 'object' && exp.date?.toDate ? exp.date.toDate() : new Date(exp.date);
        return d && d >= startOfMonth;
      })
      .forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      });

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS[name] || '#6b7280'
    }));
  };

  const categoryData = getCategoryData();
  const monthlyTotal = getMonthlyTotal();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Finance Tracker</h1>
            <p className="text-slate-400">Track your expenses and manage your budget</p>
          </div>
          <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-expense-button"
                className="bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Log Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Amount (₹)</Label>
                  <Input
                    data-testid="expense-amount-input"
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    required
                    placeholder="500"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                    <SelectTrigger data-testid="expense-category-select" className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-slate-200">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Description (Optional)</Label>
                  <Input
                    data-testid="expense-description-input"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Lunch with friends"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500">
                  Log Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">This Month</p>
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatCurrency(monthlyTotal)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">12% less</span>
              <span className="text-slate-500">than last month</span>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Avg Daily Spend</p>
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatCurrency(monthlyTotal / new Date().getDate())}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Expenses</p>
                <h3 className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {expenses.length}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-pink-500 flex items-center justify-center shadow-lg">
                <PieChartIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Spending by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Category Breakdown</h2>
              <div className="space-y-4">
                {categoryData.map(cat => {
                  const percentage = (cat.value / monthlyTotal) * 100;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatCurrency(cat.value)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Transactions</h2>
          {expenses.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
              <Wallet className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No expenses logged yet</h3>
              <p className="text-slate-500 mb-6">Start tracking your spending to see insights</p>
              <Button onClick={() => setShowAddExpense(true)} className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Expense
              </Button>
            </div>
          ) : (
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-950/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Description</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {expenses.slice(0, 15).map(expense => (
                      <tr key={expense.id} data-testid={`expense-${expense.id}`} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-400">{formatDate(expense.date)}</td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                            style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20`, color: CATEGORY_COLORS[expense.category] }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[expense.category] }} />
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{expense.description || '-'}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatCurrency(expense.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}