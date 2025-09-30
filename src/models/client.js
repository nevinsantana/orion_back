'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      // Define asociaciones si el cliente tiene facturas, etc.
    }
  }
  Client.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
      allowNull: false
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true // <--- El campo permite valores nulos
    }
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    underscored: true // Usa created_at, updated_at, deleted_at
  });
  return Client;
};