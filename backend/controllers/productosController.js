const path = require('path');
const fs = require('fs');
const Producto = require('../models/Producto');
const Joi = require('joi');

// Esquema de validación para productos
const productoSchemaJoi = Joi.object({
    nombre: Joi.string().max(100).required(),
    categoria: Joi.string().valid('Mates', 'Termos', 'Bombillas', 'Yerbas', 'Otros').required(),
    precio: Joi.number().min(0).required(),
    stock: Joi.number().integer().min(0).required(),
    activo: Joi.boolean().optional(),
    imagen: Joi.string().optional(),
    descripcion: Joi.string().max(500).allow('').optional(),
    promocion: Joi.alternatives().try(
        Joi.object({
            tipo: Joi.string().valid('2x1', '20% OFF', '30% OFF', '50% OFF', '').optional(),
            activa: Joi.boolean().optional()
        }),
        Joi.string().allow('')
    ).optional(),
    destacado: Joi.boolean().optional()
});

exports.obtenerProductos = async (req, res) => {
    try {
        const { categoria, busqueda, destacados } = req.query;
        let productos;
        if (busqueda) {
            productos = await Producto.buscar(busqueda);
        } else if (categoria) {
            productos = await Producto.getPorCategoria(categoria);
        } else if (destacados === 'true') {
            productos = await Producto.find({ activo: true, destacado: true }).sort({ createdAt: -1 });
        } else {
            productos = await Producto.getActivos();
        }
        res.json({
            success: true,
            message: 'Productos obtenidos correctamente',
            data: productos,
            total: productos.length
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
};

exports.obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
                error: 'No existe un producto con ese ID'
            });
        }
        res.json({
            success: true,
            message: 'Producto obtenido correctamente',
            data: producto
        });
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

exports.crearProducto = async (req, res) => {
    try {
        if (typeof req.body.activo !== 'undefined') {
            req.body.activo = req.body.activo === 'on' || req.body.activo === true || req.body.activo === 'true';
        }
        if (typeof req.body.destacado !== 'undefined') {
            req.body.destacado = req.body.destacado === 'on' || req.body.destacado === true || req.body.destacado === 'true';
        }
        if (typeof req.body.promocion === 'string' && req.body.promocion !== '') {
            req.body.promocion = { tipo: req.body.promocion, activa: true };
        } else if (req.body.promocion === '') {
            req.body.promocion = '';
        }
        // Eliminar productId si viene en el body
        const { productId, ...bodySinProductId } = req.body;
        const dataToValidate = {
            ...bodySinProductId,
            imagen: req.file ? `/uploads/${req.file.filename}` : undefined
        };
        const { error } = productoSchemaJoi.validate(dataToValidate, { abortEarly: false });
        if (error) {
            console.error('Detalles de error Joi:', error.details.map(d => d.message));
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                error: 'Datos inválidos',
                details: error.details.map(d => d.message)
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'La imagen es obligatoria',
                error: 'La imagen es obligatoria'
            });
        }
        const productoData = {
            ...bodySinProductId,
            imagen: `/uploads/${req.file.filename}`
        };
        const producto = new Producto(productoData);
        await producto.save();
        console.log(`[ADMIN] Producto creado: ID=${producto._id}, Nombre="${producto.nombre}", Fecha=${new Date().toISOString()}`);
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: producto
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error al crear producto',
            error: error.message || 'Error al crear producto'
        });
    }
};

exports.actualizarProducto = async (req, res) => {
    try {
        if (typeof req.body.activo !== 'undefined') {
            req.body.activo = req.body.activo === 'on' || req.body.activo === true || req.body.activo === 'true';
        }
        if (typeof req.body.destacado !== 'undefined') {
            req.body.destacado = req.body.destacado === 'on' || req.body.destacado === true || req.body.destacado === 'true';
        }
        if (typeof req.body.promocion === 'string' && req.body.promocion !== '') {
            req.body.promocion = { tipo: req.body.promocion, activa: true };
        } else if (req.body.promocion === '') {
            req.body.promocion = '';
        }
        // Eliminar productId si viene en el body
        const { productId, ...bodySinProductId } = req.body;
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
                error: 'No existe un producto con ese ID'
            });
        }
        const updateData = { ...bodySinProductId };
        if (req.file) {
            if (producto.imagen) {
                const oldImagePath = path.join(__dirname, '../../', producto.imagen);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            updateData.imagen = `/uploads/${req.file.filename}`;
        }
        const { error } = productoSchemaJoi.validate({ ...producto.toObject(), ...updateData }, { abortEarly: false });
        if (error) {
            console.error('Detalles de error Joi:', error.details.map(d => d.message));
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                error: 'Datos inválidos',
                details: error.details.map(d => d.message)
            });
        }
        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        console.log(`[ADMIN] Producto actualizado: ID=${productoActualizado._id}, Nombre="${productoActualizado.nombre}", Fecha=${new Date().toISOString()}`);
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: productoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message || 'Error al actualizar producto'
        });
    }
};

exports.eliminarProducto = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
                error: 'No existe un producto con ese ID'
            });
        }
        if (producto.imagen) {
            const imagePath = path.join(__dirname, '../../', producto.imagen);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        await Producto.findByIdAndDelete(req.params.id);
        console.log(`[ADMIN] Producto eliminado: ID=${producto._id}, Nombre="${producto.nombre}", Fecha=${new Date().toISOString()}`);
        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
};

exports.toggleProductoActivo = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado',
                error: 'No existe un producto con ese ID'
            });
        }
        producto.activo = !producto.activo;
        await producto.save();
        console.log(`[ADMIN] Estado de producto cambiado: ID=${producto._id}, Nombre="${producto.nombre}", NuevoEstado=${producto.activo}, Fecha=${new Date().toISOString()}`);
        res.json({
            success: true,
            message: `Producto ${producto.activo ? 'activado' : 'desactivado'} exitosamente`,
            data: producto
        });
    } catch (error) {
        console.error('Error al cambiar estado del producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del producto',
            error: error.message
        });
    }
}; 