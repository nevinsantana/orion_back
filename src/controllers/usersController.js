const { response } = require("../utils/handleResponse");
const bcryptjs = require('bcryptjs');
const { User, PasswordReset } = require('../models');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../helpers/emailHelper');
const crypto = require('crypto');

/**
* GET Users
*/
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'first_name', 'last_name', 'email']
        });

        res.status(200).json({
            code: 1,
            users: users,
        });
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'first_name', 'last_name', 'email']
    });

    if (!user) {
      return res.status(404).json({ code: 0, message: 'Usuario no encontrado' });
    }

    res.status(200).json({ code: 1, user });
  } catch (error) {
    console.error(`[ERROR] [user] [getUser]`, error);
    res.status(500).json({
      code: 0,
      error: "Ha ocurrido un error inesperado. Intente nuevamente."
    });
  }
};

const postUser = async (req, res) => {
    try {
        const { password, password_confirm, ...userData } = req.body;
        
        // 1. Validar que las contraseñas coincidan
        if (password !== password_confirm) {
            return res.status(400).json({
                code: 0,
                message: 'Las contraseñas no coinciden.'
            });
        }

        // 2. Encriptar la contraseña
        const hashedPassword = await bcryptjs.hash(password, 10);

        // 3. Crear el nuevo usuario en la base de datos
        const newUser = await User.create({
            ...userData,
            password: hashedPassword,
            admin_permission: req.body.admin_permission ? true : false
        });

        // 4. Devolver la respuesta de éxito
        res.status(201).json({
            code: 1,
            message: 'Usuario creado exitosamente',
            user: newUser
        });

    } catch (error) {
        console.error('Error al crear el usuario:', error);
        
        // Manejar error de validación de Sequelize (ej. correo duplicado)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                code: 0,
                message: 'El correo electrónico ya está en uso.'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const destroyUser = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await User.destroy({
            where: { id },
            individualHooks: true
        });

        if (!result) {
            return res.status(404).json({
                code: 0,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            code: 1,
            message: 'Usuario eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, password_confirm, ...dataToUpdate } = req.body;
        
        // Buscar el usuario que se desea actualizar
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                code: 0,
                message: 'Usuario no encontrado'
            });
        }

        // Si se proporciona una contraseña, validarla y encriptarla
        if (password || password_confirm) {
            if (password !== password_confirm) {
                return res.status(400).json({
                    code: 0,
                    message: 'Las contraseñas no coinciden.'
                });
            }
            dataToUpdate.password = await bcryptjs.hash(password, 10);
        }

        // Actualizar el usuario con los datos proporcionados
        await user.update(dataToUpdate);

        res.status(200).json({
            code: 1,
            message: 'Información actualizada exitosamente',
            user: user
        });

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        // Manejar errores de validación de Sequelize, como email duplicado
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                code: 0,
                message: 'El correo electrónico ya está en uso.'
            });
        }
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await User.restore({
            where: { id }
        });

        if (result === 0) {
            return res.status(404).json({
                code: 0,
                message: 'Usuario no encontrado o ya está activo.'
            });
        }

        res.status(200).json({
            code: 1,
            message: 'Usuario restaurado exitosamente'
        });

    } catch (error) {
        console.error('Error al restaurar el usuario:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const loginUsers = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Verificar si el usuario existe
        const user = await User.findOne({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({
                code: 0,
                message: 'Credenciales inválidas.'
            });
        }

        // 2. Comparar la contraseña
        const passwordMatch = await bcryptjs.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                code: 0,
                message: 'Credenciales inválidas.'
            });
        }

        // 3. Generar un token JWT
        const token = jwt.sign({
            id: user.id,
            email: user.email,
        }, process.env.JWT_SECRET, {
            expiresIn: '1h' // El token expira en 1 hora
        });

        // 4. Devolver el token
        res.status(200).json({
            code: 1,
            message: 'Inicio de sesión exitoso',
            token: token
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // 1. Verificar si el usuario existe
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Devuelve un mensaje genérico para evitar la enumeración de emails
            return res.status(200).json({
                code: 1,
                message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña.'
            });
        }
        
        // 2. Generar un token único
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // 3. Guardar el token en la base de datos
        await PasswordReset.create({
            user_id: user.id,
            code: resetToken,
            completed: false,
        });

        // 4. Enviar el correo
        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({
            code: 1,
            message: 'Si el correo existe, se ha enviado un enlace para restablecer la contraseña.'
        });

    } catch (error) {
        console.error('Error en el proceso de recuperación:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { code, password, password_confirm } = req.body;

        // 1. Validar contraseñas
        if (password !== password_confirm) {
            return res.status(400).json({
                code: 0,
                message: 'Las nuevas contraseñas no coinciden.'
            });
        }
        
        // 2. Buscar el token y verificar que sea válido
        const resetRecord = await PasswordReset.findOne({
            where: {
                code: code,
                // completed: false, // Que no se haya usado
                // deleted_at: null  // Que no haya sido eliminado (no expirado)
            },
        });
        console.log(resetRecord.createdAt);
        if (!resetRecord) {
            return res.status(400).json({
                code: 0,
                message: 'El código de restablecimiento es inválido, ya fue usado o ha expirado.'
            });
        }
        
        // **OPCIONAL pero RECOMENDADO: Verificar expiración del token**
        // Si quieres que el enlace expire después de 1 hora, aquí puedes validar:

        const isExpired = (new Date() - resetRecord.createdAt) > (60 * 60 * 1000); // 1 hora en ms
        if (isExpired) {
             return res.status(400).json({ code: 0, message: 'El código ha expirado.' });
        }


        // 3. Encriptar y actualizar la contraseña del usuario
        const hashedPassword = await bcryptjs.hash(password, 10);
        await User.update({ password: hashedPassword }, { where: { id: resetRecord.user_id } });
        
        // 4. Marcar el token como completado (usado)
        // await resetRecord.update({
        //     completed: 1,
        //     completed_at: new Date()
        // });
        
        // 5. Devolver la respuesta de éxito
        res.status(200).json({
            code: 1,
            message: 'Contraseña restablecida exitosamente.'
        });

    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        res.status(500).json({
            code: 0,
            error: "Ha ocurrido un error inesperado. Intente nuevamente."
        });
    }
};

module.exports = {
  getUsers,
  getUser,
  postUser,
  destroyUser,
  updateUser,
  restoreUser,
  loginUsers,
  forgotPassword,
  resetPassword
};