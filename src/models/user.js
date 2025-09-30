'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.PasswordReset, {
        foreignKey: 'user_id',
        onDelete: 'CASCADE',
      });
    }
  }
  User.init({
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true, // Habilita `created_at` y `updated_at`
    paranoid: true,   // Habilita el "borrado suave" con `deleted_at`
    underscored: true // Usa snake_case para los nombres de columnas
  });
  return User;
};