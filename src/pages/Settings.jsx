import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import { Settings as SettingsIcon, Download, Upload, Moon, Sun, Bell, Shield, Database } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useStore();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    attendance: true,
    finance: true,
    health: true,
    mood: true,
    goals: true
  });
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const collections = ['attendance', 'expenses', 'health', 'mood_entries', 'goals', 'habits', 'study_sessions'];
      const allData = {};

      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        allData[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Create JSON file
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trackitall-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async (collectionName) => {
    try {
      const q = query(collection(db, collectionName), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());

      if (data.length === 0) {
        toast.error(`No ${collectionName} data to export`);
        return;
      }

      // Convert to CSV
      const headers = Object.keys(data[0]).filter(key => key !== 'userId');
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collectionName}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${collectionName} exported as CSV!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and data</p>
        </div>

        {/* Appearance */}
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 dark:bg-violet-500/20 flex items-center justify-center">
              {theme === 'dark' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: light)').matches) ? (
                <Moon className="w-5 h-5 text-violet-400" />
              ) : (
                <Sun className="w-5 h-5 text-violet-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize how TrackitAll looks</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Notifications</h2>
              <p className="text-sm text-muted-foreground">Manage notification preferences</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Attendance Reminders</Label>
              <Switch
                checked={notifications.attendance}
                onCheckedChange={(checked) => setNotifications({ ...notifications, attendance: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Finance Tracking</Label>
              <Switch
                checked={notifications.finance}
                onCheckedChange={(checked) => setNotifications({ ...notifications, finance: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Health Reminders</Label>
              <Switch
                checked={notifications.health}
                onCheckedChange={(checked) => setNotifications({ ...notifications, health: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mood Check-ins</Label>
              <Switch
                checked={notifications.mood}
                onCheckedChange={(checked) => setNotifications({ ...notifications, mood: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Goal Updates</Label>
              <Switch
                checked={notifications.goals}
                onCheckedChange={(checked) => setNotifications({ ...notifications, goals: checked })}
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Data Management</h2>
              <p className="text-sm text-muted-foreground">Export and backup your data</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Button
                data-testid="export-all-data"
                onClick={handleExportData}
                disabled={exporting}
                className="w-full bg-emerald-600 hover:bg-emerald-500"
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export All Data (JSON)'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Download all your data in JSON format</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => handleExportCSV('attendance')}
                variant="outline"
              >
                Attendance CSV
              </Button>
              <Button
                onClick={() => handleExportCSV('expenses')}
                variant="outline"
              >
                Finance CSV
              </Button>
              <Button
                onClick={() => handleExportCSV('health')}
                variant="outline"
              >
                Health CSV
              </Button>
              <Button
                onClick={() => handleExportCSV('mood_entries')}
                variant="outline"
              >
                Mood CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Privacy & Security</h2>
              <p className="text-sm text-muted-foreground">Manage your data privacy</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-foreground mb-2"><span className="font-semibold">Data Storage:</span> All your data is securely stored in Firebase and encrypted.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-foreground mb-2"><span className="font-semibold">Privacy:</span> Your data is private and only accessible to you.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-foreground mb-2"><span className="font-semibold">Data Deletion:</span> You can delete your account and all data at any time.</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-card/50 backdrop-blur-md border border-border rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>About TrackitAll</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Version: 1.0.0</p>
            <p>Built with React + Firebase</p>
            <p className="pt-4 border-t border-border">TrackitAll helps students track attendance, finances, health, mood, and goals in one beautiful app.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}