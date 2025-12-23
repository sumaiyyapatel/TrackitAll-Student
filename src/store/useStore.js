import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const useStore = create(
  persist(
    (set, get) => ({
      user: null,
      userStats: {
        points: 0,
        level: 1,
        badges: [],
        streaks: {
          attendance: 0,
          mood: 0,
          health: 0
        }
      },
      setUser: (user) => set({ user }),
      setUserStats: (stats) => set({ userStats: stats }),
      
      // Updated to persist to Firestore
      addPoints: async (points) => {
        const state = get();
        const newPoints = state.userStats.points + points;
        const newLevel = Math.min(Math.floor(newPoints / 100) + 1, 50);
        
        const newStats = {
          ...state.userStats,
          points: newPoints,
          level: newLevel
        };
        
        set({ userStats: newStats });
        
        // Persist to Firestore
        if (state.user?.uid) {
          try {
            const userRef = doc(db, 'users', state.user.uid);
            await updateDoc(userRef, {
              points: newPoints,
              level: newLevel
            });
          } catch (error) {
            console.error('Error saving points to Firestore:', error);
          }
        }
      },
      
      addBadge: async (badge) => {
        const state = get();
        const newBadge = { 
          ...badge, 
          timestamp: new Date().toISOString() 
        };
        
        const newBadges = [...state.userStats.badges, newBadge];
        set({
          userStats: {
            ...state.userStats,
            badges: newBadges
          }
        });
        
        // Persist to Firestore
        if (state.user?.uid) {
          try {
            const userRef = doc(db, 'users', state.user.uid);
            await updateDoc(userRef, {
              badges: newBadges
            });
          } catch (error) {
            console.error('Error saving badge to Firestore:', error);
          }
        }
      },
      
      clearUser: () => set({ 
        user: null, 
        userStats: { 
          points: 0, 
          level: 1, 
          badges: [], 
          streaks: { attendance: 0, mood: 0, health: 0 } 
        } 
      })
    }),
    {
      name: 'trackitall-storage'
    }
  )
);

export default useStore;