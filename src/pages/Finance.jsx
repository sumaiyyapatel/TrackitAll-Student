import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { Wallet, Plus, TrendingDown, TrendingUp, PieChart as PieChartIcon, Trash2, Edit2, X } from 'lucide-react';
import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { normalizeDate } from '@/utils/dateNormalizer';
import { POINTS } from '@/utils/gamification';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { expenseSchema, validateFormData, sanitizeInput } from '@/utils/validation';
import { DataCard } from '@/components/cards/DataCard';

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
  const [editingId, setEditingId] = useState(null);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'Food',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

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
    if (submitting) return;
    setSubmitting(true);
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
      setSubmitting(false);
      return;
    }
    try {
      if (editingId) {
        await updateDoc(doc(db, 'expenses', editingId), {
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description
        });
        toast.success('Expense updated');
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          date: serverTimestamp(),
          userId: user.uid
        });
        addPoints(POINTS.LOG_EXPENSE);
        toast.success(`+${POINTS.LOG_EXPENSE} XP! Expense logged`);
      }
      setShowAddExpense(false);
      setEditingId(null);
      setNewExpense({ amount: '', category: 'Food', description: '' });
      loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      toast.success('Expense deleted');
      loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingId(expense.id);
    setNewExpense({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || ''
    });
    setShowAddExpense(true);
  };

  const handleCancel = () => {
    setShowAddExpense(false);
    setEditingId(null);
    setNewExpense({ amount: '', category: 'Food', description: '' });
  };

  const getMonthlyTotal = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expenses
      .filter(exp => {
          const d = normalizeDate(exp.date);
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
          const d = normalizeDate(exp.date);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Finance Tracker</h1>
            <p className="text-sm sm:text-base text-slate-400">Track your expenses and manage your budget</p>
          </div>
          <Dialog open={showAddExpense} onOpenChange={(open) => { setShowAddExpense(open); if (!open) handleCancel(); }}>
            <DialogTrigger asChild>
              <Button
                data-testid="add-expense-button"
                className="bg-amber-600 hover:bg-amber-500 "
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-card border-white/10 w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-200">{editingId ? 'Edit Expense' : 'Log Expense'}</DialogTitle>
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
                    className="bg-bg-card border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                    <SelectTrigger data-testid="expense-category-select" className="bg-bg-card border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border-white/10">
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
                    className="bg-bg-card border-slate-800 text-slate-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="flex-1 bg-amber-600 hover:bg-amber-500">
                    {submitting ? (editingId ? 'Updating...' : 'Adding...') : (editingId ? 'Update Expense' : 'Log Expense')}
                  </Button>
                  <Button type="button" onClick={handleCancel} disabled={submitting} variant="outline" className="flex-1 border-white/10">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <DataCard
            title="This Month"
            value={formatCurrency(monthlyTotal)}
            icon={Wallet}
          />
          <DataCard
            title="Avg Daily Spend"
            value={formatCurrency(monthlyTotal / new Date().getDate())}
            icon={TrendingUp}
          />
          <DataCard
            title="Total Expenses"
            value={expenses.length}
            icon={PieChartIcon}
          />
        </div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
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

            <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl p-6">
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
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Recent Transactions</h2>
          {expenses.length === 0 ? (
            <div className="text-center py-20 bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl">
              <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-slate-400">No expenses logged yet</h3>
              <p className="text-slate-500 mb-6">Start tracking your spending to see insights</p>
              <Button onClick={() => setShowAddExpense(true)} className="bg-amber-600 hover:bg-amber-500">
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Expense
              </Button>
            </div>
          ) : (
            <div className="bg-bg-card backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-card/50">
                    <tr>
                      <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-300">Date</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-300">Category</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-300 hidden sm:table-cell">Description</th>
                      <th className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-right text-xs sm:text-sm font-semibold text-slate-300">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {expenses.slice(0, 15).map(expense => (
                      <tr key={expense.id} data-testid={`expense-${expense.id}`} className="hover:bg-white/5 transition-colors group">
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-400">{formatDate(expense.date)}</td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4">
                          <span
                            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                            style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20`, color: CATEGORY_COLORS[expense.category] }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[expense.category] }} />
                            <span className="hidden sm:inline">{expense.category}</span>
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">{expense.description || '-'}</td>
                        <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs sm:text-sm font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {formatCurrency(expense.amount)}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1 text-slate-500 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
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