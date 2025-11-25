import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AIChatMessageAttributes {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  imageData?: string;
  createdAt?: Date;
}

interface AIChatMessageCreationAttributes extends Optional<AIChatMessageAttributes, 'id'> {}

class AIChatMessage extends Model<AIChatMessageAttributes, AIChatMessageCreationAttributes> implements AIChatMessageAttributes {
  public id!: string;
  public userId!: string;
  public role!: 'user' | 'assistant';
  public content!: string;
  public imageData?: string;
  public readonly createdAt!: Date;
}

AIChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    imageData: {
      type: DataTypes.TEXT, // 存 Base64 图片
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'ai_chat_messages',
    updatedAt: false, // 不需要更新时间
  }
);

export default AIChatMessage;
