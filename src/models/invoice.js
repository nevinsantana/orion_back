'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    static associate(models) {
      // Definimos la asociación: una factura puede tener muchos registros de historial de pagos
      Invoice.hasMany(models.PaymentHistory, {
        foreignKey: 'invoice_id', // El campo en la tabla de PaymentHistory
        as: 'paymentHistory'
      });
    }
  }
  Invoice.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED, // Crucial para que coincida con el id de la migración
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
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