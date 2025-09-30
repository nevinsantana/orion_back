'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class PasswordReset extends Model {
    static associate(models) {
      // Define la relación belongsTo para que puedas usar 'include' en tus consultas
      PasswordReset.belongsTo(models.User, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE'
      });
    }
  }
  PasswordReset.init({
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'PasswordReset',
    tableName: 'password_resets',
    timestamps: true,
    paranoid: true,
    underscored: true
  });
  return PasswordReset;
};