const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Obtener el token de la cabecera de la petición
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            code: 0,
            message: 'Acceso no autorizado. Token no proporcionado.'
        });
    }

    // El token suele venir en el formato "Bearer TOKEN", así que lo separamos
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            code: 0,
            message: 'Acceso no autorizado. Formato de token inválido.'
        });
    }

    // 2. Verificar el token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Si el token es válido, adjunta el payload a la petición
        req.user = decoded;
        next(); // Pasa el control al siguiente middleware/controlador
    } catch (error) {
        // Si el token es inválido o ha expirado
        res.status(403).json({
            code: 0,
            message: 'Acceso denegado. Token inválido o expirado.'
        });
    }
};

module.exports = authMiddleware;