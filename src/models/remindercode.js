'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReminderCode extends Model {
    static associate(models) {
      // 1. Un Código de Recordatorio pertenece a una Factura (Invoice)
      // Nota: Aunque la migración de Luis no tiene REFERENCES, este belongsTo es necesario
      // y se asume que la FK está implícita o creada.
      ReminderCode.belongsTo(models.Invoice, {
        foreignKey: 'id_invoice', 
        as: 'invoice'
      });
      // 2. Un Código de Recordatorio es confirmado por un Usuario (User) - OMITIDO
    }
  }
  ReminderCode.init({
    // Llave Foránea (Mapeo de 'id_invoice' de la BD a 'invoiceId' en JS)
    invoiceId: { 
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'id_invoice', // Mapeo al nombre de columna de Luis
      unique: true, // Asumido de la migración para evitar duplicados
      references: {
        model: 'invoices',
        key: 'id',
      }
    },
    code: {
      type: DataTypes.STRING(255), // Usamos 255 para coincidir con la migración de Luis
      allowNull: false,
      unique: true
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    image: { // Mapeo de 'image' de la BD a 'imageUrl' en JS
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image' // Nombre exacto de la columna en la migración de Luis
    }
    // Omitimos los campos 'status' y 'confirmed_by_user_id' ya que NO están en la migración de Luis.
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
