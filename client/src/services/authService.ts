// ↓↓↓ 确保这里从 config 导入
import { API_BASE_URL } from './config';

// 认证服务 - 处理注册、登录、令牌管理
const STORAGE_KEY_TOKEN = 'auth_token';
const STORAGE_KEY_USER = 'current_user';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  isGuest: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  error?: string;
}

/**
 * 用户注册 - 核心修改点
 * 1. 入参增加了 name?
 * 2. body 中增加了 name
 */
export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name, // 👈 关键修复：把前端填写的昵称发送给后端
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '注册失败',
      };
    }

    if (data.token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    }

    return {
      success: true,
      message: '注册成功',
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    console.error('注册请求异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    };
  }
}

/**
 * 用户登录 (无需修改，登录成功后后端会返回包含 name 的 user 对象，这里已经自动保存了)
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || '登录失败',
      };
    }

    if (data.token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
    }

    return {
      success: true,
      message: '登录成功',
      token: data.token,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    };
  }
}

// ... 下面的代码保持不变 ...
export function loginAsGuest(): AuthResponse {
  const guestUser: User = {
    id: 'guest_' + Date.now(),
    email: '',
    name: '游客',
    avatar: '游',
    isGuest: true,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(guestUser));
  localStorage.removeItem(STORAGE_KEY_TOKEN);

  return {
    success: true,
    message: '游客登录成功',
    user: guestUser,
  };
}

export function getCurrentUser(): User | null {
  const userStr = localStorage.getItem(STORAGE_KEY_USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
}
