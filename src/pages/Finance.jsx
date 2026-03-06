import React, { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { SectionHeader } from '@/components/SectionHeader';
import useStore from '@/store/useStore';
import { Wallet, Plus, TrendingUp, X, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';
import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { ExpenseForm } from '@/components/forms/ExpenseForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { normalizeDate } from '@/utils/dateNormalizer';
import { POINTS } from '@/utils/gamification';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { expenseSchema, transactionSchema, validateFormData } from '@/utils/validation';
import { CATEGORY_THEMES } from '@/utils/categoryColors';
import { SmartInsights } from '@/components/SmartInsights';
import { TimePeriodFilter, getPeriodStartDate } from '@/components/TimePeriodFilter';
import { DataExport, EXPORT_COLUMNS } from '@/components/DataExport';
import { XPProgressBar } from '@/components/GamificationWidgets';
import { FinanceSkeleton } from '@/components/SkeletonScreens';

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
    type: 'expense',
    category: 'Food',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('month');
  const [timePeriod, setTimePeriod] = useState('month');
  const [periodStart, setPeriodStart] = useState(() => getPeriodStartDate('month'));

  const handlePeriodChange = useCallback((key, start) => {
    setTimePeriod(key);
    setPeriodStart(start);
  }, []);

  useEffect(() => {
    if (user) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = async () => {
    try {
      const expensesSnap = await getDocs(userRecent(db, 'expenses', user.uid, 200));
      const expensesData = expensesSnap.docs.map(doc => ({ 
        id: doc.id, 
        type: 'expense', // Default for legacy data
        ...doc.data() 
      }));
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
        type: newExpense.type || 'expense',
        category: newExpense.category,
        description: newExpense.description
      },
      transactionSchema
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
          type: newExpense.type || 'expense',
          category: newExpense.category,
          description: newExpense.description
        });
        toast.success('Transaction updated');
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...newExpense,
          amount: parseFloat(newExpense.amount),
          type: newExpense.type || 'expense',
          date: serverTimestamp(),
          userId: user.uid
        });
        addPoints(POINTS.LOG_EXPENSE);
        toast.success(`+${POINTS.LOG_EXPENSE} XP! Transaction logged`);
      }
      setShowAddExpense(false);
      setEditingId(null);
      setNewExpense({ amount: '', type: 'expense', category: 'Food', description: '' });
      loadExpenses();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    // Optimistic UI: remove immediately
    const previousExpenses = expenses;
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
      // Revert on error
      setExpenses(previousExpenses);
    }
  };

  const handleCancel = () => {
    setShowAddExpense(false);
    setEditingId(null);
    setNewExpense({ amount: '', type: 'expense', category: 'Food', description: '' });
  };

  const getMonthlyStats = () => {
    return expenses
      .filter(exp => {
        const d = normalizeDate(exp.date);
        return d && d >= periodStart;
      })
      .reduce((acc, exp) => {
        const type = exp.type || 'expense';
        if (type === 'income') {
          acc.income += exp.amount;
        } else {
          acc.expenses += exp.amount;
        }
        return acc;
      }, { income: 0, expenses: 0 });
  };

  const getChartData = () => {
    const categoryTotals = {};

    expenses
      .filter(exp => {
        const d = normalizeDate(exp.date);
        return d && d >= periodStart && (exp.type === 'expense' || !exp.type);
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

  const { income: monthlyIncome, expenses: monthlyExpenses } = getMonthlyStats();
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const monthlyTotal = monthlyExpenses;
  const chartData = getChartData();

  if (loading) {
    return (
      <Layout>
        <FinanceSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-container mx-auto space-y-8">
        {/* XP Progress */}
        <XPProgressBar className="animate-slide-up" />

        {/* Smart Insights */}
        <SmartInsights data={expenses} type="finance" />

        {/* Hero Section */}
        <div className={`bg-gradient-to-br ${CATEGORY_THEMES.finance.gradient} rounded-2xl p-8 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-amber-100 text-sm uppercase tracking-wider font-semibold">Monthly Spending</p>
              <h1 className="text-5xl font-bold mt-1">{formatCurrency(monthlyTotal)}</h1>
            </div>
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <div className="flex items-center gap-3">
            <Button 
              onClick={() => setShowAddExpense(true)}
              className="bg-white text-orange-600 hover:bg-amber-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
            <VoiceInput
              onResult={(parsed) => {
                setNewExpense({
                  amount: parsed.amount,
                  category: parsed.category,
                  description: parsed.description
                });
                setShowAddExpense(true);
              }}
              buttonText="Voice"
            />
          </div>
          </div>
        </div>

        {/* Tabbed Chart Section */}
        <CollapsibleSection
          title="Spending Overview"
          icon={BarChart3}
          summary={`${chartData.length} categories this month`}
          defaultOpen={true}
          borderColor={CATEGORY_THEMES.finance.border}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <TimePeriodFilter value={timePeriod} onChange={handlePeriodChange} />
            <DataExport data={expenses} columns={EXPORT_COLUMNS.expenses} title="Expenses" />
          </div>
          <Tabs defaultValue="month" onValueChange={setActiveTab}>
            <div className="flex items-center justify-end mb-6">
              <TabsList className="bg-muted">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={activeTab} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CollapsibleSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6\">
          {/* Category Breakdown Accordion */}
          <div className="lg:col-span-1">
            <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.finance.border} rounded-2xl p-6`}>
              <SectionHeader title="Categories" level="subsection" />
              <Accordion type="single" collapsible className="w-full">
                {chartData.map((cat, idx) => (
                  <AccordionItem key={cat.name} value={`item-${idx}`} className="border-border">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{formatCurrency(cat.value)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-6 space-y-2">
                        {expenses
                          .filter(e => e.category === cat.name && normalizeDate(e.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
                          .slice(0, 3)
                          .map(e => (
                            <div key={e.id} className="flex justify-between text-xs text-muted-foreground">
                              <span>{e.description || 'No description'}</span>
                              <span>{formatCurrency(e.amount)}</span>
                            </div>
                          ))
                        }
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Recent Expenses - Limited to 5 */}
          <div className="lg:col-span-2">
            <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.finance.border} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Recent Transactions" level="subsection" className="mb-0" />
                <Button variant="ghost" size="sm" className="text-xs text-violet-400">View All</Button>
              </div>
              <div className="space-y-4" role="list" aria-label="Recent transactions">
                {expenses.slice(0, 5).map(expense => (
                  <div key={expense.id} role="listitem" className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group" aria-label={`${expense.description || expense.category}: ${formatCurrency(expense.amount)}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20`, color: CATEGORY_COLORS[expense.category] }}>
                        <PieChartIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{expense.description || expense.category}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold">{formatCurrency(expense.amount)}</span>
                      <button 
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-all focus-visible:opacity-100"
                        aria-label={`Delete ${expense.description || expense.category} transaction`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">No recent transactions</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ResponsiveDialog
        isOpen={showAddExpense}
        setIsOpen={(open) => { setShowAddExpense(open); if (!open) handleCancel(); }}
        title={editingId ? 'Edit Expense' : 'Log Expense'}
        description={editingId ? 'Update your expense details' : 'Keep track of your spending'}
      >
        <ExpenseForm
          newExpense={newExpense}
          setNewExpense={setNewExpense}
          categories={CATEGORIES}
          onSubmit={handleAddExpense}
          onCancel={handleCancel}
          submitting={submitting}
          isEditing={!!editingId}
        />
      </ResponsiveDialog>
    </Layout>
  );
}
