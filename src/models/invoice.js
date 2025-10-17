'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      // 1. Relación con Clients: Una factura pertenece a un Cliente (CRUCIAL)
      Invoice.belongsTo(models.Client, {
        foreignKey: 'client_id', // Nombre del campo de la llave foránea
        as: 'client'
      });
      
      // 2. Relación con PaymentHistory: Una factura puede tener muchos registros de historial de pagos
      Invoice.hasMany(models.PaymentHistory, {
        foreignKey: 'invoice_id',
        as: 'paymentHistory'
      });
    }
  }
  Invoice.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    
    // --- NUEVOS CAMPOS DE RELACIÓN Y SEGUIMIENTO ---
    client_id: { // Llave foránea a la tabla clients
      type: DataTypes.INTEGER.UNSIGNED, // Debe ser UNSIGNED para coincidir con el ID de clients
      allowNull: false, // Una factura siempre debe estar ligada a un cliente
      references: {
        model: 'clients', 
        key: 'id'
      }
    },
    total_amount: { // Campo: Monto total de la factura
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    due_date: { // Campo: Fecha de vencimiento
        type: DataTypes.DATE,
        allowNull: false
    },
    
    // --- CAMPOS SNAPSHOT (Mantener la información fiscal del momento del timbrado) ---
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rfc: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tax_address: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tax_regime: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uso_cfdi: {
      type: DataTypes.STRING,
      allowNull: false
    },
    regimen_fiscal_receptor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    domicilio_fiscal_receptor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    metodo_pago: {
      type: DataTypes.STRING,
      allowNull: false
    },
    forma_pago: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email_recepcion_facturas: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: true,
    paranoid: true,
    underscored: true
  });
  return Invoice;
};