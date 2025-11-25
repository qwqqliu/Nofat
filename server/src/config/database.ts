import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ 错误: 未找到 DATABASE_URL 环境变量！");
}

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false, // 关闭 SQL 日志，让控制台更清爽
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // 必须加上，适配 Supabase/Render 的 SSL 策略
    }
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
    await sequelize.authenticate();
    console.log('✅ Supabase 数据库连接成功');
    
    // 生产环境建议用 alter: true，避免数据丢失
    await sequelize.sync({ alter: true });
    console.log('🔄 数据表模型已同步');
  } catch (error) {
    console.error('❌ 数据库连接失败 (详细信息):', error);
    // 抛出错误让主程序捕获
    throw error;
  }
};

export default sequelize;
