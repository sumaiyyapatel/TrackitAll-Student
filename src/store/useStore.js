import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/firebase/config';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// internal update queue to serialize async updates (prevents races when addPoints is called rapidly)
let _updateQueue = Promise.resolve();

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
      
      // Updated to use setDoc with merge instead of updateDoc
      addPoints: (points) => {
        // Chain updates onto the internal _updateQueue so multiple calls serialize
        _updateQueue = _updateQueue.then(async () => {
          const state = get();
          const oldStats = state.userStats;
          const newPoints = (oldStats.points || 0) + points;
          const newLevel = Math.min(Math.floor(newPoints / 100) + 1, 50);

          const newStats = {
            ...oldStats,
            points: newPoints,
            level: newLevel
          };

          // Optimistically update UI
          set({ userStats: newStats });

          if (state.user?.uid) {
            try {
              const userRef = doc(db, 'users', state.user.uid);
              const docSnap = await getDoc(userRef);

              if (!docSnap.exists()) {
                await setDoc(userRef, {
                  uid: state.user.uid,
                  email: state.user.email,
                  displayName: state.user.displayName || state.user.email?.split('@')[0],
                  photoURL: state.user.photoURL,
                  createdAt: new Date().toISOString(),
                  points: newPoints,
                  level: newLevel,
                  badges: state.userStats.badges || [],
                  streaks: state.userStats.streaks || { attendance: 0, mood: 0, health: 0 }
                });
              } else {
                await setDoc(userRef, {
                  points: newPoints,
                  level: newLevel
                }, { merge: true });
              }
            } catch (error) {
              console.error('Error saving points:', error);
              // revert optimistic update on error
              set({ userStats: oldStats });
            }
          }
        }).catch(err => {
          console.error('Queue error in addPoints:', err);
        });

        return _updateQueue;
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
        
        // Persist to Firestore - use setDoc with merge
        if (state.user?.uid) {
          try {
            const userRef = doc(db, 'users', state.user.uid);
            
            // Check if document exists
            const docSnap = await getDoc(userRef);
            
            if (!docSnap.exists()) {
              // Create the document first
              await setDoc(userRef, {
                uid: state.user.uid,
                email: state.user.email,
                displayName: state.user.displayName || state.user.email?.split('@')[0],
                photoURL: state.user.photoURL,
                createdAt: new Date().toISOString(),
                points: state.userStats.points || 0,
                level: state.userStats.level || 1,
                badges: newBadges,
                streaks: state.userStats.streaks || { attendance: 0, mood: 0, health: 0 }
              });
            } else {
              // Document exists, update it
              await setDoc(userRef, {
                badges: newBadges
              }, { merge: true });
            }
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