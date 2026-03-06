import React, { useEffect, useState } from 'react';
import { Droplets, Scale, TrendingUp } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { userRecent } from '@/utils/canonicalQueries';
import { normalizeDate } from '@/utils/dateNormalizer';
import { CATEGORY_THEMES } from '@/utils/categoryColors';

export const WellnessHub = ({ userId }) => {
  const [wellnessData, setWellnessData] = useState({
    waterIntake: 0,
    waterGoal: 8,
    lastWeight: null,
    weightTrend: null,
    lastWeightDate: null
  });

  useEffect(() => {
    if (userId) {
      loadWellnessData();
    }
  }, [userId]);

  const loadWellnessData = async () => {
    try {
      const today = normalizeDate(new Date().toISOString());
      const toDate = normalizeDate;

      // Water tracking
      const waterSnap = await getDocs(userRecent(db, 'water_intake', userId, 30));
      const waterEntries = waterSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const todayWater = waterEntries.filter(w => toDate(w.date) === today).length;

      // Weight tracking
      const weightSnap = await getDocs(userRecent(db, 'weight', userId, 50));
      const weightEntries = weightSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      let trend = null;
      if (weightEntries.length >= 2) {
        const current = weightEntries[0].weight;
        const previous = weightEntries[1].weight;
        trend = current < previous ? 'down' : current > previous ? 'up' : 'stable';
      }

      setWellnessData({
        waterIntake: todayWater,
        waterGoal: 8,
        lastWeight: weightEntries[0]?.weight || null,
        weightTrend: trend,
        lastWeightDate: weightEntries[0]?.date || null
      });
    } catch (error) {
      console.error('Error loading wellness data:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Water Intake Card */}
      <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.health.border} rounded-2xl p-5 ${CATEGORY_THEMES.health.hoverBorder} transition-all`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">Hydration</p>
            <h3 className="mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {wellnessData.waterIntake}/{wellnessData.waterGoal}
            </h3>
            <p className="text-body-sm text-muted-foreground">glasses today</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${CATEGORY_THEMES.health.iconBg} flex items-center justify-center`}>
            <Droplets className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min((wellnessData.waterIntake / wellnessData.waterGoal) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Weight Tracking Card */}
      <div className={`bg-card/50 backdrop-blur-md border ${CATEGORY_THEMES.health.border} rounded-2xl p-5 ${CATEGORY_THEMES.health.hoverBorder} transition-all`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-overline uppercase tracking-widest text-muted-foreground mb-2">Weight</p>
            <h3 className="mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {wellnessData.lastWeight ? `${wellnessData.lastWeight} lbs` : 'No data'}
            </h3>
            <p className="text-body-sm text-muted-foreground">
              {wellnessData.weightTrend === 'down' && '✓ On track'}
              {wellnessData.weightTrend === 'up' && '↑ Slightly up'}
              {wellnessData.weightTrend === 'stable' && '→ Stable'}
              {!wellnessData.weightTrend && 'Log first entry'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${CATEGORY_THEMES.health.iconBg} flex items-center justify-center`}>
            <Scale className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
