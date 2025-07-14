const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const Producto = require('../models/Producto');
const router = express.Router();
const Joi = require('joi');
const productosController = require('../controllers/productosController');
// Esquema de validación para productos
const productoSchemaJoi = Joi.object({
    nombre: Joi.string().max(100).required(),
    categoria: Joi.string().valid('Mates', 'Termos', 'Bombillas', 'Yerbas', 'Otros').required(),
    precio: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required(),
    activo: Joi.boolean().optional(),
    imagen: Joi.string().optional(), // Se valida aparte por multer
    descripcion: Joi.string().max(500).allow('').optional(),
    promocion: Joi.object({
        tipo: Joi.string().valid('2x1', '20% OFF', '30% OFF', '50% OFF', '').optional(),
        activa: Joi.boolean().optional()
    }).optional(),
    destacado: Joi.boolean().optional()
});

// Configuración de Multer para subida de imágenes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generar nombre único para la imagen
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'producto-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Verificar tipo de archivo
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
        }
    }
});

// GET /api/productos - Obtener todos los productos (público)
router.get('/', productosController.obtenerProductos);

// GET /api/productos/:id - Obtener un producto específico
router.get('/:id', productosController.obtenerProductoPorId);

// POST /api/productos - Crear nuevo producto (solo admin)
router.post('/', requireAuth, upload.single('imagen'), productosController.crearProducto);

// PUT /api/productos/:id - Actualizar producto (solo admin)
router.put('/:id', requireAuth, upload.single('imagen'), productosController.actualizarProducto);

// DELETE /api/productos/:id - Eliminar producto (solo admin)
router.delete('/:id', requireAuth, productosController.eliminarProducto);

// PATCH /api/productos/:id/toggle - Cambiar estado activo/inactivo (solo admin)
router.patch('/:id/toggle', requireAuth, productosController.toggleProductoActivo);

module.exports = router; 