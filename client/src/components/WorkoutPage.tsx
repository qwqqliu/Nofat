import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Clock, Flame, Play, Sparkles, Target, TrendingUp, Calendar, Dumbbell, X, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { API_BASE_URL } from '../services/config';
import { generateAIWorkoutPlan } from '../services/aiService';
import { 
  getCurrentAIPlan as getLocalPlan, 
  setCurrentAIPlan as saveLocalPlan, 
  clearCurrentAIPlan as clearLocalPlan,
  getUserProfile 
} from '../services/dataService';
import { getCurrentUser } from '../services/authService';

export function WorkoutPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiStep, setAiStep] = useState<'form' | 'loading' | 'result'>('form');
  const [currentAIPlan, setCurrentAIPlan] = useState<any>(null);
  
  // 翻译映射表
  const levelMap: Record<string, string> = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级',
  };

  // AI 表单数据
  const [formData, setFormData] = useState({
    age: 0,
    gender: 'male',
    height: 0,
    weight: 0,
    waistCircumference: 0,
    goal: '',
    level: '',
    duration: '',
    preference: '',
    injuryHistory: '',
    notes: '',
    selectedDays: [] as string[], 
    preferredTime: '07:00'
  });

  // 预设计划的时间选择数据
  const [presetSchedule, setPresetSchedule] = useState({
    selectedDays: [] as string[],
    preferredTime: '07:00'
  });
  
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlanDetail, setShowPlanDetail] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // 标准周列表
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  // AI 表单日期切换
  const toggleDay = (day: string) => {
    const currentDays = formData.selectedDays || []; 
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    const sortedDays = weekDays.filter(d => newDays.includes(d));
    setFormData({ ...formData, selectedDays: sortedDays });
  };

  // 预设计划日期切换
  const togglePresetDay = (day: string) => {
    const currentDays = presetSchedule.selectedDays || []; 
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    const sortedDays = weekDays.filter(d => newDays.includes(d));
    setPresetSchedule({ ...presetSchedule, selectedDays: sortedDays });
  };

  // 优先从云端加载计划
  useEffect(() => {
    const fetchPlan = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/plans`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
          if (res.ok) {
            const data = await res.json();
            if (data.plans && data.plans.length > 0) {
              const latestPlan = data.plans[0].planData; 
              setCurrentAIPlan(latestPlan);
              saveLocalPlan(latestPlan); // 同步到本地
              return; 
            }
          }
        } catch (error) {
          console.error('获取云端计划失败:', error);
        }
      }
      const saved = getLocalPlan();
      if (saved) {
        setCurrentAIPlan(saved);
      }
    };
    fetchPlan();
  }, []);

  // 监听首页跳转指令
  useEffect(() => {
    const handleOpenSignal = () => {
      handleAIClick(); 
    };
    window.addEventListener('openAIPlanDialog', handleOpenSignal);
    return () => {
      window.removeEventListener('openAIPlanDialog', handleOpenSignal);
    };
  }, []);

  // 核心函数：保存计划到云端和本地
  const savePlanToSystem = async (plan: any) => {
    setCurrentAIPlan(plan);
    setGeneratedPlan(plan);
    saveLocalPlan(plan);

    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: plan.name,
            goal: plan.goal?.name || plan.name,
            level: plan.level,
            frequency: plan.frequency,
            duration: plan.duration,
            planData: plan
          })
        });
      } catch (e) {
        console.error("保存到云端失败", e);
      }
    }
    // 通知首页刷新
    window.dispatchEvent(new Event('planUpdated'));
  };

  // 核心函数：构建周计划
  const buildWeeklyPlan = (basePlan: any, selectedDays: string[], time: string, isAI: boolean = false) => {
    const fullWorkouts = weekDays.map(day => {
      if (selectedDays.includes(day)) {
        if (isAI) {
          // AI 模式
          const aiDay = basePlan.workouts.find((w: any) => w.day === day);
          return aiDay ? { ...aiDay, day, time } : { 
             day, 
             time, 
             name: basePlan.name || '训练日', 
             duration: basePlan.duration, 
             exercises: basePlan.workouts[0]?.exercises || [] 
          };
        } else {
          // 预设模式
          return {
            day,
            time,
            name: basePlan.title,
            duration: basePlan.duration,
            exercises: basePlan.details.map((d: any) => ({
              name: d.name,
              sets: d.sets || '1组',
              reps: d.reps || d.duration,
              rest: d.rest || '无'
            }))
          };
        }
      } else {
        // AI 模式需要生成休息日占位，预设模式不需要
        return isAI ? { day, name: '休息', duration: '0', exercises: [] } : null;
      }
    }).filter(Boolean);

    return {
      ...basePlan,
      frequency: `${selectedDays.join(' ')} ${time}`,
      workouts: fullWorkouts
    };
  };

  // 提交 AI 表单
  const handleFormSubmit = async () => {
    setAiError(null);
    setIsGenerating(true);
    setAiStep('loading');
    
    try {
      // 👇 双重保险获取名字
      const userProfile = getUserProfile(); // 这是我们刚才修改过的 dataService
      const authUser = getCurrentUser();    // 这是 authService
      
      // 优先取 authUser 的名字，确保是注册时的昵称
      const finalName = authUser?.name || userProfile?.name || '专属用户';

      const aiRequestData = {
        ...formData,
        name: finalName, // 👈 确保这里传进去的是有值的
        frequency: `每周 ${formData.selectedDays.length} 天：[${formData.selectedDays.join('、')}]，时间：${formData.preferredTime}`
      };
      // 👆👆👆 修改结束 👆👆👆

      let plan = await generateAIWorkoutPlan(aiRequestData);
      
      // 清洗数据并添加时间
      plan = buildWeeklyPlan(plan, formData.selectedDays, formData.preferredTime, true);
      
      await savePlanToSystem(plan);
      setAiStep('result');
    } catch (error) {
      console.error('生成计划失败:', error);
      setAiError('生成计划失败，请稍后重试');
      setAiStep('form');
    } finally {
      setIsGenerating(false);
    }
  };

  // 激活预设计划（追加模式）
  const activatePresetPlan = async () => {
    if (!selectedPlan || presetSchedule.selectedDays.length === 0) return;

    const newPlanStruct = buildWeeklyPlan(
      selectedPlan, 
      presetSchedule.selectedDays, 
      presetSchedule.preferredTime, 
      false
    );

    // 获取当前已有计划，如果没有则新建
    let finalPlan = currentAIPlan ? { ...currentAIPlan } : {
      name: '我的健身计划',
      level: selectedPlan.level,
      goal: { name: '综合训练' },
      duration: '多变',
      frequency: '自定义',
      workouts: [],
      tips: []
    };

    // 追加 Workouts
    const newWorkouts = newPlanStruct.workouts || [];
    if (!finalPlan.workouts) finalPlan.workouts = [];
    finalPlan.workouts = [...finalPlan.workouts, ...newWorkouts];

    // 如果之前没有名字，用这个名字
    if (!finalPlan.name || finalPlan.name === 'AI 定制计划') {
        finalPlan.name = selectedPlan.title;
    }

    await savePlanToSystem(finalPlan);
    setShowPlanDetail(false);
  };

  const handleDeletePlan = async () => {
    clearLocalPlan();
    setCurrentAIPlan(null);
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/plans`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json(); // ✅ 补上这一行

        if (data.plans && data.plans.length > 0) { // ✅ 建议加上判断，防止数组为空报错
            await fetch(`${API_BASE_URL}/plans/${data.plans[0]._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
      } catch (e) { console.error('删除失败', e); }
    }
    window.dispatchEvent(new Event('planUpdated'));
  };

  const handleViewPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPresetSchedule({
      selectedDays: [],
      preferredTime: '07:00'
    });
    setShowPlanDetail(true);
  };

  const handleAIClick = () => {
    const profile = getUserProfile();
    setShowAIDialog(true);
    setAiStep('form');
    setFormData({
      age: profile.age || 25,
      gender: profile.gender || 'male',
      height: profile.height || 175,
      weight: profile.weight || 70,
      waistCircumference: profile.waistCircumference || 0,
      goal: '',
      level: '',
      duration: '',
      preference: '',
      injuryHistory: '',
      notes: '',
      selectedDays: [],
      preferredTime: '07:00'
    });
    setAiError(null);
  };

  const isFormValid = () => {
    return formData.age > 0 && 
           formData.height > 0 && 
           formData.weight > 0 && 
           formData.goal && 
           formData.level && 
           formData.duration && 
           formData.preference &&
           formData.selectedDays.length > 0; 
  };

  const workoutPrograms = [
    {
      id: 1,
      title: '全身燃脂训练',
      category: 'cardio',
      level: '中级',
      duration: '30分钟',
      calories: '350 kcal',
      exercises: 12,
      image: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dCUyMGd5bXxlbnwxfHx8fDE3NjI5OTU2NDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      details: [
        { name: '热身', duration: '5分钟', description: '动态拉伸，如高抬腿、开合跳' },
        { name: '波比跳', sets: '3组', reps: '15次', rest: '60秒' },
        { name: '跳绳', sets: '5组', reps: '1分钟', rest: '30秒' },
        { name: '深蹲跳', sets: '3组', reps: '20次', rest: '60秒' },
        { name: '登山跑', sets: '3组', reps: '45秒', rest: '45秒' },
        { name: '平板支撑', sets: '3组', reps: '1分钟', rest: '30秒' },
        { name: '放松拉伸', duration: '5分钟', description: '静态拉伸主要肌群' },
      ]
    },
    {
      id: 2,
      title: '瑜伽放松',
      category: 'yoga',
      level: '初级',
      duration: '25分钟',
      calories: '120 kcal',
      exercises: 8,
      image: 'https://images.unsplash.com/photo-1641971215228-c677f3a28cd8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwZXhlcmNpc2V8ZW58MXx8fHwxNzYyOTk1NjQ5fDA&ixlib=rb-4.1.0&q=80&w=1080',
      details: [
        { name: '呼吸冥想', duration: '3分钟', description: '调整呼吸，进入状态' },
        { name: '猫牛式', sets: '2组', reps: '10次呼吸', rest: '30秒' },
        { name: '下犬式', sets: '3组', reps: '保持30秒', rest: '30秒' },
        { name: '战士二式', sets: '2组', reps: '每侧保持30秒', rest: '30秒' },
        { name: '三角式', sets: '2组', reps: '每侧保持30秒', rest: '30秒' },
        { name: '婴儿式', duration: '2分钟', description: '放松背部和臀部' },
        { name: '摊尸式', duration: '5分钟', description: '完全放松' },
      ]
    },
    {
      id: 3,
      title: '力量增肌',
      category: 'strength',
      level: '高级',
      duration: '45分钟',
      calories: '400 kcal',
      exercises: 15,
      image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlbmd0aCUyMHRyYWluaW5nfGVufDF8fHx8MTc2Mjk4NzYwOHww&ixlib=rb-4.1.0&q=80&w=1080',
      details: [
        { name: '杠铃深蹲', sets: '4组', reps: '8-12次', rest: '90秒' },
        { name: '卧推', sets: '4组', reps: '8-12次', rest: '90秒' },
        { name: '硬拉', sets: '3组', reps: '6-8次', rest: '120秒' },
        { name: '引体向上', sets: '3组', reps: '至力竭', rest: '90秒' },
        { name: '哑铃推举', sets: '3组', reps: '10-15次', rest: '60秒' },
        { name: '腹肌轮', sets: '3组', reps: '15-20次', rest: '60秒' },
      ]
    },
    {
      id: 4,
      title: '有氧跑步',
      category: 'cardio',
      level: '中级',
      duration: '20分钟',
      calories: '250 kcal',
      exercises: 6,
      image: 'https://images.unsplash.com/photo-1669806954505-936e77929af6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydW5uaW5nJTIwY2FyZGlvfGVufDF8fHx8MTc2MzAwNDY0NHww&ixlib=rb-4.1.0&q=80&w=1080',
      details: [
        { name: '慢跑热身', duration: '5分钟', description: '心率提升至120-130 bpm' },
        { name: '匀速跑', duration: '10分钟', description: '保持在最大心率的60-70%' },
        { name: '冲刺', sets: '3组', reps: '30秒', rest: '60秒慢走' },
        { name: '慢走冷却', duration: '5分钟', description: '心率逐渐恢复' },
      ]
    },
  ];

  const filteredWorkouts = selectedCategory === 'all' 
    ? workoutPrograms 
    : workoutPrograms.filter(w => w.category === selectedCategory);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl">锻炼计划</h1>
        <p className="text-slate-400">选择适合你的训练</p>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="w-full bg-slate-800/50 border border-purple-500/20 grid grid-cols-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">全部</TabsTrigger>
          <TabsTrigger value="cardio" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">有氧</TabsTrigger>
          <TabsTrigger value="strength" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">力量</TabsTrigger>
          <TabsTrigger value="yoga" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">瑜伽</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-purple-600/80 to-pink-600/80 border-0 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">本周完成</p>
            <p className="text-white text-xl">12 次训练</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm">总时长</p>
            <p className="text-white text-xl">6.5 小时</p>
          </div>
        </div>
      </Card>

      {/* Current AI Plan Display */}
      {currentAIPlan && (
        <Card className="bg-slate-800/80 backdrop-blur-sm border border-purple-500/40 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                  <h3 className="text-slate-200 font-semibold">当前定制计划</h3>
                </div>
                <h2 className="text-white text-xl font-bold">{currentAIPlan.name}</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeletePlan}
                className="bg-red-500/20 border-red-400/50 text-red-200 hover:bg-red-500/30"
              >
                <X className="w-4 h-4 mr-1" />
                删除
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">{currentAIPlan.goal?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">{currentAIPlan.frequency}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">{levelMap[currentAIPlan.level] || currentAIPlan.level}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">{currentAIPlan.duration}</span>
              </div>
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                setShowAIDialog(true);
                setAiStep('result');
                setGeneratedPlan(currentAIPlan);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              查看完整计划
            </Button>
          </div>
        </Card>
      )}

      {/* AI Custom Plan Button */}
      <Card 
        className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 p-6 cursor-pointer hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50"
        onClick={handleAIClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="text-white">{currentAIPlan ? '重新生成' : 'AI 定制计划'}</h3>
            </div>
            <p className="text-purple-100 text-sm">{currentAIPlan ? '更新你的训练计划' : '根据你的目标和身体状况，AI 为你量身定制专属训练计划'}</p>
          </div>
          <div className="ml-4">
            <div className="bg-white/20 rounded-full p-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </Card>

      {/* Workout Cards */}
      <div className="space-y-4">
        {filteredWorkouts.map((workout) => (
          <Card
            key={workout.id}
            className="bg-slate-800/50 border-purple-500/20 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer"
            onClick={() => handleViewPlan(workout)}
          >
            <div className="relative h-48">
              <ImageWithFallback
                src={workout.image}
                alt={workout.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
              <div className="absolute top-3 right-3">
                <Badge className="bg-purple-500/90 text-white border-0">
                  {levelMap[workout.level] || workout.level}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white text-xl mb-2">{workout.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {workout.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {workout.calories}
                  </span>
                  <span>{workout.exercises} 个动作</span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <button 
                onClick={() => handleViewPlan(workout)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-5 h-5" />
                查看计划
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* AI Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI 定制训练计划
            </DialogTitle>
          </DialogHeader>
          {aiError && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                {aiError}
              </AlertDescription>
            </Alert>
          )}
          {aiStep === 'form' && (
            <div className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4 space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  个人信息
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">年龄</Label>
                    <Input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="25"
                      min="15"
                      max="80"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-sm">性别</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      className="flex gap-4"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="male" />
                        <span className="text-white text-sm">男</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="female" />
                        <span className="text-white text-sm">女</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">身高 (cm)</Label>
                    <Input
                      type="number"
                      value={formData.height || ''}
                      onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="175"
                      min="140"
                      max="220"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">体重 (kg)</Label>
                    <Input
                      type="number"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="70"
                      min="30"
                      max="200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">腰围 (cm) - 可选</Label>
                    <Input
                      type="number"
                      value={formData.waistCircumference || ''}
                      onChange={(e) => setFormData({ ...formData, waistCircumference: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="85"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm">伤病史 - 可选</Label>
                  <Input
                    type="text"
                    value={formData.injuryHistory || ''}
                    onChange={(e) => setFormData({ ...formData, injuryHistory: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="如有请填写，如：腰椎不好、膝盖旧伤等"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm">特殊说明 - 可选</Label>
                  <Input
                    type="text"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="如：时间紧张、设备有限等其他说明"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-white">训练目标</Label>
                <RadioGroup
                  className="grid grid-cols-2 gap-3"
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
                >
                  <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.goal === 'weight-loss' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="weight-loss" />
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm">减脂塑形</span>
                    </div>
                  </label>
                  <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.goal === 'muscle-gain' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="muscle-gain" />
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm">增肌强壮</span>
                    </div>
                  </label>
                  <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.goal === 'endurance' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="endurance" />
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm">提升耐力</span>
                    </div>
                  </label>
                  <label className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.goal === 'flexibility' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="flexibility" />
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm">柔韧灵活</span>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-white">训练水平</Label>
                <RadioGroup
                  className="grid grid-cols-3 gap-3"
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.level === 'beginner' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="beginner" />
                    <span className="text-white text-sm">初级</span>
                  </label>
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.level === 'intermediate' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="intermediate" />
                    <span className="text-white text-sm">中级</span>
                  </label>
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.level === 'advanced' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="advanced" />
                    <span className="text-white text-sm">高级</span>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-white">每次训练时长</Label>
                <RadioGroup
                  className="grid grid-cols-3 gap-3"
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.duration === '30分钟' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="30分钟" />
                    <span className="text-white text-sm">30分钟</span>
                  </label>
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.duration === '45分钟' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="45分钟" />
                    <span className="text-white text-sm">45分钟</span>
                  </label>
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.duration === '60分钟' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="60分钟" />
                    <span className="text-white text-sm">60分钟</span>
                  </label>
                </RadioGroup>
              </div>

              {/* 训练偏好 */}
              <div className="space-y-3">
                <Label className="text-white">训练偏好</Label>
                <RadioGroup
                  className="grid grid-cols-2 gap-3"
                  value={formData.preference}
                  onValueChange={(value) => setFormData({ ...formData, preference: value })}
                >
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.preference === 'home' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="home" />
                    <span className="text-white text-sm">在家训练</span>
                  </label>
                  <label className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.preference === 'gym' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-purple-500/50'}`}>
                    <RadioGroupItem value="gym" />
                    <span className="text-white text-sm">健身房训练</span>
                  </label>
                </RadioGroup>
              </div>

              {/* 时间选择器 */}
              <div className="bg-slate-800/50 border border-purple-500/20 rounded-lg p-4 space-y-4 mt-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  时间安排
                </h3>
                
                {/* 星期选择 */}
                <div className="space-y-2">
                  <Label className="text-white text-sm">选择训练日 (多选)</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day) => (
                      <button
                        key={day}
                        type="button" 
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-2 rounded-md text-sm border transition-all ${
                          (formData.selectedDays || []).includes(day)
                            ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]'
                            : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {(formData.selectedDays || []).length === 0 && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> 请至少选择一天
                    </p>
                  )}
                </div>

                {/* 时间选择 */}
                <div className="space-y-2">
                  <Label className="text-white text-sm">具体的锻炼时间</Label>
                  <Input
                    type="time"
                    value={formData.preferredTime || '07:00'}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white w-full block h-12 text-lg px-4"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 rounded-lg transition-colors disabled:opacity-50"
                onClick={handleFormSubmit}
                disabled={!isFormValid() || isGenerating || (formData.selectedDays || []).length === 0}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {isGenerating ? '生成中...' : '生成我的专属计划'}
              </Button>
            </div>
          )}
          {/* ... Loading 和 Result 部分保持不变 ... */}
          {aiStep === 'loading' && (
            <div className="py-12 space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Sparkles className="w-16 h-16 text-yellow-300 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-white text-lg">AI 正在分析你的需求...</p>
                <p className="text-slate-400 text-sm">为你量身定制专属训练计划</p>
              </div>
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          )}
          {aiStep === 'result' && generatedPlan && (
            <div className="space-y-6">
              {/* Plan Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                  <h2 className="text-white text-xl">计划生成成功！</h2>
                </div>
                <h3 className="text-white text-2xl">{generatedPlan.name}</h3>
              </div>

              {/* Plan Details */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-400 text-sm">训练目标</p>
                  </div>
                  <p className="text-white">{generatedPlan.goal.name}</p>
                  <p className="text-slate-400 text-xs mt-1">{generatedPlan.goal.focus}</p>
                </Card>
                <Card className="bg-slate-800/50 border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-400 text-sm">训练水平</p>
                  </div>
                  <p className="text-white">{levelMap[generatedPlan.level] || generatedPlan.level}</p>
                </Card>
                <Card className="bg-slate-800/50 border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-400 text-sm">训练频率</p>
                  </div>
                  <p className="text-white">{generatedPlan.frequency}</p>
                </Card>
                <Card className="bg-slate-800/50 border-purple-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <p className="text-slate-400 text-sm">训练时长</p>
                  </div>
                  <p className="text-white">{generatedPlan.duration}</p>
                </Card>
              </div>

              {/* Workout Details */}
              <div className="space-y-3">
                <h3 className="text-white flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-purple-400" />
                  训练内容
                </h3>
                {generatedPlan.workouts.map((workout: any, index: number) => (
                  <Card key={index} className="bg-slate-800/50 border-purple-500/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-white font-semibold">{workout.name}</h4>
                        {workout.day && <p className="text-slate-400 text-sm">{workout.day}</p>}
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-0">
                        {workout.duration}
                      </Badge>
                    </div>
                    
                    {/* Show exercises with detailed info */}
                    {workout.exercises && Array.isArray(workout.exercises) && (
                      <div className="space-y-2">
                        {workout.exercises.map((exercise: any, exIndex: number) => (
                          <div key={exIndex} className="flex items-start gap-2 text-slate-300 text-sm bg-slate-700/30 p-2 rounded">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1 flex-shrink-0"></div>
                            <div className="flex-1">
                              {typeof exercise === 'string' ? (
                                <span>{exercise}</span>
                              ) : (
                                <div>
                                  <div className="font-medium text-white">{exercise.name}</div>
                                  {exercise.sets && <div className="text-xs text-slate-400">{exercise.sets} 组 × {exercise.reps}</div>}
                                  {exercise.rest && <div className="text-xs text-slate-400">休息: {exercise.rest}</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Tips */}
              <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 p-4">
                <h3 className="text-white mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  训练小贴士
                </h3>
                <div className="space-y-2">
                  {generatedPlan.tips.map((tip: string, tipIndex: number) => (
                    <div key={tipIndex} className="flex items-start gap-2 text-slate-300 text-sm">
                      <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 rounded-lg transition-colors"
                onClick={() => setShowAIDialog(false)}
              >
                开始我的训练计划
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ 新增：预设计划详情弹窗 (强制滚动修复版 v3) */}
      <Dialog open={showPlanDetail} onOpenChange={setShowPlanDetail}>
        {/* 
           修改说明：
           1. DialogContent 本身不设 flex-col，只设最大高度和 overflow-hidden。
           2. 内部用一个 flex-col 的 div (main-container) 撑满高度。
           3. 在 ScrollArea 上方和下方各预留 padding。
        */}
        <DialogContent className="w-[95vw] max-w-md h-[85vh] p-0 bg-slate-900 border-purple-500/30 text-white overflow-hidden block">
          
          <div className="flex flex-col h-full w-full">
            
            {/* 1. 头部 - 固定 */}
            <div className="p-5 pb-3 border-b border-purple-500/20 bg-slate-900 shrink-0 z-10">
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold">{selectedPlan?.title}</DialogTitle>
              </DialogHeader>
            </div>

            {/* 2. 中间 - 滚动区域 */}
            {/* 关键：flex-1, overflow-y-auto, -webkit-overflow-scrolling: touch */}
            <div 
              className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-900/50"
              style={{ WebkitOverflowScrolling: 'touch' }} // 修复 iOS 滚动卡顿
            >
              <div className="space-y-4 pb-2">
                {/* 动作列表 */}
                {selectedPlan?.details.map((item: any, index: number) => (
                  <div key={index} className="bg-slate-800 p-4 rounded-xl border border-slate-700/50 shadow-sm">
                    <h4 className="font-semibold text-base text-purple-300 mb-2">{item.name}</h4>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-300">
                      {item.duration && <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500"/><span>{item.duration}</span></div>}
                      {item.sets && <div className="flex items-center gap-1.5"><Dumbbell className="w-3.5 h-3.5 text-slate-500"/><span>{item.sets}</span></div>}
                      {item.reps && <div className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-slate-500"/><span>{item.reps}</span></div>}
                      {item.rest && <div className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5 text-slate-500"/><span>休息 {item.rest}</span></div>}
                    </div>
                    {item.description && <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-700/50 leading-relaxed">{item.description}</p>}
                  </div>
                ))}

                {/* 时间选择器区域 */}
                <div className="pt-2 mt-4 border-t border-purple-500/10">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-400" /> 
                    设置执行时间
                  </h4>
                  <div className="bg-slate-800/30 border border-purple-500/10 rounded-xl p-4 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">选择训练日</Label>
                      <div className="flex flex-wrap gap-2">
                        {weekDays.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => togglePresetDay(day)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                              presetSchedule.selectedDays.includes(day)
                                ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                                : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-600'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      {presetSchedule.selectedDays.length === 0 && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          * 请至少选择一天
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-xs">提醒时间</Label>
                      <Input
                        type="time"
                        value={presetSchedule.preferredTime}
                        onChange={(e) => setPresetSchedule({ ...presetSchedule, preferredTime: e.target.value })}
                        className="bg-slate-700/50 border-slate-600 text-white w-full h-10 text-sm px-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 底部 - 固定 */}
            <div className="p-5 pt-3 border-t border-purple-500/20 bg-slate-900 shrink-0 flex gap-3 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
              <Button variant="outline" onClick={() => setShowPlanDetail(false)} className="flex-1 bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 h-11">关闭</Button>
              
              {presetSchedule.selectedDays.length > 0 && (
                <Button 
                  onClick={activatePresetPlan} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg h-11"
                >
                  启用计划
                </Button>
              )}
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
