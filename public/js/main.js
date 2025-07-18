// Variables globales
let productos = [];
let productosFiltrados = [];
let categoriaActual = 'todos';
let busquedaActual = '';

// Elementos del DOM
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('nav');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const productsGrid = document.getElementById('productsGrid');
const loading = document.getElementById('loading');
const noProducts = document.getElementById('noProducts');
const productModal = document.getElementById('productModal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.querySelector('.close');
const categoryCards = document.querySelectorAll('.category-card');

// Sincronizar buscador mobile y desktop
const searchInputMobile = document.getElementById('searchInputMobile');
const searchBtnMobile = document.getElementById('searchBtnMobile');
if (searchBtnMobile && searchInputMobile) {
    searchBtnMobile.addEventListener('click', function() {
        searchInput.value = searchInputMobile.value;
        realizarBusqueda();
    });
    searchInputMobile.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchInput.value = searchInputMobile.value;
            realizarBusqueda();
        }
    });
}

// --- Carrito de compras ---
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

function actualizarCarritoUI() {
    const cartCount = document.getElementById('cartCount');
    cartCount.textContent = carrito.reduce((acc, item) => acc + item.cantidad, 0);
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(producto) {
    const idx = carrito.findIndex(item => item._id === producto._id);
    if (idx !== -1) {
        carrito[idx].cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }
    guardarCarrito();
    actualizarCarritoUI();
}

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item._id !== productoId);
    guardarCarrito();
    actualizarCarritoUI();
    mostrarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    actualizarCarritoUI();
    mostrarCarrito();
}

function mostrarCarrito() {
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    cartItems.innerHTML = '';
    let total = 0;
    if (carrito.length === 0) {
        cartItems.innerHTML = '<p>El carrito está vacío.</p>';
        cartTotal.textContent = '';
    } else {
        carrito.forEach(item => {
            total += item.precio * item.cantidad;
            cartItems.innerHTML += `<div style='margin-bottom:0.7em; display:flex; align-items:center; justify-content:space-between;'>
                <span style='display:flex; align-items:center; gap:0.7em;'>
                  <img src='${item.imagen}' alt='${item.nombre}' style='width:38px; height:38px; object-fit:cover; border-radius:8px; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,0.08);'>
                  <b>${item.nombre}</b> x${item.cantidad}
                </span>
                <span>
                  $${(item.precio * item.cantidad).toLocaleString()}
                  <button class='btn btn-danger btn-sm' style='margin-left:10px; font-size:1.1em; padding:2px 8px;' onclick='eliminarDelCarrito("${item._id}")' title='Eliminar'><i class="fas fa-trash"></i></button>
                </span>
            </div>`;
        });
        cartTotal.textContent = 'Total: $' + total.toLocaleString();
        cartItems.innerHTML += `<button class='btn btn-danger' style='width:100%;margin-top:1em;' onclick='vaciarCarrito()'><i class="fas fa-trash"></i> Vaciar carrito</button>`;
    }
    cartModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarCarrito() {
    const cartModal = document.getElementById('cartModal');
    cartModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar modal de producto al cargar la página
    var productModal = document.getElementById('productModal');
    if (productModal) {
        productModal.style.display = 'none';
        var modalContent = document.getElementById('modalContent');
        if (modalContent) modalContent.innerHTML = '';
    }
    initApp();
    actualizarCarritoUI();
    document.getElementById('cartBtn').addEventListener('click', mostrarCarrito);
    document.getElementById('closeCartModal').addEventListener('click', cerrarCarrito);
    document.getElementById('cartModal').addEventListener('click', function(e) {
        if (e.target === this) cerrarCarrito();
    });
    document.getElementById('checkoutBtn').addEventListener('click', enviarPedidoPorWhatsApp);
});

function enviarPedidoPorWhatsApp() {
    if (!carrito.length) return;
    let mensaje = '¡Hola! Quiero realizar el siguiente pedido:%0A';
    let total = 0;
    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} ($${item.precio.toLocaleString()} c/u)%0A`;
        total += item.precio * item.cantidad;
    });
    mensaje += `%0ATotal: $${total.toLocaleString()}`;
    // Número del admin actualizado
    let numeroAdmin = '5493624562611';
    let url = `https://wa.me/${numeroAdmin}?text=${mensaje}`;
    window.open(url, '_blank');
}

function initApp() {
    // Cargar productos al inicio
    cargarProductos();
    
    // Event listeners
    setupEventListeners();
    
    // Smooth scrolling para navegación
    setupSmoothScrolling();
    
    // Animaciones de scroll
    setupScrollAnimations();
}

function setupEventListeners() {
    // Menú hamburguesa
    menuToggle.addEventListener('click', toggleMenu);
    
    // Buscador
    searchBtn.addEventListener('click', realizarBusqueda);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            realizarBusqueda();
        }
    });
    
    // Filtros de categoría
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const categoria = this.dataset.category;
            filtrarPorCategoria(categoria);
        });
    });

    // Restablecer todo al hacer clic en Inicio o Productos
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === '#inicio' || link.getAttribute('href') === '#productos') {
            link.addEventListener('click', function() {
                // Limpiar buscador
                searchInput.value = '';
                busquedaActual = '';
                // Restablecer categoría
                categoriaActual = 'todos';
                filterBtns.forEach(btn => {
                    if (btn.dataset.category === 'todos') {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
                aplicarFiltros();
            });
        }
    });

    // Categorías clickeables
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const categoria = this.dataset.category;
            filtrarPorCategoria(categoria);
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    // Modal
    closeModal.addEventListener('click', cerrarModal);
    window.addEventListener('click', function(e) {
        if (e.target === productModal) {
            cerrarModal();
        }
    });
    
    // Navegación activa
    window.addEventListener('scroll', updateActiveNav);
}

// Menú hamburguesa
function toggleMenu() {
    nav.classList.toggle('active');
    menuToggle.classList.toggle('active');
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/productos');
        const data = await response.json();
        
        if (data.success) {
            productos = data.data;
            productosFiltrados = [...productos];
            renderizarProductos();
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

// Renderizar productos agrupados por categoría
function renderizarProductos() {
    // Mostrar u ocultar el header de productos según si hay búsqueda
    const productsHeader = document.querySelector('.products-header');
    const buscadorTextoAmigable = document.querySelector('.buscador-texto-amigable');
    let resultadoBusquedaElem = document.getElementById('resultadoBusqueda');
    if (!resultadoBusquedaElem) {
        resultadoBusquedaElem = document.createElement('div');
        resultadoBusquedaElem.id = 'resultadoBusqueda';
        resultadoBusquedaElem.className = 'category-group-title';
        buscadorTextoAmigable && buscadorTextoAmigable.insertAdjacentElement('afterend', resultadoBusquedaElem);
    }
    if (productsHeader) {
        if (busquedaActual && busquedaActual.length > 0) {
            productsHeader.style.display = 'none';
            resultadoBusquedaElem.style.display = 'block';
            resultadoBusquedaElem.textContent = busquedaActual.toUpperCase();
        } else {
            productsHeader.style.display = '';
            resultadoBusquedaElem.style.display = 'none';
        }
    }
    if (productosFiltrados.length === 0) {
        mostrarNoProductos();
        return;
    }
    let html = '';
    if (busquedaActual && busquedaActual.length > 0) {
        // Si hay búsqueda, mostrar todos los productos filtrados en un solo bloque
        html += `<div class="products-grid">${productosFiltrados.map(producto => crearProductoHTML(producto)).join('')}</div>`;
    } else if (categoriaActual !== 'todos') {
        // Mostrar solo la categoría seleccionada
        html += `<div class="category-group-block">
                    <h2 class="category-group-title">${categoriaActual}</h2>
                    <div class="products-grid">${productosFiltrados.map(producto => crearProductoHTML(producto)).join('')}</div>
                </div>`;
    } else {
        // Agrupar productos por categoría
        const categorias = ['Mates', 'Termos', 'Yerbas', 'Bombillas', 'Otros'];
        categorias.forEach(cat => {
            const productosCat = productosFiltrados.filter(p => p.categoria === cat);
            if (productosCat.length > 0) {
                html += `<div class="category-group-block">
                            <h2 class="category-group-title">${cat}</h2>
                            <div class="products-grid">${productosCat.map(producto => crearProductoHTML(producto)).join('')}</div>
                        </div>`;
            }
        });
    }
    productsGrid.innerHTML = html;
    // Agregar event listeners a las tarjetas de productos
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            const productId = this.dataset.id;
            abrirModalProducto(productId);
        });
    });
    noProducts.style.display = 'none';
}

// Crear HTML de producto
function crearProductoHTML(producto) {
    const promocionHTML = producto.promocion.activa && producto.promocion.tipo 
        ? `<div class="promotion-badge">${producto.promocion.tipo}</div>` 
        : '';
    return `
        <div class="product-card" data-id="${producto._id}">
            ${promocionHTML}
            <div class="product-image-container">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="product-image product-image-zoom" 
                     onerror="this.src='https://via.placeholder.com/400x400/2a2a2a/cccccc?text=Imagen+no+disponible'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${producto.nombre}</h3>
                <div class="product-price">$${producto.precio.toLocaleString()}</div>
                <div class="product-stock">
                    ${producto.stock > 0 ? `Stock: ${producto.stock} unidades` : 'Sin stock'}
                </div>
                <div class="product-category">${producto.categoria}</div>
            </div>
        </div>
    `;
}

// Buscar productos
function realizarBusqueda() {
    busquedaActual = searchInput.value.trim();
    categoriaActual = 'todos';
    // Quitar la clase 'active' de todos los botones y dejar solo 'Todos' activa
    filterBtns.forEach(btn => {
        if (btn.dataset.category === 'todos') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    aplicarFiltros();
    // Scroll automático para mostrar resultados debajo del buscador
    const buscador = document.querySelector('.search-bar-universal');
    const productosSection = document.getElementById('productos');
    if (window.innerWidth <= 900 && buscador && productosSection) {
        const offset = buscador.offsetHeight + buscador.getBoundingClientRect().top + window.scrollY + 8;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    }
}

// Filtrar por categoría
function filtrarPorCategoria(categoria) {
    categoriaActual = categoria;
    
    // Actualizar botones activos
    filterBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoria) {
            btn.classList.add('active');
        }
    });
    
    aplicarFiltros();
}

// Aplicar filtros combinados
function aplicarFiltros() {
    productosFiltrados = productos.filter(producto => {
        const coincideCategoria = categoriaActual === 'todos' || producto.categoria === categoriaActual;
        let coincideBusqueda = true;
        if (busquedaActual) {
            const nombreCoincide = producto.nombre.toLowerCase().includes(busquedaActual.toLowerCase());
            const descripcionCoincide = producto.descripcion && producto.descripcion.toLowerCase().includes(busquedaActual.toLowerCase());
            const categoriaCoincide = producto.categoria.toLowerCase().includes(busquedaActual.toLowerCase());
            coincideBusqueda = nombreCoincide || descripcionCoincide || categoriaCoincide;
        }
        return coincideCategoria && coincideBusqueda;
    });
    renderizarProductos();
}

// Abrir modal de producto
async function abrirModalProducto(productId) {
    try {
        const response = await fetch(`/api/productos/${productId}`);
        const data = await response.json();
        
        if (data.success) {
            const producto = data.data;
            mostrarModalProducto(producto);
        } else {
            mostrarError('Error al cargar detalles del producto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error de conexión');
    }
}

// Mostrar modal con detalles del producto
function mostrarModalProducto(producto) {
    const promocionHTML = producto.promocion.activa && producto.promocion.tipo 
        ? `<div class="promotion-badge">${producto.promocion.tipo}</div>` 
        : '';
    const descripcionHTML = producto.descripcion 
        ? `<p class="modal-product-description">${producto.descripcion}</p>` 
        : '';
    modalContent.innerHTML = `
        <div class="modal-product-grid2">
            <div class="modal-product-image-container2">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="modal-product-image2"
                     onerror="this.src='https://via.placeholder.com/600x400/2a2a2a/cccccc?text=Imagen+no+disponible'">
            </div>
            <div class="modal-product-info2">
                <div class="modal-product-category2">${producto.categoria}</div>
                <h2 class="modal-product-title2">${producto.nombre}</h2>
                ${descripcionHTML}
                <div class="modal-product-price2">$${producto.precio.toLocaleString()}</div>
                <div class="modal-product-stock2">${producto.stock > 0 ? `Stock: ${producto.stock} unidades` : 'Sin stock'}</div>
                <div class="modal-product-actions2">
                    <div class="modal-product-qty-row2">
                        <label for="cantidadInput" class="modal-product-qty-label2">Unidades:</label>
                        <button id="btnRestar" class="modal-product-qty-btn2">-</button>
                        <input id="cantidadInput" type="number" min="1" max="${producto.stock}" value="1" class="modal-product-qty-input2">
                        <button id="btnSumar" class="modal-product-qty-btn2">+</button>
                    </div>
                    <button class="btn modal-btn2 modal-btn-cart2" id="addToCartBtn"><i class="fas fa-shopping-cart"></i> Agregar al carrito</button>
                    <a href="https://wa.me/5493624562611?text=Hola! Me interesa el producto: ${producto.nombre} - $${producto.precio}" 
                       class="btn modal-btn2 modal-btn-whatsapp2" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</a>
                </div>
            </div>
        </div>
        <button class="modal-close-btn2" id="modalCloseBtn2" title="Cerrar">&times;</button>
    `;
    setTimeout(() => {
        const btn = document.getElementById('addToCartBtn');
        const cantidadInput = document.getElementById('cantidadInput');
        const btnSumar = document.getElementById('btnSumar');
        const btnRestar = document.getElementById('btnRestar');
        const closeBtn = document.getElementById('modalCloseBtn2');
        if (btnSumar && cantidadInput) btnSumar.onclick = () => {
            let val = parseInt(cantidadInput.value) || 1;
            if (val < producto.stock) cantidadInput.value = val + 1;
        };
        if (btnRestar && cantidadInput) btnRestar.onclick = () => {
            let val = parseInt(cantidadInput.value) || 1;
            if (val > 1) cantidadInput.value = val - 1;
        };
        if (btn && cantidadInput) btn.onclick = () => {
            let cantidad = parseInt(cantidadInput.value) || 1;
            if (cantidad < 1) cantidad = 1;
            if (cantidad > producto.stock) cantidad = producto.stock;
            for (let i = 0; i < cantidad; i++) {
                agregarAlCarrito(producto);
            }
            mostrarMensajeAgregado(producto.nombre, cantidad);
        };
        if (closeBtn) closeBtn.onclick = cerrarModal;
    }, 0);
    productModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function mostrarMensajeAgregado(nombre, cantidad) {
    // Toast simple
    let toast = document.createElement('div');
    toast.textContent = `${cantidad} unidad${cantidad > 1 ? 'es' : ''} de '${nombre}' agregada${cantidad > 1 ? 's' : ''} al carrito`;
    toast.style.position = 'fixed';
    toast.style.bottom = '32px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#b6ff7a';
    toast.style.color = '#155c2e';
    toast.style.fontWeight = '700';
    toast.style.fontSize = '1.08em';
    toast.style.padding = '14px 32px';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = '0 4px 18px 0 rgba(139, 195, 74, 0.18)';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0.98';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 1700);
    setTimeout(() => { toast.remove(); }, 2100);
}

// Cerrar modal
function cerrarModal() {
    productModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Mostrar/ocultar loading
function mostrarLoading(mostrar) {
    loading.style.display = mostrar ? 'block' : 'none';
    if (mostrar) {
        productsGrid.style.display = 'none';
        noProducts.style.display = 'none';
    } else {
        productsGrid.style.display = 'grid';
    }
}

// Mostrar mensaje de no hay productos
function mostrarNoProductos() {
    productsGrid.style.display = 'none';
    noProducts.style.display = 'block';
}

// Mostrar error
function mostrarError(mensaje) {
    console.error(mensaje);
    // Aquí podrías mostrar una notificación al usuario
}

// Smooth scrolling
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerOffset = 110; // altura del header fijo
                const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                // Cerrar menú móvil si está abierto
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            }
        });
    });
}

// Actualizar navegación activa
function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Animaciones de scroll
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar elementos para animar
    const animateElements = document.querySelectorAll('.category-card, .product-card, .section-title');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Función para recargar productos (útil para actualizaciones)
function recargarProductos() {
    cargarProductos();
}

// Exportar funciones para uso global
toastr = window.toastr || {};
window.recargarProductos = recargarProductos; 
window.eliminarDelCarrito = eliminarDelCarrito;
window.vaciarCarrito = vaciarCarrito;

// Sticky search bar hide on scroll
let lastScrollY = window.scrollY;
const searchBarSticky = document.querySelector('.search-bar-sticky');
window.addEventListener('scroll', function() {
    if (!searchBarSticky) return;
    if (window.scrollY > 80 && window.scrollY > lastScrollY) {
        searchBarSticky.classList.add('hide');
    } else {
        searchBarSticky.classList.remove('hide');
    }
    lastScrollY = window.scrollY;
}); 