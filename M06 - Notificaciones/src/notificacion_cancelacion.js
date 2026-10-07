// M06 - Notificacion de cancelacion de reserva

function validarEmail(email) {
    if (!email || typeof email !== "string") return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
}

function procesarNotificacionCancelacion(reserva) {
    if (!reserva || typeof reserva !== "object") {
        throw new Error("Reserva inválida");
    }

    // Validación de formato de email
    if (!validarEmail(reserva.email)) {
        throw new Error("Email inválido");
    }

    // Regla de negocio: Si no está cancelada, no emite notificación
    if (reserva.estado !== "cancelado") {
        return { enviado: false, motivo: "La reserva no está cancelada" };
    }

    // Caso normal exitoso
    return {
        enviado: true,
        destinatario: reserva.email,
        asunto: `Tu reserva ${reserva.id} ha sido cancelada`,
        mensaje: `Hola ${reserva.nombre || "Usuario"}, confirmamos la baja de tu turno para ${reserva.servicio}.`,
    };
}

module.exports = { validarEmail, procesarNotificacionCancelacion };
