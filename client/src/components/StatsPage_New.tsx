import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Award, Calendar, Target } from 'lucide-react';

export function StatsPage() {
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
          <p className="text-white text-xl">0</p>
          <p className="text-xs text-slate-400">卡路里</p>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-slate-400">活跃天数</span>
          </div>
          <p className="text-white text-xl">0 / 7</p>
          <p className="text-xs text-slate-400">本周</p>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-slate-400">平均时长</span>
          </div>
          <p className="text-white text-xl">0</p>
          <p className="text-xs text-slate-400">分钟/天</p>
        </Card>
        <Card className="bg-slate-800/50 border-purple-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-slate-400">成就</span>
          </div>
          <p className="text-white text-xl">0</p>
          <p className="text-xs text-slate-400">已解锁</p>
        </Card>
      </div>

      {/* Weekly Calories Chart */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white">本周卡路里</h2>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            7天
          </Badge>
        </div>
        <div className="h-48 flex items-center justify-center text-slate-400">
          暂无数据，开始训练后查看统计
        </div>
      </Card>

      {/* Monthly Progress */}
      <Card className="bg-slate-800/50 border-purple-500/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-white">本月训练次数</h2>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
            4周
          </Badge>
        </div>
        <div className="h-44 flex items-center justify-center text-slate-400">
          暂无数据，开始训练后查看统计
        </div>
      </Card>

      {/* Achievements */}
      <div className="space-y-3">
        <h2 className="text-white">成就徽章</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 text-center text-slate-400 py-8">
            暂无成就，完成训练解锁徽章
          </div>
        </div>
      </div>
    </div>
  );
}