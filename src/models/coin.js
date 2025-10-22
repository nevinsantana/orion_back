'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Coin extends Model {
    static associate(models) {
      // Define otras asociaciones aquí si es necesario
    }
  }
  Coin.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: false
    }
  }, {
    sequelize,
    modelName: 'Coin',
    tableName: 'coins',
    timestamps: true,
    paranoid: true,
    underscored: true // Clave para usar created_at, updated_at, deleted_at
  });
  return Coin;
};