let tasasCambio = null;
let monedaActual = "PEN";

const SIMBOLOS = {
    PEN: "S/",
    USD: "$",
    EUR: "€"
};

const STORAGE_KEY = "sportzone_carrito";

let carrito = cargarCarrito();


// ===============================
// CARGAR CARRITO
// ===============================

function cargarCarrito() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}


// ===============================
// GUARDAR CARRITO
// ===============================

function guardarCarrito() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(carrito)
    );
}


// ===============================
// FORMATEAR PRECIOS
// ===============================

function formatearPrecio(precioPEN, moneda = monedaActual) {

    let valor = precioPEN;

    if (
        moneda !== "PEN" &&
        tasasCambio &&
        tasasCambio[moneda]
    ) {
        valor = precioPEN * tasasCambio[moneda];
    }

    return `${SIMBOLOS[moneda] || "S/"} ${valor.toFixed(2)}`;
}


// ===============================
// CAMBIAR MONEDA
// ===============================

function cambiarMoneda(moneda) {

    monedaActual = moneda;

    document
        .querySelectorAll(".precio[data-precio-pen]")
        .forEach(elemento => {

            const precio = parseFloat(
                elemento.dataset.precioPen
            );

            elemento.textContent =
                formatearPrecio(
                    precio,
                    monedaActual
                );
        });

    renderizarCarrito();

    const estado =
        document.getElementById("estado-moneda");

    if (estado && tasasCambio) {

        estado.textContent =
            `1 PEN ≈ ${tasasCambio.USD.toFixed(3)} USD · ` +
            `1 PEN ≈ ${tasasCambio.EUR.toFixed(3)} EUR`;
    }
}


// ===============================
// OBTENER TIPO DE CAMBIO
// ===============================

async function cargarTipoCambio() {

    const estado =
        document.getElementById("estado-moneda");

    try {

        const respuesta = await fetch(
            "https://open.er-api.com/v6/latest/PEN"
        );

        if (!respuesta.ok) {
            throw new Error("No disponible");
        }

        const datos =
            await respuesta.json();

        if (datos.result !== "success") {
            throw new Error("Respuesta inválida");
        }

        tasasCambio = datos.rates;

        if (estado) {

            estado.textContent =
                `1 PEN ≈ ${tasasCambio.USD.toFixed(3)} USD · ` +
                `1 PEN ≈ ${tasasCambio.EUR.toFixed(3)} EUR`;
        }

        cambiarMoneda(monedaActual);

    } catch (error) {

        console.warn(
            "No se pudo cargar el tipo de cambio:",
            error
        );

        if (estado) {

            estado.textContent =
                "Tipo de cambio no disponible. " +
                "Se muestran precios en soles.";
        }
    }
}


// ===============================
// AGREGAR PRODUCTO AL CARRITO
// ===============================

function agregarAlCarrito(
    nombre,
    precioPEN,
    boton
) {

    const producto =
        carrito.find(
            item => item.nombre === nombre
        );

    if (producto) {

        producto.cantidad++;

    } else {

        carrito.push({
            nombre: nombre,
            precioPEN: precioPEN,
            cantidad: 1
        });
    }

    guardarCarrito();

    actualizarContadorCarrito();

    renderizarCarrito();


    // Cambiar temporalmente el botón

    if (boton) {

        const textoOriginal =
            boton.innerHTML;

        boton.innerHTML =
            "✓ AGREGADO";

        boton.disabled = true;

        setTimeout(() => {

            boton.innerHTML =
                textoOriginal;

            boton.disabled = false;

        }, 1000);
    }
}


// ===============================
// CAMBIAR CANTIDAD
// ===============================

function cambiarCantidadCarrito(
    nombre,
    cantidad
) {

    const producto =
        carrito.find(
            item => item.nombre === nombre
        );

    if (!producto) return;

    producto.cantidad += cantidad;


    if (producto.cantidad <= 0) {

        carrito =
            carrito.filter(
                item => item.nombre !== nombre
            );
    }

    guardarCarrito();

    actualizarContadorCarrito();

    renderizarCarrito();
}


// ===============================
// ELIMINAR PRODUCTO
// ===============================

function eliminarDelCarrito(nombre) {

    carrito =
        carrito.filter(
            item => item.nombre !== nombre
        );

    guardarCarrito();

    actualizarContadorCarrito();

    renderizarCarrito();
}


// ===============================
// VACIAR CARRITO
// ===============================

function vaciarCarrito() {

    carrito = [];

    guardarCarrito();

    actualizarContadorCarrito();

    renderizarCarrito();
}


// ===============================
// CONTADOR DEL CARRITO
// ===============================

function actualizarContadorCarrito() {

    const contador =
        document.getElementById(
            "contadorCarrito"
        );

    if (!contador) return;

    const total =
        carrito.reduce(
            (suma, producto) =>
                suma + producto.cantidad,
            0
        );

    contador.textContent = total;
}


// ===============================
// MOSTRAR CARRITO
// ===============================

function renderizarCarrito() {

    const lista =
        document.getElementById(
            "listaCarrito"
        );

    const totalElemento =
        document.getElementById(
            "totalCarrito"
        );

    if (!lista || !totalElemento) {
        return;
    }


    // Carrito vacío

    if (carrito.length === 0) {

        lista.innerHTML = `
            <p class="carrito-vacio">
                Tu carrito está vacío.<br>
                Agrega productos para comenzar.
            </p>
        `;

        totalElemento.textContent =
            formatearPrecio(0);

        return;
    }


    let totalPEN = 0;


    lista.innerHTML =
        carrito.map(producto => {

            const subtotal =
                producto.precioPEN *
                producto.cantidad;

            totalPEN += subtotal;


            // Evitar problemas con comillas

            const nombreSeguro =
                producto.nombre
                .replace(/'/g, "\\'");


            return `
                <div class="item-carrito">

                    <div>

                        <p class="item-carrito-nombre">
                            ${producto.nombre}
                        </p>

                        <p class="item-carrito-precio">
                            ${formatearPrecio(subtotal)}
                        </p>

                    </div>


                    <div class="item-carrito-cantidad">

                        <button
                            onclick="cambiarCantidadCarrito('${nombreSeguro}', -1)">
                            −
                        </button>

                        <span>
                            ${producto.cantidad}
                        </span>

                        <button
                            onclick="cambiarCantidadCarrito('${nombreSeguro}', 1)">
                            +
                        </button>

                    </div>


                    <button
                        class="item-carrito-eliminar"
                        onclick="eliminarDelCarrito('${nombreSeguro}')">

                        ×

                    </button>

                </div>
            `;

        }).join("");


    totalElemento.textContent =
        formatearPrecio(totalPEN);
}


// ===============================
// ABRIR / CERRAR CARRITO
// ===============================

function alternarCarrito() {

    const panel =
        document.getElementById(
            "panelCarrito"
        );

    const fondo =
        document.getElementById(
            "fondoCarrito"
        );


    panel.classList.toggle(
        "abierto"
    );

    fondo.classList.toggle(
        "visible"
    );
}


// ===============================
// WHATSAPP - PRODUCTO
// ===============================

function enviarWhatsApp(
    event,
    nombreProducto
) {

    event.preventDefault();

    const numero =
        "51949152796";


    const mensaje =
        `Hola, estoy interesado en el producto: *${nombreProducto}*. ` +
        `¿Podrían darme más información?`;


    window.open(
        `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );
}


// ===============================
// WHATSAPP - CARRITO
// ===============================

function enviarCarritoPorWhatsApp(event) {

    event.preventDefault();


    if (carrito.length === 0) {

        alert(
            "Tu carrito está vacío. " +
            "Agrega productos antes de consultar."
        );

        return;
    }


    let totalPEN = 0;


    const productos =
        carrito.map(producto => {

            const subtotal =
                producto.precioPEN *
                producto.cantidad;

            totalPEN += subtotal;


            return (
                `- ${producto.nombre} x${producto.cantidad} ` +
                `(${formatearPrecio(subtotal)})`
            );

        });


    const mensaje =
        `Hola, quiero consultar por este pedido de SportZone:\n\n` +

        productos.join("\n") +

        `\n\n*Total: ${formatearPrecio(totalPEN)}*`;


    const numero =
        "51966376986";


    window.open(
        `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
        "_blank"
    );
}


// ===============================
// FILTROS DE PRODUCTOS
// ===============================

function iniciarFiltros() {

    const botones =
        document.querySelectorAll(
            ".filter"
        );

    const tarjetas =
        document.querySelectorAll(
            ".product-card"
        );


    botones.forEach(boton => {

        boton.addEventListener(
            "click",
            () => {

                // Quitar activo

                botones.forEach(
                    b =>
                        b.classList.remove(
                            "active"
                        )
                );


                // Activar botón

                boton.classList.add(
                    "active"
                );


                const filtro =
                    boton.dataset.filter;


                tarjetas.forEach(
                    tarjeta => {

                        if (
                            filtro === "Todos" ||
                            tarjeta.dataset.category === filtro
                        ) {

                            tarjeta.classList.remove(
                                "hidden"
                            );

                        } else {

                            tarjeta.classList.add(
                                "hidden"
                            );
                        }

                    }
                );

            }
        );

    });
}


// ===============================
// BOTÓN VOLVER ARRIBA
// ===============================

function iniciarScroll() {

    const boton =
        document.getElementById(
            "btnInicio"
        );


    if (!boton) return;


    window.addEventListener(
        "scroll",
        () => {

            if (window.scrollY > 450) {

                boton.classList.add(
                    "visible"
                );

            } else {

                boton.classList.remove(
                    "visible"
                );
            }

        }
    );
}


// ===============================
// IR AL INICIO
// ===============================

function irAlInicio() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ===============================
// INICIAR PÁGINA
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        actualizarContadorCarrito();

        renderizarCarrito();

        iniciarFiltros();

        iniciarScroll();

        cargarTipoCambio();

    }
);