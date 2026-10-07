describe("AgendaYA - M06 Configuración de Plantillas de Email (US_005 / M06-R04F)", () => {
    beforeEach(() => {
        cy.visit("/M06 - Notificaciones/frontend/plantillas.html");
    });

    it("Guarda la plantilla exitosamente cuando contiene [Fecha] y [Hora] (Happy Path)", () => {
        // Arrange: seleccionar tipo de evento y redactar plantilla con variables obligatorias
        cy.get('[data-cy="event-type-select"]').select("Ortodoncia");
        cy.get('[data-cy="template-textarea"]').clear();
        cy.get('[data-cy="template-textarea"]').type(
            "Estimado/a [Nombre_Invitado], le recordamos su turno de Ortodoncia el día "
        );
        cy.get('[data-cy="btn-var-fecha"]').click();
        cy.get('[data-cy="template-textarea"]').type(" a las ");
        cy.get('[data-cy="btn-var-hora"]').click();
        cy.get('[data-cy="template-textarea"]').type(". Atentamente, Dr. [Nombre_Prof].");

        // Act: guardar la plantilla
        cy.get('[data-cy="btn-save-template"]').click();

        // Assert: el modal de éxito debe ser visible con el mensaje correcto
        cy.get('[data-cy="success-modal"]').should("be.visible");
        cy.get('[data-cy="success-message"]').should("contain", "Cambios guardados con éxito");
        cy.get('[data-cy="template-error"]').should("not.be.visible");
    });
});
