import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Flame, Target, Clock, Zap, Play, CheckCircle, Dumbbell, Pause, Square, ChevronLeft } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getTodayStats, getWeekSummary, getWorkoutRecords, addWorkoutRecord, getCurrentAIPlan } from '../services/dataService';
import { getCurrentUser } from '../services/authService';

export function HomePage() {
  const [todayStats, setTodayStats] = useState<any>(null);
  const [weekSummary, setWeekSummary] = useState<any>(null);
  const [workoutRecords, setWorkoutRecords] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [todayWorkouts, setTodayWorkouts] = useState<any[]>([]);
  
  // 详情弹窗状态
  const [showDetail, setShowDetail] = useState(false);
  const [detailPlan, setDetailPlan] = useState<any>(null);

  // ⏱️ 倒计时训练状态
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // 秒
  const [totalTime, setTotalTime] = useState(0); // 秒
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 翻译字典
  const levelMap: Record<string, string> = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级',
  };

  // 数据加载逻辑
  const loadData = () => {
    const stats = getTodayStats();
    const week = getWeekSummary();
    const records = getWorkoutRecords();
    const user = getCurrentUser();
    
    setTodayStats(stats);
    setWeekSummary(week);
    setWorkoutRecords(records);
    setCurrentUser(user);

    const aiPlan = getCurrentAIPlan();
    if (aiPlan && aiPlan.workouts) {
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const todayIndex = new Date().getDay();
        const todayStr = weekDays[todayIndex];
        
        const todaysPlans = aiPlan.workouts.filter((w: any) => 
          w.day === todayStr && w.duration !== '0' && w.name !== '休息'
        );
        
        if (todaysPlans.length > 0) {
            const formattedWorkouts = todaysPlans.map((planItem: any, index: number) => {
              const isCompleted = records.some((r: any) => 
                  r.date === new Date().toISOString().split('T')[0] && 
                  r.title === planItem.name
              );

              return {
                  id: `plan-${todayStr}-${index}`,
                  title: planItem.name,
                  category: 'custom',
                  level: aiPlan.level, 
                  duration: planItem.duration,
                  calories: '约300 kcal', 
                  exercises: planItem.exercises || [],
                  image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=1080', 
                  completed: isCompleted,
                  time: planItem.time || '全天',
                  sortTime: planItem.time || '23:59'
              };
            });
            formattedWorkouts.sort((a: any, b: any) => a.sortTime.localeCompare(b.sortTime));
            setTodayWorkouts(formattedWorkouts);
        } else {
            setTodayWorkouts([]);
        }
    } else {
        setTodayWorkouts([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('planUpdated', loadData);
    return () => {
      window.removeEventListener('planUpdated', loadData);
    };
  }, []);

  // ⏱️ 倒计时逻辑
  useEffect(() => {
    if (isTraining && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTraining) {
      // 时间到，自动完成
      finishTraining();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTraining, isPaused, timeLeft]);

  const handleViewDetail = (workout: any) => {
    setDetailPlan(workout);
    setShowDetail(true);
  };

  // ▶️ 开始训练：进入倒计时模式
  const startTraining = () => {
    if (!detailPlan) return;
    setShowDetail(false); // 关闭详情弹窗

    // 解析时长 (例如 "30分钟" -> 1800秒)
    const durationStr = detailPlan.duration || "30";
    const durationMatch = durationStr.match(/(\d+)/);
    const minutes = durationMatch ? parseInt(durationMatch[0]) : 30;
    
    // 为了演示方便，如果是测试环境可以设为 10秒，正式环境设为 minutes * 60
    const seconds = minutes * 60; 
    
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setIsTraining(true);
    setIsPaused(false);
  };

  // ⏹️ 结束/完成训练：保存数据
  const finishTraining = () => {
    if (!detailPlan) return;
    
    // 停止计时
    setIsTraining(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // 计算实际完成时长 (分钟)
    const durationMinutes = Math.ceil((totalTime - timeLeft) / 60);
    // 如果练了不到1分钟，记为1分钟
    const actualDuration = Math.max(1, durationMinutes);

    // 记录数据
    addWorkoutRecord({
      date: new Date().toISOString().split('T')[0],
      type: detailPlan.category || 'general',
      duration: actualDuration,
      calories: 300, // 简单估算，或者按比例计算
      title: detailPlan.title,
      exercises: detailPlan.exercises || [],
      completed: true,
      notes: `实际训练时长：${actualDuration} 分钟`,
    });
    
    // 刷新UI
    loadData();
    
    // 更新今日列表状态
    setTodayWorkouts(prev => prev.map(w => 
      w.id === detailPlan.id ? { ...w, completed: true } : w
    ));
  };

  // 格式化时间 mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const dailyStats = [
    { icon: Flame, label: '卡路里', value: (todayStats?.calories || 0).toString(), target: '600', unit: 'kcal', progress: Math.min(100, ((todayStats?.calories || 0) / 600) * 100) },
    { icon: Target, label: '步数', value: (todayStats?.steps || 0).toLocaleString(), target: '10,000', unit: '步', progress: Math.min(100, ((todayStats?.steps || 0) / 10000) * 100) },
    { icon: Clock, label: '活动时间', value: (todayStats?.activeMinutes || 0).toString(), target: '60', unit: '分钟', progress: Math.min(100, ((todayStats?.activeMinutes || 0) / 60) * 100) },
    { icon: Zap, label: '活跃度', value: (todayStats?.workoutCount || 0).toString(), target: '3', unit: '次', progress: Math.min(100, ((todayStats?.workoutCount || 0) / 3) * 100) },
  ];

  // 🟢 渲染训练中全屏界面
  if (isTraining) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="text-center space-y-8 w-full max-w-md">
          <div className="space-y-2">
            <h2 className="text-purple-400 text-lg font-medium">正在训练</h2>
            <h1 className="text-white text-3xl font-bold">{detailPlan?.title}</h1>
          </div>

          {/* 倒计时圆环 (简单的 CSS 实现) */}
          <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-8 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-8 border-purple-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
            <div className="text-6xl font-mono font-bold text-white z-10">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>进度</span>
              <span>{Math.round(((totalTime - timeLeft) / totalTime) * 100)}%</span>
            </div>
            <Progress value={((totalTime - timeLeft) / totalTime) * 100} className="h-2" />
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-4 justify-center mt-8">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setIsPaused(!isPaused)} 
              className="w-16 h-16 rounded-full border-2 border-slate-500 bg-slate-800 hover:bg-slate-700 text-white p-0"
            >
              {isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6 fill-white" />}
            </Button>
            
            <Button 
              variant="destructive" 
              size="lg"
              onClick={finishTraining}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/50 p-0"
            >
              <Square className="w-6 h-6 fill-white" />
            </Button>
          </div>
          
          <p className="text-slate-500 text-sm mt-4">
            {isPaused ? '已暂停' : '坚持住，你正在变得更强！💪'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div><p className="text-slate-400">欢迎回来</p><h1 className="text-white text-2xl">{currentUser?.isGuest ? '' : (currentUser?.name || '')}</h1></div>
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center"><span className="text-white">{currentUser?.avatar || (currentUser?.name?.charAt(0) || '')}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {dailyStats.map((stat, index) => (
          <Card key={index} className="bg-slate-800/50 border-purple-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between"><stat.icon className="w-5 h-5 text-purple-400" /><span className="text-xs text-slate-400">{stat.label}</span></div>
            <div className="space-y-1"><p className="text-white">{stat.value}<span className="text-xs text-slate-400 ml-1">/ {stat.target}</span></p><Progress value={stat.progress} className="h-1.5 bg-slate-700" /></div>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2"><h2 className="text-white text-lg font-semibold">AI 定制健身计划</h2><p className="text-purple-200 text-sm">让AI为您量身打造专属训练和饮食计划。</p></div>
          <button onClick={() => { (window as any).dispatchEvent(new CustomEvent('changeTab', { detail: 'workout' })); setTimeout(() => { (window as any).dispatchEvent(new CustomEvent('openAIPlanDialog')); }, 100); }} className="bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-4 rounded-lg">立即开始</button>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-white">今日计划</h2><Badge variant="secondary" className="bg-purple-500/20 text-purple-300">{todayWorkouts.length} 项活动</Badge></div>
        
        <div className="space-y-3">
          {todayWorkouts.length > 0 ? (
            todayWorkouts.map((workout) => (
              <Card key={workout.id} className="bg-slate-800/50 border-purple-500/20 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => handleViewDetail(workout)}
              >
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <ImageWithFallback src={workout.image} alt={workout.title} className="w-full h-full object-cover" />
                    {workout.completed && (<div className="absolute inset-0 bg-green-500/80 flex items-center justify-center"><div className="w-8 h-8 bg-white rounded-full flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-500" /></div></div>)}
                  </div>
                  <div className="flex-1 py-3 pr-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white">{workout.title}</h3>
                        {workout.time !== '全天' && <span className="text-xs text-purple-400 flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> {workout.time}</span>}
                      </div>
                      {/* ✅ 修复：使用 levelMap 翻译 beginner */}
                      <span className="text-xs text-slate-400">{levelMap[workout.level] || workout.level}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400"><span>{workout.duration}</span><span>·</span><span>{workout.calories}</span></div>
                    <div className="text-xs text-purple-400 flex items-center gap-1">点击查看详情 <Play className="w-3 h-3 ml-1" /></div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8 text-sm"><p>今天暂无训练计划，好好休息一下吧 🍵</p></div>
          )}
        </div>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="w-full max-w-lg max-h-[85vh] flex flex-col bg-slate-900 border-purple-500/30 text-white p-0 gap-0">
          <div className="p-6 pb-4 border-b border-purple-500/20 shrink-0">
            <DialogHeader><DialogTitle className="text-white text-2xl">{detailPlan?.title}</DialogTitle></DialogHeader>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {detailPlan?.duration}</span>
              <span className="flex items-center gap-1"><Flame className="w-4 h-4" /> {detailPlan?.calories}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
             <h4 className="font-semibold text-white flex items-center gap-2"><Dumbbell className="w-5 h-5 text-purple-400" /> 动作列表</h4>
             <div className="space-y-3">
              {detailPlan?.exercises?.map((ex: any, idx: number) => (
                <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <div className="font-medium text-white mb-1">{ex.name || ex}</div>
                  {ex.sets && (<div className="flex gap-4 text-xs text-slate-400"><span>{ex.sets} 组</span><span>{ex.reps}</span><span>休息: {ex.rest}</span></div>)}
                </div>
              ))}
             </div>
          </div>
          <div className="p-6 pt-4 border-t border-purple-500/20 bg-slate-900 shrink-0 flex gap-3">
            <Button variant="outline" onClick={() => setShowDetail(false)} className="flex-1 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">关闭</Button>
            {!detailPlan?.completed ? (
              // ✅ 修复：点击开始进入倒计时，而不是直接完成
              <Button onClick={startTraining} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg">开始训练</Button>
            ) : (
               <Button disabled className="flex-1 bg-green-600/20 text-green-400 border border-green-600/50"><CheckCircle className="w-4 h-4 mr-2" /> 已完成</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}