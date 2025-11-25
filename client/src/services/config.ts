// config.ts

// 逻辑说明：
// 1. 优先读取设置的环境变量 VITE_API_URL (你在 Cloudflare 设置的那个)
// 2. 如果没有环境变量且处于开发模式 (DEV)，则使用本地代理 /api
// 3. 最后兜底使用硬编码的生产地址
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://nofat.onrender.com/api');

// 打印日志方便调试（生产环境F12可以看到）
console.log('Current API Base URL:', API_BASE_URL);
console.log('Environment Mode:', import.meta.env.MODE);