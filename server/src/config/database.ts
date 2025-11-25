import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Heroku/Supabase需要这个设置
    }
  }
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Supabase 数据库连接成功');
    // 同步所有模型
    await sequelize.sync({ alter: true });
    console.log('🔄 所有模型已同步');
  } catch (error) {
    console.error('❌ Supabase 数据库连接失败:', error);
    process.exit(1);
  }
};

export default sequelize;
