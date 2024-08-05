import { DataTypes, Model, Optional, Sequelize } from "sequelize";

// Define the attributes for the User model
interface UserAttributes {
  id?: string;
  username: string;
  email: string;
  password: string;
  secret: string;
}

// Sequelize requires some attributes to be optional when creating a model
interface UserCreationAttributes extends Optional<UserAttributes, "id"> {}

// Extending Model with UserAttributes and UserCreationAttributes
export interface UserInstance
  extends Model<UserAttributes, UserCreationAttributes>,
    UserAttributes {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public username!: string;
  public email!: string;
  public password!: string;
  public secret!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

const UserModel = (sequelize: Sequelize): typeof User => {
  const user = User.init(
    {
      id: {
        type: DataTypes.STRING(128),
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true, // Ensuring email uniqueness
      },
      password: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      secret: {
        type: new DataTypes.STRING(128),
        allowNull: false,
      },
    },
    {
      sequelize, // Use the Sequelize instance from db_connections
      tableName: "users",
      freezeTableName: true,
    }
  );
  return user;
};

export default UserModel;
