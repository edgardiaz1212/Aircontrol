/**
 * main.js - Funciones generales para la aplicación de Monitoreo AC
 */

// Funciones de utilidad para formateo de datos
const formatoFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatoTemperatura = (temp) => {
    return parseFloat(temp).toFixed(1) + '°C';
};

const formatoHumedad = (hum) => {
    return parseFloat(hum).toFixed(1) + '%';
};

// Función para mostrar notificaciones
const mostrarNotificacion = (mensaje, tipo = 'success') => {
    // Crea un elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Añade la alerta al inicio del contenedor principal
    const contenedor = document.querySelector('.container-fluid');
    contenedor.insertBefore(alerta, contenedor.firstChild);
    
    // Elimina automáticamente la alerta después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.parentNode.removeChild(alerta);
        }
    }, 5000);
};

// Función para confirmar acciones destructivas
const confirmarAccion = (mensaje, callback) => {
    if (confirm(mensaje)) {
        callback();
    }
};

// Manejador para inicializar tooltips y popovers de Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map((tooltipTriggerEl) => {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map((popoverTriggerEl) => {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Inicializar datepickers
    const datepickers = document.querySelectorAll('.datepicker');
    if (datepickers.length > 0) {
        // Si se implementan datepickers personalizados
    }
    
    // Manejador para botones con confirmación
    const botonesConfirmacion = document.querySelectorAll('[data-confirm]');
    botonesConfirmacion.forEach(boton => {
        boton.addEventListener('click', (e) => {
            const mensaje = boton.getAttribute('data-confirm');
            if (!confirm(mensaje)) {
                e.preventDefault();
            }
        });
    });
});