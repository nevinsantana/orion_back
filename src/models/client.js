'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      // 1. Un Cliente tiene muchas Facturas (Invoice)
      Client.hasMany(models.Invoice, {
        foreignKey: 'client_id', // El nombre que usamos en la migración
        as: 'invoices'
      });
    }
  }
  Client.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED, // Importante para la FK con Invoices
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    rfc: { // AGREGADO: Campo RFC, crucial para la facturación
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    tax_address: {
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
    tax_regime: {
      type: DataTypes.STRING,
      allowNull: false
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
    modelName: 'Client',
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    underscored: true
  });
  return Client;
};