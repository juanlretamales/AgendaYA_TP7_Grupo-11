describe("AgendaYA - M04 Búsqueda y Solicitud de Cancelación", () => {
    beforeEach(() => {
        cy.visit("/M04 - Proceso de reserva/frontend/proceso_reserva.html");
    });

    it("Permite al usuario buscar sus reservas por email y solicitar cancelar una", () => {
        // Arrange
        const emailDePrueba = "ejemplo@correo.com";
        cy.get('[data-cy="email-busqueda-input"]').type(emailDePrueba);

        // Act
        cy.get('[data-cy="btn-buscar-reservas"]').click();

        // Cypress esperará a que las reservas se rendericen.
        // Agarramos la primera reserva que tenga el botón "Solicitar Cancelación" y le hacemos click
        cy.get('[data-cy="btn-cancelar-reserva"]').first().click();

        // Assert
        // Verificamos que el botón clickeado cambió su texto
        cy.get('[data-cy="btn-cancelar-reserva"]')
            .first()
            .should("contain", "Notificación de cancelación enviada")
            .and("be.disabled")
            .and("have.css", "background-color", "rgb(108, 117, 125)"); // #6c757d en formato RGB
    });
});
