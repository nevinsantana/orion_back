const { response } = require("../utils/handleResponse");
const bcryptjs = require('bcryptjs');
const { Client } = require('../models');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../helpers/emailHelper');
const crypto = require('crypto');
const { Op } = require('sequelize');
/**
* GET Coins
*/
const getClients = async (req, res) => {
    try {
        const Clients = await Client.findAll({
            attributes: ['id','name','tax_address','tax_regime','contact_name','contact_email','contact_phone','uso_cfdi','regimen_fiscal_receptor','domicilio_fiscal_receptor','metodo_pago','forma_pago','email_recepcion_facturas'
            ]
        });

        res.status(200).json({
            code: 1,
            Clients: Clients,
        });
    } catch (error) {
        console.error('Error al obtener las monedas:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const getClient = async (req, res) => {
  try {
    const { id } = req.params;
    const Client_data = await Client.findByPk(id, {
      attributes: ['id','name','tax_address','contact_name','contact_email','contact_phone','uso_cfdi','regimen_fiscal_receptor','domicilio_fiscal_receptor','metodo_pago','forma_pago','email_recepcion_facturas'
            ]
    });

    if (!Client_data) {
      return res.status(200).json({ code: 0, message: 'Cliente no encontrado' });
    }

    res.status(200).json({ code: 1, Client_data });
  } catch (error) {
    console.error(`[ERROR] [Client] [getCoin]`, error);
    res.status(500).json({
      code: 0,
      error: "Ha ocurrido un error inesperado. Intente nuevamente."
    });
  }
};

const postClient = async (req, res) => {
    try {
        // 1. Simplificar: Pasar el cuerpo COMPLETO directamente a Client.create()
        const newClient = await Client.create(req.body);

        // 2. Devolver la respuesta de éxito (201 Created)
        res.status(201).json({
            code: 1,
            message: 'Cliente creado exitosamente',
            client: newClient
        });

    } catch (error) {
        console.error(`[ERROR] [Client] [postClient]`, error);
        
        // Manejo de errores de Sequelize
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                code: 0,
                message: 'Error de validación en los datos del cliente.',
                errors: messages
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(400).json({
                code: 0,
                message: 'Ya existe un cliente con ese Nombre (name).'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const destroyClient = async (req, res) => {
    try {
	    const { id } = req.params;

	    // 1. Usar el método destroy, que aplica el soft delete
	    const result = await Client.destroy({
	        where: { id }
	        // 'paranoid: true' en el modelo hace que esto sea un soft delete
	    });

	    // 2. Verificar si se eliminó algún registro (result > 0)
	    if (result === 0) {
	        return res.status(404).json({
	            code: 0,
	            message: 'Cliente no encontrado o ya eliminado.'
	        });
	    }

	    // 3. Devolver respuesta de éxito
	    res.status(200).json({
	        code: 1,
	        message: 'Cliente eliminado correctamente (borrado suave).'
	    });

	} catch (error) {
	    console.error(`[ERROR] [Client] [destroyClient]`, error);
	    res.status(500).json({
	        code: 0,
	        error: "Ha ocurrido un error inesperado. Intente nuevamente."
	    });
	}
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = req.body; // Obtiene todos los campos enviados

        // 1. Buscar el cliente
        const client = await Client.findByPk(id);

        if (!client) {
            return res.status(404).json({
                code: 0,
                message: 'Cliente no encontrado.'
            });
        }

        // 2. Aplicar la actualización con los datos proporcionados
        // Sequelize actualizará solo los campos que existan en dataToUpdate
        await client.update(dataToUpdate);

        // 3. Devolver la respuesta de éxito
        res.status(200).json({
            code: 1,
            message: 'Información del cliente actualizada exitosamente.',
            client: client // Devuelve el objeto cliente actualizado
        });

    } catch (error) {
        console.error(`[ERROR] [Client] [updateClient]`, error);
        
        // Manejar error de unicidad (si se intenta cambiar 'name' a uno ya existente)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                code: 0,
                message: 'Ya existe otro cliente con ese Nombre (name).'
            });
        }
        
        // Manejar errores de validación (ej: campo obligatorio nulo)
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            return res.status(400).json({
                code: 0,
                message: 'Error de validación en los datos.',
                errors: messages
            });
        }

        // Error genérico
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const restoreClient = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Usar el método restore para anular el borrado suave
        // Sequelize encuentra el cliente con ese ID y establece deleted_at a NULL
        const result = await Client.restore({
            where: { id }
        });

        // 2. Verificar el resultado
        // restore() devuelve 1 si se restauró un registro, o 0 si no se encontró
        if (result === 0) {
            return res.status(404).json({
                code: 0,
                message: 'Cliente no encontrado o ya está activo.'
            });
        }

        // 3. Devolver respuesta de éxito
        res.status(200).json({
            code: 1,
            message: 'Cliente restaurado y activo correctamente.'
        });

    } catch (error) {
        console.error(`[ERROR] [Client] [restoreClient]`, error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const getDeletedClients = async (req, res) => {
    try {
        const deletedClients = await Client.findAll({
            // 1. Desactiva el filtro automático de soft delete
            paranoid: false, 
            
            // 2. Filtra explícitamente solo los que tienen marca de tiempo
            where: {
                deleted_at: {
                    [Op.ne]: null // Op.ne significa "not equal to" (NO es igual a) NULL
                }
            },
            attributes: ['id','name','tax_address','contact_name','contact_email','contact_phone','uso_cfdi','regimen_fiscal_receptor','domicilio_fiscal_receptor','metodo_pago','forma_pago','email_recepcion_facturas'
            ]
        });

        res.status(200).json({
            code: 1,
            clients: deletedClients,
        });
    } catch (error) {
        console.error('Error al obtener los clientes eliminados:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};


module.exports = {
  getClients,
  getClient,
  postClient,
  destroyClient,
  updateClient,
  restoreClient,
  getDeletedClients
};