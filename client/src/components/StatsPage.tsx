import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Award, Calendar, Target } from 'lucide-react';
import { getWeekSummary, getWeeklyStats, getAchievements, checkAndUnlockAchievements } from '../services/dataService';

export function StatsPage() {
  const [weekSummary, setWeekSummary] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);

  useEffect(() => {
    // Using a try-catch block to prevent crashes if data services fail
    try {
      const summary = getWeekSummary();
      const achs = getAchievements();
      
      setWeekSummary(summary);
      setAchievements(achs || []);
    } catch (error) {
      console.error("Error loading stats data:", error);
      // Set to default empty state on error
      setWeekSummary(null);
      setAchievements([]);
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl">数据统计</h1>
        <p className="text-slate-400">追踪你的进步</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">本周总计</span>
          </div>
          <p className="text-white text-xl">{weekSummary?.totalCalories || 0}</p>
          <p className="text-xs text-slate-400">卡路里</p>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">活跃天数</span>
          </div>
          <p className="text-white text-xl">{weekSummary?.totalWorkouts || 0} / 7</p>
          <p className="text-xs text-slate-400">本周</p>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">平均时长</span>
          </div>
          <p className="text-white text-xl">{Math.round(weekSummary?.avgMinutesPerDay || 0)}</p>
          <p className="text-xs text-slate-400">分钟/天</p>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-slate-400">成就</span>
          </div>
          <p className="text-white text-xl">{achievements.filter(a => a.unlocked).length}</p>
          <p className="text-xs text-slate-400">已解锁</p>
        </Card>
      </div>

      {/* Placeholder for charts and other content */}
      <div className="text-center text-slate-500 pt-8">
        <p>图表功能正在逐步恢复中...</p>
      </div>
    </div>
  );
}
