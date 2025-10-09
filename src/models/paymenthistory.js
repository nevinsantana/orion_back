"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PaymentHistory extends Model {
    static associate(models) {
      // Definimos la asociación con el modelo de Facturas (Invoices)
      PaymentHistory.belongsTo(models.Invoice, {
        foreignKey: "invoiceId",
        as: "invoice", // Alias para la asociación
      });
    }
  }
  PaymentHistory.init(
    {
      invoiceId: {
        type: DataTypes.INTEGER.UNSIGNED, // Tipo de dato que coincide con invoices.id
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
      },
      paymentDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PaymentHistory", // Nombre de la clase en camelCase
      tableName: "payment_history", // Nombre de la tabla en snake_case
      timestamps: true, // Para created_at y updated_at
      paranoid: true, // Para deleted_at (soft delete)
      underscored: true, // Clave para usar nombres de columna snake_case
    }
  );
  return PaymentHistory;
};
