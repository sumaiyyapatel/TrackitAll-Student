import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import useStore from '@/store/useStore';
import { User, Trophy, Award, LogOut, Mail } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { getLevelProgress, getNextLevelPoints } from '@/utils/gamification';

export default function Profile() {
  const { user, userStats, clearUser } = useStore();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName });
      toast.success('Profile updated!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const levelProgress = getLevelProgress(userStats.points);
  const nextLevelPoints = getNextLevelPoints(userStats.points);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Profile</h1>
          <p className="text-slate-400">Manage your account and view achievements</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center text-white text-4xl font-bold shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Display Name</Label>
                    <Input
                      data-testid="profile-name-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-slate-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="bg-violet-600 hover:bg-violet-500">
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(false)}
                      className="border-white/10 text-slate-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {user?.displayName || 'Student'}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <Button
                    data-testid="edit-profile-button"
                    onClick={() => setEditing(true)}
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-slate-300"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5">
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {userStats.level}
              </div>
              <p className="text-sm text-slate-500">Level</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {userStats.points}
              </div>
              <p className="text-sm text-slate-500">Total XP</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {userStats.badges.length}
              </div>
              <p className="text-sm text-slate-500">Badges</p>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Level Progress</h3>
              <p className="text-sm text-slate-400">Level {userStats.level}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {userStats.points} / {nextLevelPoints}
              </p>
              <p className="text-xs text-slate-500">XP</p>
            </div>
          </div>
          <Progress value={levelProgress} className="h-4" />
          <p className="text-sm text-slate-400 mt-2">
            {nextLevelPoints - userStats.points} XP until level {userStats.level + 1}
          </p>
        </div>

        {/* Badges */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Achievements</h2>
          {userStats.badges.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl">
              <Trophy className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No badges earned yet. Keep logging data to unlock achievements!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userStats.badges.map((badge, index) => (
                <div
                  key={index}
                  data-testid={`profile-badge-${badge.id}`}
                  className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center hover:border-violet-500/30 transition-all"
                >
                  <div className="text-5xl mb-3">{badge.icon || '🏆'}</div>
                  <h4 className="font-semibold mb-1">{badge.name}</h4>
                  <p className="text-xs text-slate-500">{badge.description || 'Achievement unlocked!'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streaks */}
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>Streaks</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">📅</div>
                <div>
                  <h4 className="font-semibold">Attendance</h4>
                  <p className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {userStats.streaks.attendance || 0} days
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">😊</div>
                <div>
                  <h4 className="font-semibold">Mood</h4>
                  <p className="text-2xl font-bold text-cyan-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {userStats.streaks.mood || 0} days
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">💪</div>
                <div>
                  <h4 className="font-semibold">Health</h4>
                  <p className="text-2xl font-bold text-pink-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {userStats.streaks.health || 0} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-rose-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Sign Out</h3>
              <p className="text-sm text-slate-400">Log out of your account</p>
            </div>
            <Button
              data-testid="profile-logout-button"
              onClick={handleLogout}
              variant="outline"
              className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}