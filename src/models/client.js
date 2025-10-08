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
    // --- Campos de Contacto ---
    contact_name: {
      type: DataTypes.STRING,
      allowNull: true // Asumo que el nombre de contacto es opcional si el correo y teléfono lo son.
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contact_phone: {
      type: DataTypes.STRING,
      allowNull: true // Este campo permite valores nulos
    },
    // --- Campos Fiscales Adicionales (Nuevos) ---
    tax_regime: { // Este era un campo anterior, pero lo mantengo aquí por orden
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
    // NOTA: No incluyas created_at, updated_at, deleted_at aquí.
    // Sequelize los maneja automáticamente con las opciones de abajo.
  }, {
    sequelize,
    modelName: 'Client',
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    underscored: true // Clave para usar snake_case en la BD
  });
  return Client;
};