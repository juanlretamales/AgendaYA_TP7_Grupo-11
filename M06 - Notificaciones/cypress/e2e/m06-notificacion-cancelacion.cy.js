describe("AgendaYA - M06 Notificaciones: Cancelación de Reserva", () => {
    beforeEach(() => {
        // Abre el frontend local con la vista simulada del correo
        cy.visit("M06 - Notificaciones/frontend/cancelar_reserva.html");
    });

    it("Flujo completo: hacer clic en el correo, confirmar con email y verificar cancelacion", () => {
        // Arrange: preparar los datos de prueba
        const emailInvitado = "juan@test.com";

        // Act: interactuar con la interfaz del correo y del formulario
        // 1. Clic en el enlace "aquí" del mail recibido
        cy.get('[data-cy="link-cancelar-reserva"]').click();

        // 2. Ingreso del correo y confirmación de baja
        cy.get('[data-cy="email-input"]').type(emailInvitado);
        cy.get('[data-cy="btn-confirmar-baja"]').click();

        // Assert: verificar los resultados esperados en pantalla
        cy.get('[data-cy="confirmacion-cancelacion"]')
            .should("be.visible")
            .and("contain.text", "ha sido cancelada")
            .and("contain.text", emailInvitado);

        cy.get('[data-cy="error-mensaje"]').should("not.be.visible");
    });
});
