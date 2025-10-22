'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReminderCode extends Model {
    static associate(models) {
      // 1. Un Código de Recordatorio pertenece a una Factura (Invoice)
      ReminderCode.belongsTo(models.Invoice, {
        foreignKey: 'id_invoice', // Columna de la migración de Luis
        as: 'invoice'
      });
      // 2. Un Código de Recordatorio es confirmado por un Usuario (User)
      ReminderCode.belongsTo(models.User, {
        foreignKey: 'confirmed_by_user_id', 
        as: 'confirmer'
      });
    }
  }
  ReminderCode.init({
    // Llave Foránea (Mapeo de 'id_invoice' de la BD a 'invoiceId' en JS)
    invoiceId: { 
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'id_invoice', // <--- Mapeo al nombre de columna de Luis
      unique: true, // Heredado de la migración
      references: {
        model: 'invoices',
        key: 'id',
      }
    },
    code: {
      type: DataTypes.STRING(32), // Usamos 32 para consistencia con tokens
      allowNull: false,
      unique: true
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    imageUrl: { // Mapeo de 'image' de la BD a 'imageUrl' en JS
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image'
    },
    // Campo que controla quién confirmó el pago (necesario para el flujo de Luis)
    confirmedByUserId: { 
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'confirmed_by_user_id'
    },
    // Campo que controla el estado del comprobante (PENDING, CONFIRMED, REJECTED)
    status: { 
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'REJECTED'),
      defaultValue: 'PENDING',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ReminderCode',
    tableName: 'reminder_codes', // Nombre de la tabla de Luis
    timestamps: true,
    paranoid: true,
    underscored: true
  });
  return ReminderCode;
};
