'use strict';
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class PaymentHistory extends Model {
    static associate(models) {
      // Definimos la asociación belongsTo (correcta)
      PaymentHistory.belongsTo(models.Invoice, {
        foreignKey: "invoice_id", // Ya está en snake_case
        as: "invoice",
      });
    }
  }
  PaymentHistory.init(
    {
      invoiceId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'invoice_id', // <--- CORRECCIÓN CLAVE: Mapea a la columna de la DB
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
      modelName: "PaymentHistory",
      tableName: "payment_history",
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );
  return PaymentHistory;
};