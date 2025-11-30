// =========================
// Selectores principales
// =========================
const productList = document.querySelector('#product-list') || document.querySelector('.product-list');
const paginador = document.querySelector('#paginador');

const cartItemsContainer = document.querySelector('#cart-items');
const cartCountNav = document.querySelector('#cart-count');
const cartCountDetail = document.querySelector('#cart-count-detail');
const cartTotalSpan = document.querySelector('#cart-total');

// =========================
// Estado
// =========================
let productos = [];
let paginaActual = 1;
const productosPorPagina = 6;

let carrito = []; // {id, title, price, image, quantity}

// =========================
// Fetch de productos
// =========================
async function cargarProductos() {
    try {
        const respuesta = await fetch('https://fakestoreapi.com/products');

        if (!respuesta.ok) {
            throw new Error('Error al traer los productos');
        }

        productos = await respuesta.json();

        if (!Array.isArray(productos) || productos.length === 0) {
            productList.innerHTML = '<p>No se encontraron productos.</p>';
            return;
        }

        paginaActual = 1;
        mostrarPagina(paginaActual);
        crearPaginacion();

    } catch (error) {
        console.error('Error en cargarProductos:', error);
        if (productList) {
            productList.innerHTML = '<p>Hubo un problema al cargar los productos.</p>';
        }
    }
}

function cortarTexto(texto, max = 50) {
    return texto.length > max ? texto.substring(0, max) + "..." : texto;
}


// =========================
// Paginación
// =========================
function mostrarPagina(nroPagina) {
    if (!productList) return;

    productList.innerHTML = "";

    const inicio = (nroPagina - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosPagina = productos.slice(inicio, fin);

    productosPagina.forEach(producto => {
        const card = document.createElement('article');
        card.classList.add('product-card');

        card.innerHTML = `
      <img src="${producto.image}" alt="${producto.title}">
      <h3>${producto.title}</h3>
      <p class="description">${cortarTexto(producto.description, 50)}</p>
      <p class="price">$${producto.price}</p>
      <button class="btn-add-cart" data-id="${producto.id}">Agregar al carrito</button>
    `;

        productList.appendChild(card);
    });

    // Listeners de "Agregar al carrito"
    const botonesAgregar = productList.querySelectorAll('.btn-add-cart');
    botonesAgregar.forEach(btn => {
        btn.addEventListener('click', () => {
            const idProducto = Number(btn.dataset.id);
            agregarAlCarrito(idProducto);
        });
    });
}

function crearPaginacion() {
    if (!paginador) return;

    const totalPaginas = Math.ceil(productos.length / productosPorPagina);
    paginador.innerHTML = "";

    // Botón Anterior
    const btnPrev = document.createElement("button");
    btnPrev.textContent = "⟨ Anterior";
    btnPrev.disabled = paginaActual === 1;
    btnPrev.onclick = () => {
        paginaActual--;
        mostrarPagina(paginaActual);
        crearPaginacion();
    };
    paginador.appendChild(btnPrev);

    // Botones numéricos
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === paginaActual) {
            btn.classList.add("active");
        }
        btn.onclick = () => {
            paginaActual = i;
            mostrarPagina(paginaActual);
            crearPaginacion();
        };
        paginador.appendChild(btn);
    }

    // Botón Siguiente
    const btnNext = document.createElement("button");
    btnNext.textContent = "Siguiente ⟩";
    btnNext.disabled = paginaActual === totalPaginas;
    btnNext.onclick = () => {
        paginaActual++;
        mostrarPagina(paginaActual);
        crearPaginacion();
    };
    paginador.appendChild(btnNext);
}

// =========================
// Carrito (localStorage)
// =========================
function cargarCarritoDeStorage() {
    const guardado = localStorage.getItem('carrito');
    if (guardado) {
        try {
            carrito = JSON.parse(guardado);
        } catch {
            carrito = [];
        }
    } else {
        carrito = [];
    }
    actualizarUICarrito();
}

function guardarCarritoEnStorage() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function agregarAlCarrito(productId) {
    const producto = productos.find(p => p.id === productId);
    if (!producto) return;

    const existente = carrito.find(item => item.id === productId);
    if (existente) {
        existente.quantity++;
    } else {
        carrito.push({
            id: producto.id,
            title: producto.title,
            price: producto.price,
            image: producto.image,
            quantity: 1
        });
    }

    guardarCarritoEnStorage();
    actualizarUICarrito();
}

function cambiarCantidad(productId, delta) {
    const item = carrito.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        carrito = carrito.filter(i => i.id !== productId);
    }

    guardarCarritoEnStorage();
    actualizarUICarrito();
}

function eliminarDelCarrito(productId) {
    carrito = carrito.filter(i => i.id !== productId);
    guardarCarritoEnStorage();
    actualizarUICarrito();
}

function obtenerTotalProductos() {
    return carrito.reduce((acc, item) => acc + item.quantity, 0);
}

function obtenerTotalCompra() {
    return carrito
        .reduce((acc, item) => acc + item.quantity * item.price, 0)
        .toFixed(2);
}

function actualizarUICarrito() {
    // Contadores
    const totalProductos = obtenerTotalProductos();
    if (cartCountNav) cartCountNav.textContent = totalProductos;
    if (cartCountDetail) cartCountDetail.textContent = totalProductos;
    if (cartTotalSpan) cartTotalSpan.textContent = obtenerTotalCompra();

    // Listado
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = "<p>Tu carrito está vacío.</p>";
        return;
    }

    carrito.forEach(item => {
        const row = document.createElement('div');
        row.classList.add('cart-item');

        row.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>Precio: $${item.price}</p>
        <p>Subtotal: $${(item.price * item.quantity).toFixed(2)}</p>
      </div>
      <div class="cart-item-controls">
        <button class="btn-restar" data-id="${item.id}">-</button>
        <span class="cart-qty">${item.quantity}</span>
        <button class="btn-sumar" data-id="${item.id}">+</button>
        <button class="btn-remove" data-id="${item.id}">Eliminar</button>
      </div>
    `;

        cartItemsContainer.appendChild(row);
    });

    // Listeners de controles
    cartItemsContainer.querySelectorAll('.btn-sumar').forEach(btn => {
        btn.addEventListener('click', () => {
            cambiarCantidad(Number(btn.dataset.id), +1);
        });
    });

    cartItemsContainer.querySelectorAll('.btn-restar').forEach(btn => {
        btn.addEventListener('click', () => {
            cambiarCantidad(Number(btn.dataset.id), -1);
        });
    });

    cartItemsContainer.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            eliminarDelCarrito(Number(btn.dataset.id));
        });
    });
}

// =========================
// Inicio
// =========================
document.addEventListener('DOMContentLoaded', () => {
    cargarCarritoDeStorage(); 
    cargarProductos();       
});
