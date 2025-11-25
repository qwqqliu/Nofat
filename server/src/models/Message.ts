import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

// 1. 定义所有字段
interface MessageAttributes {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string | null;
}

// 2. 👇 关键修改：告诉 TS，创建时 'id' 是可选的（因为数据库会自动生成）
interface MessageCreationAttributes extends Optional<MessageAttributes, 'id'> {}

// 3. 类定义使用正确的接口
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: string;
  public userId!: string;
  public role!: 'user' | 'assistant';
  public content!: string;
  public imageUrl?: string | null;
}

Message.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // 数据库会自动生成这个
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'messages',
  }
);

export default Message;