import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { RefreshCw, Plus, Calendar, Trash2, Edit2 } from 'lucide-react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/helpers';

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const CATEGORIES = ['Rent', 'Subscriptions', 'Bills', 'Insurance', 'EMI', 'Other'];

export default function RecurringExpenses() {
  const { user } = useStore();
  const [recurring, setRecurring] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRecurring, setNewRecurring] = useState({
    name: '',
    amount: '',
    category: 'Subscriptions',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecurring();
    }
  }, [user]);

  // Track pending deletes so we can cancel them if user clicks Undo
  const pendingDeletes = useRef(new Map());

  useEffect(() => {
    return () => {
      // cleanup any pending timeouts when component unmounts
      pendingDeletes.current.forEach(timeoutId => clearTimeout(timeoutId));
      pendingDeletes.current.clear();
    };
  }, []);

  const loadRecurring = async () => {
    try {
      const recurringQuery = query(
        collection(db, 'recurring_expenses'),
        where('userId', '==', user.uid)
      );
      const recurringSnap = await getDocs(recurringQuery);
      const data = recurringSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecurring(data);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
      toast.error('Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecurring = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'recurring_expenses'), {
        ...newRecurring,
        amount: parseFloat(newRecurring.amount),
        userId: user.uid,
        createdAt: new Date().toISOString(),
        lastProcessed: null
      });
      toast.success('Recurring expense added!');
      setShowAdd(false);
      setNewRecurring({ name: '', amount: '', category: 'Subscriptions', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0] });
      loadRecurring();
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      toast.error('Failed to add recurring expense');
    }
  };

  const resetForm = () => {
    setNewRecurring({ name: '', amount: '', category: 'Subscriptions', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setShowAdd(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newRecurring.name,
        amount: parseFloat(newRecurring.amount),
        category: newRecurring.category,
        frequency: newRecurring.frequency,
        startDate: newRecurring.startDate,
        userId: user.uid
      };

      if (editingId) {
        // update existing
        await updateDoc(doc(db, 'recurring_expenses', editingId), payload);
        toast.success('Recurring expense updated!');
      } else {
        // add new
        await addDoc(collection(db, 'recurring_expenses'), {
          ...payload,
          createdAt: new Date().toISOString(),
          lastProcessed: null
        });
        toast.success('Recurring expense added!');
      }

      resetForm();
      loadRecurring();
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      toast.error('Failed to save recurring expense');
    }
  };

  const handleDelete = async (id) => {
    const itemToDelete = recurring.find(r => r.id === id);
    if (!itemToDelete) return;

    // Optimistic update: remove from UI immediately
    setRecurring(prev => prev.filter(r => r.id !== id));

    // Show undo toast
    toast.success('Recurring expense deleted', {
      action: {
        label: 'Undo',
        onClick: async () => {
          // If a delete is pending, cancel it and restore the item
          const timeoutId = pendingDeletes.current.get(id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            pendingDeletes.current.delete(id);
          }

          try {
            // Restore using the original document ID so item appears as before
            const payload = { ...itemToDelete };
            delete payload.id;
            await setDoc(doc(db, 'recurring_expenses', id), payload);
            // Re-insert into local state so UI updates instantly
            setRecurring(prev => [ { id, ...payload }, ...prev ]);
            toast.success('Recurring expense restored');
          } catch (err) {
            console.error('Error restoring recurring expense:', err);
            toast.error('Failed to restore');
            // As a fallback, reload from server
            loadRecurring();
          }
        }
      },
      duration: 5000
    });

    // Schedule actual delete after duration (matches toast duration)
    const timeoutId = setTimeout(async () => {
      try {
        await deleteDoc(doc(db, 'recurring_expenses', id));
        // If deletion completes, remove from pending map
        pendingDeletes.current.delete(id);
      } catch (err) {
        console.error('Error deleting recurring expense:', err);
        toast.error('Failed to delete');
        // reload to sync UI with backend
        loadRecurring();
      }
    }, 5000);

    // store timeout so Undo can cancel it
    pendingDeletes.current.set(id, timeoutId);
  };

  const getMonthlyTotal = () => {
    return recurring.reduce((sum, exp) => {
      let monthlyAmount = exp.amount;
      if (exp.frequency === 'daily') monthlyAmount = exp.amount * 30;
      else if (exp.frequency === 'weekly') monthlyAmount = exp.amount * 4;
      else if (exp.frequency === 'yearly') monthlyAmount = exp.amount / 12;
      return sum + monthlyAmount;
    }, 0);
  };

  const getYearlyTotal = () => getMonthlyTotal() * 12;

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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Recurring Expenses</h1>
            <p className="text-slate-400">Manage your subscriptions and recurring bills</p>
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button data-testid="add-recurring-button" className="bg-amber-600 hover:bg-amber-500" onClick={() => { setEditingId(null); setNewRecurring({ name: '', amount: '', category: 'Subscriptions', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0] }); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Recurring
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Add Recurring Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Name</Label>
                  <Input
                    data-testid="recurring-name-input"
                    value={newRecurring.name}
                    onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                    required
                    placeholder="Netflix Subscription"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                    required
                    placeholder="499"
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <Select value={newRecurring.category} onValueChange={(val) => setNewRecurring({ ...newRecurring, category: val })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Frequency</Label>
                  <Select value={newRecurring.frequency} onValueChange={(val) => setNewRecurring({ ...newRecurring, frequency: val })}>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      {FREQUENCIES.map(freq => (
                        <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Start Date</Label>
                  <Input
                    type="date"
                    value={newRecurring.startDate}
                    onChange={(e) => setNewRecurring({ ...newRecurring, startDate: e.target.value })}
                    required
                    className="bg-slate-950 border-slate-800 text-slate-200"
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500">
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                  <Button type="button" onClick={resetForm} className="flex-1 bg-slate-700">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Monthly Total</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatCurrency(getMonthlyTotal())}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">recurring expenses</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Yearly Total</p>
                <h3 className="text-4xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {formatCurrency(getYearlyTotal())}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600 to-rose-500 flex items-center justify-center shadow-lg">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500">annual commitment</p>
          </div>
        </div>

        {/* Recurring List */}
        {recurring.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center">
            <RefreshCw className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-slate-400">No recurring expenses</h3>
            <p className="text-slate-500 mb-6">Add subscriptions and bills to track automatically</p>
            <Button onClick={() => setShowAdd(true)} className="bg-amber-600 hover:bg-amber-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Recurring Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Your Recurring Expenses</h2>
            {recurring.map(exp => {
              let monthlyAmount = exp.amount;
              if (exp.frequency === 'daily') monthlyAmount = exp.amount * 30;
              else if (exp.frequency === 'weekly') monthlyAmount = exp.amount * 4;
              else if (exp.frequency === 'yearly') monthlyAmount = exp.amount / 12;

              return (
                <div
                  key={exp.id}
                  data-testid={`recurring-${exp.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {exp.name}
                        </h3>
                        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                          {exp.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          {FREQUENCIES.find(f => f.value === exp.frequency)?.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Since {new Date(exp.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-start gap-4">
                      <div>
                        <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatCurrency(exp.amount)}
                        </p>
                        <p className="text-xs text-slate-500">per {exp.frequency.replace('ly', '')}</p>
                        {exp.frequency !== 'monthly' && (
                          <p className="text-xs text-slate-400 mt-1">
                            {formatCurrency(monthlyAmount)}/month
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // open dialog in edit mode
                          setEditingId(exp.id);
                          setNewRecurring({
                            name: exp.name || '',
                            amount: (exp.amount ?? '').toString(),
                            category: exp.category || 'Subscriptions',
                            frequency: exp.frequency || 'monthly',
                            startDate: exp.startDate || new Date().toISOString().split('T')[0]
                          });
                          setShowAdd(true);
                        }}
                        className="border-slate-600 text-slate-200 hover:bg-slate-700/10"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(exp.id)}
                        className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}