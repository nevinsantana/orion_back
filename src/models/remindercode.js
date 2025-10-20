// src/models/remindercode.js
'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReminderCode extends Model {
    static associate(models) {
      // Si la integridad es manejada por la aplicación, puedes definir la asociación aquí
      // ReminderCode.belongsTo(models.Invoice, { foreignKey: 'id_invoice' });
    }
  }
  ReminderCode.init({
    id_invoice: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ReminderCode',
    tableName: 'reminder_codes',
    timestamps: true,
    paranoid: true,
    underscored: true // Clave para usar created_at, updated_at, deleted_at
  });
  return ReminderCode;
};