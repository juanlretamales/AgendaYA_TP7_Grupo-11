const { validarEmail, procesarNotificacionCancelacion } = require("../src/notificacion_cancelacion");

describe("M06 - Lógica de Cancelación de reserva - Tests unitarios", () => {
    //Función: validarEmail
    describe("validarEmail", () => {
        // Test 1: Caso normal (Happy Path)
        it("retorna true ante una dirección de email con formato válido estándar", () => {
            const resultado = validarEmail("juan@test.com");
            expect(resultado).toBe(true);
        });

        // Test 2: Caso límite / borde ( mail sin arroba ni dominio)
        it("retorna false si el string carece de dominio o del símbolo @", () => {
            expect(validarEmail("juansinarroba.com")).toBe(false);
            expect(validarEmail("juan@")).toBe(false);
            expect(validarEmail("")).toBe(false);
        });
    });

    //Función: procesarNotificacionCancelacion
    describe("procesarNotificacionCancelacion", () => {
        // Test 3: Caso normal (Happy Path)
        it("genera la notificación con enviado: true y asunto correcto si el estado es cancelado", () => {
            const reservaValida = {
                id: "RES-105",
                nombre: "Juan",
                servicio: "Ortodoncia",
                email: "juan@test.com",
                estado: "cancelado",
            };

            const respuesta = procesarNotificacionCancelacion(reservaValida);

            expect(respuesta.enviado).toBe(true);
            expect(respuesta.destinatario).toBe("juan@test.com");
            expect(respuesta.asunto).toContain("cancelada");
        });

        // Test 4: Caso límite / borde (regla de control de estado)
        it("retorna enviado: false si la reserva todavía figura con estado confirmado", () => {
            const reservaActiva = {
                id: "RES-105",
                nombre: "Juan",
                servicio: "Ortodoncia",
                email: "juan@test.com",
                estado: "confirmado",
            };

            const respuesta = procesarNotificacionCancelacion(reservaActiva);

            expect(respuesta.enviado).toBe(false);
            expect(respuesta.motivo).toBe("La reserva no está cancelada");
        });

        // Test 5: Caso de error / excepción
        it('lanza una excepción con "Email inválido" si los datos de la reserva contienen un mail corrupto', () => {
            const reservaEmailInvalido = {
                id: "RES-105",
                nombre: "Juan",
                servicio: "Ortodoncia",
                email: "juan-sin-formato",
                estado: "cancelado",
            };

            expect(() => {
                procesarNotificacionCancelacion(reservaEmailInvalido);
            }).toThrow("Email inválido");
        });
    });
});
