const { response } = require("../utils/handleResponse");
const bcryptjs = require('bcryptjs');
const { Coin } = require('../models');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../helpers/emailHelper');
const crypto = require('crypto');
const { Op } = require('sequelize');
/**
* GET Coins
*/
const getCoins = async (req, res) => {
    try {
        const Coins = await Coin.findAll({
            attributes: ['id', 'name', 'code']
        });

        res.status(200).json({
            code: 1,
            Coins: Coins,
        });
    } catch (error) {
        console.error('Error al obtener las monedas:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const getCoin = async (req, res) => {
  try {
    const { id } = req.params;
    const Coin_data = await Coin.findByPk(id, {
      attributes: ['id', 'name', 'code']
    });

    if (!Coin_data) {
      return res.status(200).json({ code: 0, message: 'Moneda no encontrada' });
    }

    res.status(200).json({ code: 1, Coin_data });
  } catch (error) {
    console.error(`[ERROR] [Coin] [getCoin]`, error);
    res.status(500).json({
      code: 0,
      error: "Ha ocurrido un error inesperado. Intente nuevamente."
    });
  }
};

const postCoin = async (req, res) => {
    try {
        const { name, code } = req.body;

        // 1. Validar que se hayan enviado los datos esenciales
        if (!name || !code) {
            return res.status(200).json({
                code: 0,
                message: 'Faltan campos obligatorios: name y code.'
            });
        }

        // 2. Crear la nueva moneda en la base de datos
        const newCoin = await Coin.create({
            name,
            code
        });

        // 3. Devolver la respuesta de éxito
        res.status(200).json({
            code: 1,
            message: 'Moneda creada exitosamente',
            coin: {
                id: newCoin.id,
                name: newCoin.name,
                code: newCoin.code
                // No devolvemos las claves de tiempo aquí para mantener la respuesta limpia
            }
        });

    } catch (error) {
        console.error(`[ERROR] [Coin] [postCoin]`, error);
        
        // Manejar error de unicidad (si el name o code ya existe)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(200).json({
                code: 0,
                message: 'Ya existe una moneda con ese nombre o código.'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const destroyCoin = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Coin.destroy({
            where: { id },
            individualHooks: true
        });

        if (!result) {
            return res.status(404).json({
                code: 0,
                message: 'Moneda no encontrada'
            });
        }

        res.status(200).json({
            code: 1,
            message: 'Moneda eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el moneda:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const updateCoin = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code } = req.body;
        
        // 1. Buscar la moneda que se desea actualizar
        const coin = await Coin.findByPk(id);

        if (!coin) {
            return res.status(404).json({
                code: 0,
                message: 'Moneda no encontrada.'
            });
        }

        // 2. Crear un objeto con los datos a actualizar (solo los que se proporcionen)
        const dataToUpdate = {};
        if (name) dataToUpdate.name = name;
        if (code) dataToUpdate.code = code;

        // Si no hay datos para actualizar, notificar al usuario
        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({
                code: 0,
                message: 'No se proporcionaron campos para actualizar.'
            });
        }

        // 3. Aplicar la actualización
        await coin.update(dataToUpdate);

        // 4. Devolver la respuesta de éxito
        res.status(200).json({
            code: 1,
            message: 'Moneda actualizada exitosamente',
            coin: {
                id: coin.id,
                name: coin.name,
                code: coin.code
            }
        });

    } catch (error) {
        console.error(`[ERROR] [Coin] [updateCoin]`, error);
        
        // Manejar error de unicidad (si el name o code ya existe en otra moneda)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                code: 0,
                message: 'Ya existe una moneda con ese nombre o código.'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const restoreCoin = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Coin.restore({
            where: { id }
        });

        if (result === 0) {
            return res.status(200).json({
                code: 0,
                message: 'Moneda no encontrada o ya está activa.'
            });
        }

        res.status(200).json({
            code: 1,
            message: 'Moneda restaurada exitosamente'
        });

    } catch (error) {
        console.error('Error al restaurar el usuario:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const getDeletedCoins = async (req, res) => {
    try {
        const deletedCoins = await Coin.findAll({
            // 1. Desactiva el filtro automático para que Sequelize vea los eliminados
            paranoid: false, 
            
            // 2. Filtra explícitamente solo los que tienen marca de tiempo (deleted_at IS NOT NULL)
            where: {
                deleted_at: {
                    [Op.ne]: null // Op.ne (not equal) a NULL
                }
            },
            attributes: ['id', 'name', 'code', 'deleted_at']
        });

        res.status(200).json({
            code: 1,
            coins: deletedCoins,
        });
    } catch (error) {
        console.error('Error al obtener las monedas eliminadas:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};



module.exports = {
  getCoins,
  getCoin,
  postCoin,
  destroyCoin,
  updateCoin,
  restoreCoin,
  getDeletedCoins
};