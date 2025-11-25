import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AIPlanAttributes {
  id: string;
  userId: string;
  name: string;
  goal: string;
  level: string;
  frequency: string;
  duration: string;
  planData: any; // 这里存储 JSON 数据
  createdAt?: Date;
  updatedAt?: Date;
}

interface AIPlanCreationAttributes extends Optional<AIPlanAttributes, 'id'> {}

class AIPlan extends Model<AIPlanAttributes, AIPlanCreationAttributes> implements AIPlanAttributes {
  public id!: string;
  public userId!: string;
  public name!: string;
  public goal!: string;
  public level!: string;
  public frequency!: string;
  public duration!: string;
  public planData!: any;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AIPlan.init(
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    goal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    planData: {
      type: DataTypes.JSON, // PostgreSQL 支持 JSON 类型，完美！
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'ai_plans',
  }
);

export default AIPlan;
