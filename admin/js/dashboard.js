// Variables globales
let productos = [];
let productosFiltrados = [];
let filtroActual = 'todos';
let busquedaActual = '';
let productoEditando = null;

// Elementos del DOM
const addProductBtn = document.getElementById('addProductBtn');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const productsTable = document.getElementById('productsTable');
const productsTableBody = document.getElementById('productsTableBody');
const loading = document.getElementById('loading');
const noProducts = document.getElementById('noProducts');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const confirmModal = document.getElementById('confirmModal');
const closeModal = document.querySelector('.close');

// Stats elements
const totalProducts = document.getElementById('totalProducts');
const activeProducts = document.getElementById('activeProducts');
const inactiveProducts = document.getElementById('inactiveProducts');
const featuredProducts = document.getElementById('featuredProducts');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

function initDashboard() {
    // Verificar autenticación
    verificarAutenticacion();
    
    // Cargar productos
    cargarProductos();
    
    // Setup event listeners
    setupEventListeners();
}

// Verificar autenticación
async function verificarAutenticacion() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/admin';
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        window.location.href = '/admin';
    }
}

function setupEventListeners() {
    // Botones principales
    addProductBtn.addEventListener('click', abrirModalNuevoProducto);
    logoutBtn.addEventListener('click', handleLogout);
    
    // Buscador
    searchBtn.addEventListener('click', realizarBusqueda);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            realizarBusqueda();
        }
    });
    
    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filtro = this.dataset.filter;
            aplicarFiltro(filtro);
        });
    });
    
    // Modal
    closeModal.addEventListener('click', cerrarModal);
    window.addEventListener('click', function(e) {
        if (e.target === productModal) {
            cerrarModal();
        }
    });
    
    // Formulario
    productForm.addEventListener('submit', handleProductSubmit);
    
    // Preview de imagen
    document.getElementById('imagen').addEventListener('change', handleImagePreview);

    // Busca el select de categoría y agrega la opción 'Otros' si no existe
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect && !Array.from(categoriaSelect.options).some(opt => opt.value === 'Otros')) {
        const option = document.createElement('option');
        option.value = 'Otros';
        option.textContent = 'Otros';
        // Insertar después de 'Seleccionar categoría'
        if (categoriaSelect.options.length > 0) {
            categoriaSelect.insertBefore(option, categoriaSelect.options[1]);
        } else {
            categoriaSelect.appendChild(option);
        }
    }
}

// Cargar productos
async function cargarProductos() {
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/productos');
        const data = await response.json();
        
        if (data.success) {
            productos = data.data;
            productosFiltrados = [...productos];
            actualizarStats();
            renderizarTabla();
        } else {
            mostrarError('Error al cargar productos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    } finally {
        mostrarLoading(false);
    }
}

// Actualizar estadísticas
function actualizarStats() {
    totalProducts.textContent = productos.length;
    activeProducts.textContent = productos.filter(p => p.activo).length;
    inactiveProducts.textContent = productos.filter(p => !p.activo).length;
    featuredProducts.textContent = productos.filter(p => p.destacado).length;
}

// Renderizar tabla
function renderizarTabla() {
    if (productosFiltrados.length === 0) {
        mostrarNoProductos();
        return;
    }
    
    const html = productosFiltrados.map(producto => crearFilaProducto(producto)).join('');
    productsTableBody.innerHTML = html;
    
    // Agregar event listeners a los botones
    setupTableEventListeners();
    
    productsTable.style.display = 'table';
    noProducts.style.display = 'none';
}

// Crear fila de producto
function crearFilaProducto(producto) {
    const promocionHTML = producto.promocion.activa && producto.promocion.tipo 
        ? `<span class="promotion-badge">${producto.promocion.tipo}</span>` 
        : '';
    
    return `
        <tr data-id="${producto._id}">
            <td class="product-image-cell">
                <img src="${producto.imagen}" alt="${producto.nombre}" 
                     onerror="this.src='https://via.placeholder.com/60x60/2a2a2a/cccccc?text=No+img'">
            </td>
            <td>
                <div class="product-name">${producto.nombre}</div>
                ${promocionHTML}
            </td>
            <td>${producto.categoria}</td>
            <td>$${producto.precio.toLocaleString()}</td>
            <td>${producto.stock}</td>
            <td>
                <span class="status-badge ${producto.activo ? 'status-active' : 'status-inactive'}">
                    ${producto.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="product-actions">
                <button class="action-btn btn-edit" onclick="editarProducto('${producto._id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn btn-toggle" onclick="toggleProducto('${producto._id}')">
                    <i class="fas fa-${producto.activo ? 'eye-slash' : 'eye'}"></i> 
                    ${producto.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button class="action-btn btn-delete" onclick="eliminarProducto('${producto._id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `;
}

// Setup event listeners de la tabla
function setupTableEventListeners() {
    // Los event listeners se agregan directamente en los botones con onclick
}

// Buscar productos
function realizarBusqueda() {
    busquedaActual = searchInput.value.trim();
    aplicarFiltros();
}

// Aplicar filtro
function aplicarFiltro(filtro) {
    filtroActual = filtro;
    
    // Actualizar botones activos
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filtro) {
            btn.classList.add('active');
        }
    });
    
    aplicarFiltros();
}

// Aplicar filtros combinados
function aplicarFiltros() {
    productosFiltrados = productos.filter(producto => {
        const coincideFiltro = filtroActual === 'todos' || 
            (filtroActual === 'activos' && producto.activo) ||
            (filtroActual === 'inactivos' && !producto.activo) ||
            (filtroActual === 'destacados' && producto.destacado);
        
        const coincideBusqueda = !busquedaActual || 
            producto.nombre.toLowerCase().includes(busquedaActual.toLowerCase()) ||
            producto.descripcion?.toLowerCase().includes(busquedaActual.toLowerCase());
        
        return coincideFiltro && coincideBusqueda;
    });
    
    renderizarTabla();
}

// Abrir modal para nuevo producto
function abrirModalNuevoProducto() {
    productoEditando = null;
    document.getElementById('modalTitle').textContent = 'Nuevo Producto';
    productForm.reset();
    document.getElementById('imagePreview').style.display = 'none';
    productModal.style.display = 'block';
}

// Editar producto
async function editarProducto(productId) {
    try {
        const response = await fetch(`/api/productos/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            productoEditando = data.data;
            llenarFormulario(productoEditando);
            document.getElementById('modalTitle').textContent = 'Editar Producto';
            productModal.style.display = 'block';
        } else {
            mostrarError('Error al cargar producto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Llenar formulario con datos del producto
function llenarFormulario(producto) {
    document.getElementById('productId').value = producto._id;
    document.getElementById('nombre').value = producto.nombre;
    document.getElementById('categoria').value = producto.categoria;
    document.getElementById('precio').value = producto.precio;
    document.getElementById('stock').value = producto.stock;
    document.getElementById('descripcion').value = producto.descripcion || '';
    document.getElementById('promocion').value = producto.promocion.tipo || '';
    document.getElementById('activo').checked = producto.activo;
    document.getElementById('destacado').checked = producto.destacado;
    
    // Mostrar imagen actual
    if (producto.imagen) {
        document.getElementById('previewImg').src = producto.imagen;
        document.getElementById('imagePreview').style.display = 'block';
    }
}

// Manejar envío del formulario
async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(productForm);
    const isEditing = productoEditando !== null;
    
    try {
        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        const url = isEditing ? `/api/productos/${productoEditando._id}` : '/api/productos';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito(isEditing ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
            cerrarModal();
            cargarProductos();
        } else {
            mostrarError(data.error || 'Error al guardar producto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    } finally {
        const submitBtn = productForm.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Producto';
        submitBtn.disabled = false;
    }
}

// Toggle estado del producto
async function toggleProducto(productId) {
    try {
        const response = await fetch(`/api/productos/${productId}/toggle`, {
            method: 'PATCH'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito(data.message);
            cargarProductos();
        } else {
            mostrarError(data.error || 'Error al cambiar estado');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Eliminar producto
function eliminarProducto(productId) {
    const producto = productos.find(p => p._id === productId);
    
    mostrarConfirmModal(
        'Eliminar Producto',
        `¿Estás seguro de que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
        () => confirmarEliminacion(productId)
    );
}

// Confirmar eliminación
async function confirmarEliminacion(productId) {
    try {
        const response = await fetch(`/api/productos/${productId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarExito('Producto eliminado exitosamente');
            cargarProductos();
        } else {
            mostrarError(data.error || 'Error al eliminar producto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Preview de imagen
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Cerrar modal
function cerrarModal() {
    productModal.style.display = 'none';
    productoEditando = null;
    productForm.reset();
    document.getElementById('imagePreview').style.display = 'none';
}

// Mostrar modal de confirmación
function mostrarConfirmModal(titulo, mensaje, onConfirm) {
    document.getElementById('confirmTitle').textContent = titulo;
    document.getElementById('confirmMessage').textContent = mensaje;
    confirmModal.style.display = 'block';

    // Remover cualquier listener anterior y asignar el nuevo
    const oldBtn = document.getElementById('confirmBtn');
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.onclick = function() {
        onConfirm();
        cerrarConfirmModal();
    };
}

// Cerrar modal de confirmación
function cerrarConfirmModal() {
    confirmModal.style.display = 'none';
}

// Logout
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.redirect || '/admin';
        } else {
            mostrarError('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
    loading.style.display = mostrar ? 'block' : 'none';
    if (mostrar) {
        productsTable.style.display = 'none';
        noProducts.style.display = 'none';
    }
}

// Mostrar mensaje de no hay productos
function mostrarNoProductos() {
    productsTable.style.display = 'none';
    noProducts.style.display = 'block';
}

// Mostrar error
function mostrarError(mensaje) {
    // Aquí podrías implementar una notificación más elegante
    alert('Error: ' + mensaje);
}

// Mostrar éxito
function mostrarExito(mensaje) {
    // Aquí podrías implementar una notificación más elegante
    alert('Éxito: ' + mensaje);
}

// Exportar funciones para uso global
window.editarProducto = editarProducto;
window.toggleProducto = toggleProducto;
window.eliminarProducto = eliminarProducto;
window.cerrarModal = cerrarModal;
window.cerrarConfirmModal = cerrarConfirmModal; 