import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
// 👇 1. 引入 dns 模块
import dns from 'node:dns';

dotenv.config();

// 👇 2. 在这里强制设置 IPv4 优先
// 放在这里可以确保在 Sequelize 初始化之前执行
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
    console.log('✅ 已强制设置 DNS 解析为 IPv4 优先');
  }
} catch (e) {
  console.log('⚠️ Node版本较低，无法设置 IPv4 优先，跳过...');
}

if (!process.env.DATABASE_URL) {
  console.error("❌ 错误: 未找到 DATABASE_URL 环境变量！");
}

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    },
    // 👇 3. 尝试在驱动层面提示使用 IPv4 (虽然 pg 可能会忽略，但加上更保险)
    // 注意：不要在这里加 socketPath 或 family:4，可能会导致其他错误
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export const connectDB = async () => {
  try {
    // 测试连接
    await sequelize.authenticate();
    console.log('✅ Supabase 数据库连接成功');
    
    // 同步模型
    await sequelize.sync({ alter: true });
    console.log('🔄 数据表模型已同步');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
};

export default sequelize;
