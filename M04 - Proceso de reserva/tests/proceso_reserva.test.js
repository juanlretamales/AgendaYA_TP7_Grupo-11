const {
    validarEmail,
    cumpleAntelacionMinima,
    estaHorarioDisponible,
    esCancelable,
    buscarReservasPorEmail,
    solicitarCancelacion,
    confirmarCancelacion,
} = require("../src/proceso_reserva");

describe("Suite de Tests Unitarios - Integrante 1 (M04 Booking)", () => {
    // Test 1: Caso normal válido
    it("Debe retornar true para un email válido estándar", () => {
        expect(validarEmail("invitado@test.com")).toBe(true);
    });

    // Test 2: Caso de error / inválido (sin arroba ni dominio)
    it("Debe retornar false si el email no contiene el símbolo @ ni dominio", () => {
        expect(validarEmail("invitadotest.com")).toBe(false);
    });

    // Test 3: Caso límite / borde (espacios antes o después)
    it("Debe retornar true si el email tiene espacios en blanco al inicio o final (haciendo trim)", () => {
        expect(validarEmail("  usuario@empresa.com  ")).toBe(true);
    });

    // Test 4: Caso de error / inválido (tipo nulo o vacío)
    it("Debe retornar false si el email es null, undefined o una cadena vacía", () => {
        expect(validarEmail("")).toBe(false);
        expect(validarEmail(null)).toBe(false);
        expect(validarEmail(undefined)).toBe(false);
    });

    // Test 5: Caso de función 2 (Caso normal y borde de antelación)
    it("Debe retornar true si la fecha del turno supera la antelación mínima de 2 horas", () => {
        const fechaFutura = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(); // 4 horas en el futuro
        expect(cumpleAntelacionMinima(fechaFutura, 2)).toBe(true);
    });
});

describe("Disponibilidad de horarios M04", () => {
    const reserva = { tipoEvento: "Consulta", fecha: "2026-09-30", hora: "10:00", estado: "PENDIENTE" };

    // Test 6: Un horario ocupado solo afecta a la combinación exacta
    it("ocupa solo la combinación exacta de evento, fecha y hora", () => {
        expect(estaHorarioDisponible("Consulta", "2026-09-30", "10:00", [reserva])).toBe(false);
        expect(estaHorarioDisponible("Seguimiento", "2026-09-30", "10:00", [reserva])).toBe(true);
        expect(estaHorarioDisponible("Consulta", "2026-10-01", "10:00", [reserva])).toBe(true);
        expect(estaHorarioDisponible("Consulta", "2026-09-30", "11:00", [reserva])).toBe(true);
    });

    // Test 7: Las reservas temporales y canceladas no bloquean horarios
    it("no bloquea por una selección temporal o una reserva cancelada", () => {
        expect(
            estaHorarioDisponible("Consulta", "2026-09-30", "10:00", [
                { ...reserva, estado: "TEMPORAL" },
                { ...reserva, estado: "CANCELADA" },
            ])
        ).toBe(true);
        expect(estaHorarioDisponible("Consulta", "2026-09-30", "10:00", [{ ...reserva, estado: "CONFIRMADA" }])).toBe(
            false
        );
    });

    // Test 8: Una reserva pendiente sigue bloqueando aunque haya otra cancelada
    it("mantiene ocupado el horario si hay una reserva pendiente junto a una cancelada", () => {
        const reservas = [{ ...reserva, estado: "CANCELADA" }, reserva];
        expect(estaHorarioDisponible("Consulta", "2026-09-30", "10:00", reservas)).toBe(false);
    });
});

describe("Cancelación de reservas M04", () => {
    // ==========================================
    // Nuevos Tests para Cancelación (M04) - Nuevo Flujo
    // ==========================================

    // Test 9: buscarReservasPorEmail con email inválido
    it("buscarReservasPorEmail debe retornar un array vacío si el email es inválido", () => {
        const reservas = [{ email: "test@test.com" }];
        expect(buscarReservasPorEmail("inválido", reservas)).toEqual([]);
    });

    // Test 10: buscarReservasPorEmail devuelve solo las reservas del correo indicado
    it("buscarReservasPorEmail filtra las reservas de otras personas", () => {
        const propia1 = { id: 1, email: "invitado@test.com" };
        const ajena = { id: 2, email: "otra@test.com" };
        const propia2 = { id: 3, email: "invitado@test.com" };
        expect(buscarReservasPorEmail("invitado@test.com", [propia1, ajena, propia2])).toEqual([propia1, propia2]);
    });

    // Test 11: solicitarCancelacion (Error)
    it("solicitarCancelacion debe retornar null si la reserva no cumple antelación de 24hs", () => {
        const ahora = new Date("2026-01-01T10:00:00Z");
        const reserva = { id: 1, estado: "confirmada", fecha: new Date("2026-01-02T09:59:59Z").toISOString() };
        expect(solicitarCancelacion(reserva, ahora)).toBeNull();
    });

    // Test 12: solicitarCancelacion (Normal)
    it("solicitarCancelacion debe retornar el token si la reserva cumple la regla (>24hs)", () => {
        const ahora = new Date("2026-01-01T10:00:00Z");
        const reserva = { id: 1, estado: "confirmada", fecha: new Date("2026-01-03T10:00:00Z").toISOString() };
        const token = solicitarCancelacion(reserva, ahora);
        expect(token).not.toBeNull();
        expect(token.reservaId).toBe(1);
    });

    // Test 13: confirmarCancelacion (Normal)
    it("confirmarCancelacion debe cambiar estado a cancelada y retornar true si faltan <= 15 mins", () => {
        const reserva = { id: 1, estado: "confirmada" };
        const fechaSolicitud = new Date("2026-01-01T10:00:00Z");
        const fechaConfirmacion = new Date("2026-01-01T10:05:00Z"); // 5 minutos después
        const exito = confirmarCancelacion(reserva, fechaSolicitud.toISOString(), fechaConfirmacion);
        expect(exito).toBe(true);
        expect(reserva.estado).toBe("cancelada");
    });

    // Test 14: confirmarCancelacion no cancela después de los 15 minutos
    it("confirmarCancelacion rechaza una solicitud vencida sin cambiar el estado", () => {
        const reserva = { id: 1, estado: "confirmada" };
        const fechaSolicitud = "2026-01-01T10:00:00Z";
        const fechaConfirmacion = new Date("2026-01-01T10:16:00Z");
        expect(confirmarCancelacion(reserva, fechaSolicitud, fechaConfirmacion)).toBe(false);
        expect(reserva.estado).toBe("confirmada");
    });

    // Test 15: solicitarCancelacion (Error de estado)
    it("solicitarCancelacion debe retornar null si la reserva ya se encuentra cancelada", () => {
        const ahora = new Date("2026-01-01T10:00:00Z");
        const reserva = { id: 1, estado: "cancelada", fecha: new Date("2026-01-03T10:00:00Z").toISOString() };
        expect(solicitarCancelacion(reserva, ahora)).toBeNull();
    });
});
