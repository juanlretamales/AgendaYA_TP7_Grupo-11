const RESERVAS_KEY = "m04-reservas";

function leerReservas(storage) {
    try {
        const reservas = JSON.parse(storage.getItem(RESERVAS_KEY) || "[]");
        return Array.isArray(reservas) ? reservas : [];
    } catch (_) {
        return [];
    }
}

function buscarReserva(reservas, referencia) {
    const indice = Number(referencia.indice);
    if (!Number.isSafeInteger(indice) || indice < 0 || String(indice) !== referencia.indice) return null;
    const reserva = reservas[indice];
    const campos = ["tipoEvento", "fecha", "hora", "nombre", "email"];
    return reserva && campos.every((campo) => reserva[campo] === referencia[campo]) ? reserva : null;
}

function confirmarReserva(storage, referencia) {
    const reservas = leerReservas(storage);
    const reserva = buscarReserva(reservas, referencia);
    if (!reserva || reserva.estado !== "PENDIENTE") return false;
    reserva.estado = "CONFIRMADA";
    storage.setItem(RESERVAS_KEY, JSON.stringify(reservas));
    return true;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { leerReservas, buscarReserva, confirmarReserva };
}

if (typeof document !== "undefined") {
    const parametros = new URLSearchParams(window.location.search);
    const referencia = Object.fromEntries(parametros);
    const reserva = buscarReserva(leerReservas(localStorage), referencia);
    const boton = document.querySelector('[data-cy="btn-confirmar-reserva"]');
    const mensaje = document.querySelector('[data-cy="confirmacion-reserva-exitosa"]');
    const error = document.querySelector('[data-cy="error-confirmacion"]');

    if (!reserva) {
        error.textContent = "La reserva ya no está disponible.";
        error.hidden = false;
        boton.disabled = true;
    } else {
        document.querySelector('[data-cy="destinatario-reserva"]').textContent = reserva.email;
        document.querySelector('[data-cy="nombre-reserva"]').textContent = reserva.nombre;
        document.querySelector('[data-cy="evento-reserva"]').textContent = reserva.tipoEvento;
        document.querySelector('[data-cy="fecha-reserva"]').textContent = reserva.fecha;
        document.querySelector('[data-cy="hora-reserva"]').textContent = reserva.hora;
        boton.disabled = reserva.estado !== "PENDIENTE";
        if (reserva.estado === "CONFIRMADA") {
            mensaje.hidden = false;
        } else if (reserva.estado !== "PENDIENTE") {
            error.textContent = "Esta reserva no está pendiente de confirmación.";
            error.hidden = false;
        }
    }

    boton.addEventListener("click", () => {
        if (confirmarReserva(localStorage, referencia)) {
            boton.disabled = true;
            error.hidden = true;
            mensaje.hidden = false;
        } else {
            boton.disabled = true;
            error.textContent = "La reserva ya no está pendiente o fue eliminada.";
            error.hidden = false;
        }
    });
}
