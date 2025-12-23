import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set) => ({
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
      addPoints: (points) => set((state) => {
        const newPoints = state.userStats.points + points;
        const newLevel = Math.floor(newPoints / 100) + 1;
        return {
          userStats: {
            ...state.userStats,
            points: newPoints,
            level: Math.min(newLevel, 50)
          }
        };
      }),
      addBadge: (badge) => set((state) => ({
        userStats: {
          ...state.userStats,
          badges: [...state.userStats.badges, { ...badge, timestamp: new Date().toISOString() }]
        }
      })),
      clearUser: () => set({ user: null, userStats: { points: 0, level: 1, badges: [], streaks: { attendance: 0, mood: 0, health: 0 } } })
    }),
    {
      name: 'trackitall-storage'
    }
  )
);

export default useStore;