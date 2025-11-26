// 数据管理系统 - 本地存储
import { getCurrentUser } from './authService';

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  waistCircumference?: number;
  goal?: string;
  level?: string;
  joinDate: string;
}

export interface WorkoutRecord {
  id: string;
  date: string;
  type: string;
  duration: number; // 分钟
  calories: number;
  title: string;
  exercises?: string[];
  completed: boolean;
  notes?: string;
}

export interface DailyStats {
  date: string;
  calories: number;
  steps: number;
  activeMinutes: number;
  workoutCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedDate?: string;
  unlocked: boolean;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIWorkoutPlan {
  id: string;
  name: string;
  level: string;
  goal: any;
  frequency: string;
  duration: string;
  workouts: any[];
  tips: string[];
  createdAt: string;
}

const STORAGE_KEYS = {
  USER_PROFILE: 'fitness_user_profile',
  WORKOUT_RECORDS: 'fitness_workout_records',
  DAILY_STATS: 'fitness_daily_stats',
  ACHIEVEMENTS: 'fitness_achievements',
  AI_PLANS: 'fitness_ai_plans',
  AI_CHAT_HISTORY: 'fitness_ai_chat_history',
  CURRENT_AI_PLAN: 'fitness_current_ai_plan',
};

/**
 * 获取用户资料 (修复版：融合 Auth 数据)
 */
export function getUserProfile(): UserProfile {
  // 1. 先尝试获取健身档案数据
  const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  let profile: UserProfile = stored ? JSON.parse(stored) : {
    id: 'user_' + Date.now(),
    name: '',
    joinDate: new Date().toISOString().split('T')[0],
  };

  // 2. 👇 关键修复：强制从 Auth 系统同步昵称和头像
  // 这样注册时填写的昵称就能被这里读取到了
  const authUser = getCurrentUser();
  if (authUser) {
    profile = {
      ...profile, // 保留原有的身高体重数据
      name: authUser.name || profile.name || '用户', // 优先用登录名
      avatar: authUser.avatar || profile.avatar, // 优先用登录头像
      // 如果 authUser 有 ID，也可以同步 ID
      id: authUser.id || profile.id
    };
  }
  
  return profile;
}

/**
 * 保存用户资料
 */
export function saveUserProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

/**
 * 获取所有训练记录
 */
export function getWorkoutRecords(): WorkoutRecord[] {
  const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_RECORDS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * 添加训练记录
 */
export function addWorkoutRecord(record: Omit<WorkoutRecord, 'id'>): WorkoutRecord {
  const newRecord: WorkoutRecord = {
    ...record,
    id: 'workout_' + Date.now(),
  };
  
  const records = getWorkoutRecords();
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEYS.WORKOUT_RECORDS, JSON.stringify(records));
  
  // 更新每日统计
  updateDailyStats(record.date, {
    workoutCount: 1,
    calories: record.calories,
    activeMinutes: record.duration,
  });
  
  return newRecord;
}

/**
 * 更新训练记录
 */
export function updateWorkoutRecord(id: string, updates: Partial<WorkoutRecord>): WorkoutRecord | null {
  const records = getWorkoutRecords();
  const index = records.findIndex(r => r.id === id);
  
  if (index === -1) {
    return null;
  }
  
  records[index] = { ...records[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.WORKOUT_RECORDS, JSON.stringify(records));
  
  return records[index];
}

/**
 * 删除训练记录
 */
export function deleteWorkoutRecord(id: string): boolean {
  const records = getWorkoutRecords();
  const filtered = records.filter(r => r.id !== id);
  
  if (filtered.length === records.length) {
    return false; // 记录未找到
  }
  
  localStorage.setItem(STORAGE_KEYS.WORKOUT_RECORDS, JSON.stringify(filtered));
  return true;
}

/**
 * 获取本周训练记录
 */
export function getWeeklyWorkouts(): WorkoutRecord[] {
  const records = getWorkoutRecords();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= weekAgo && recordDate <= now && r.completed;
  });
}

/**
 * 获取本月训练记录
 */
export function getMonthlyWorkouts(): WorkoutRecord[] {
  const records = getWorkoutRecords();
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  return records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= monthAgo && recordDate <= now && r.completed;
  });
}

/**
 * 获取每日统计
 */
export function getDailyStats(date: string): DailyStats {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
  const allStats = stored ? JSON.parse(stored) : {};
  
  return allStats[date] || {
    date,
    calories: 0,
    steps: 0,
    activeMinutes: 0,
    workoutCount: 0,
  };
}

/**
 * 更新每日统计
 */
export function updateDailyStats(date: string, updates: Partial<DailyStats>): DailyStats {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
  const allStats = stored ? JSON.parse(stored) : {};
  
  const currentStats = allStats[date] || {
    date,
    calories: 0,
    steps: 0,
    activeMinutes: 0,
    workoutCount: 0,
  };
  
  allStats[date] = {
    ...currentStats,
    ...updates,
    date, // 确保日期不被覆盖
  };
  
  localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(allStats));
  return allStats[date];
}

/**
 * 获取本周每日统计
 */
export function getWeeklyStats(): DailyStats[] {
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_STATS);
  const allStats = stored ? JSON.parse(stored) : {};
  
  const stats: DailyStats[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    stats.push(allStats[dateStr] || {
      date: dateStr,
      calories: 0,
      steps: 0,
      activeMinutes: 0,
      workoutCount: 0,
    });
  }
  
  return stats;
}

/**
 * 获取成就
 */
export function getAchievements(): Achievement[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * 保存成就
 */
export function saveAchievements(achievements: Achievement[]): void {
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
}

/**
 * 解锁成就
 */
export function unlockAchievement(achievementId: string): Achievement | null {
  const achievements = getAchievements();
  const achievement = achievements.find(a => a.id === achievementId);
  
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    achievement.unlockedDate = new Date().toISOString().split('T')[0];
    saveAchievements(achievements);
    return achievement;
  }
  
  return null;
}

/**
 * 检查成就
 */
export function checkAndUnlockAchievements(): Achievement[] {
  const achievements = getAchievements();
  const records = getWorkoutRecords();
  const profile = getUserProfile();
  const unlockedList: Achievement[] = [];
  
  // 检查"初出茅庐"
  if (!achievements[0].unlocked && records.length > 0) {
    unlockAchievement('a1');
    unlockedList.push(achievements[0]);
  }
  
  // 检查"百炼成钢" - 100次训练
  if (!achievements[6].unlocked && records.filter(r => r.completed).length >= 100) {
    unlockAchievement('a7');
    unlockedList.push(achievements[6]);
  }
  
  // 检查"月度冠军" - 单月20次训练
  const monthlyCount = getMonthlyWorkouts().filter(r => r.completed).length;
  if (!achievements[7].unlocked && monthlyCount >= 20) {
    unlockAchievement('a8');
    unlockedList.push(achievements[7]);
  }
  
  // 检查"燃脂达人" - 10000卡路里
  const totalCalories = records
    .filter(r => r.completed)
    .reduce((sum, r) => sum + r.calories, 0);
  if (!achievements[2].unlocked && totalCalories >= 10000) {
    unlockAchievement('a3');
    unlockedList.push(achievements[2]);
  }
  
  return unlockedList;
}

/**
 * 保存 AI 计划
 */
export function saveAIPlan(plan: any): void {
  const plans = localStorage.getItem(STORAGE_KEYS.AI_PLANS);
  const allPlans = plans ? JSON.parse(plans) : [];
  
  const newPlan = {
    ...plan,
    id: 'plan_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  
  allPlans.push(newPlan);
  localStorage.setItem(STORAGE_KEYS.AI_PLANS, JSON.stringify(allPlans));
}

/**
 * 获取 AI 计划历史
 */
export function getAIPlanHistory(): any[] {
  const stored = localStorage.getItem(STORAGE_KEYS.AI_PLANS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * 获取今日统计摘要
 */
export function getTodayStats(): DailyStats {
  const today = new Date().toISOString().split('T')[0];
  return getDailyStats(today);
}

/**
 * 获取周统计摘要
 */
export function getWeekSummary(): {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  avgCaloriesPerDay: number;
} {
  const weekStats = getWeeklyStats();
  
  const summary = {
    totalWorkouts: weekStats.reduce((sum, s) => sum + s.workoutCount, 0),
    totalMinutes: weekStats.reduce((sum, s) => sum + s.activeMinutes, 0),
    totalCalories: weekStats.reduce((sum, s) => sum + s.calories, 0),
    avgCaloriesPerDay: 0,
  };
  
  summary.avgCaloriesPerDay = Math.round(summary.totalCalories / 7);
  return summary;
}

/**
 * 保存当前 AI 计划为活跃计划
 */
export function setCurrentAIPlan(plan: any): void {
  const currentPlan = {
    ...plan,
    id: 'plan_' + Date.now(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.CURRENT_AI_PLAN, JSON.stringify(currentPlan));
  saveAIPlan(plan);
}

/**
 * 获取当前活跃的 AI 计划
 */
export function getCurrentAIPlan(): any | null {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_AI_PLAN);
  return stored ? JSON.parse(stored) : null;
}

/**
 * 删除当前 AI 计划
 */
export function clearCurrentAIPlan(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_AI_PLAN);
}

/**
 * 添加 AI 聊天消息
 */
export function addAIChatMessage(role: 'user' | 'assistant', content: string): AIChatMessage {
  const message: AIChatMessage = {
    id: 'msg_' + Date.now(),
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  
  const history = getAIChatHistory();
  history.push(message);
  localStorage.setItem(STORAGE_KEYS.AI_CHAT_HISTORY, JSON.stringify(history));
  
  return message;
}

/**
 * 获取 AI 聊天历史
 */
export function getAIChatHistory(): AIChatMessage[] {
  const stored = localStorage.getItem(STORAGE_KEYS.AI_CHAT_HISTORY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * 清空 AI 聊天历史
 */
export function clearAIChatHistory(): void {
  localStorage.removeItem(STORAGE_KEYS.AI_CHAT_HISTORY);
}

/**
 * 获取最近的 N 条聊天记录（用于上下文）
 */
export function getRecentAIChatMessages(limit: number = 10): AIChatMessage[] {
  const history = getAIChatHistory();
  return history.slice(Math.max(0, history.length - limit));
}
