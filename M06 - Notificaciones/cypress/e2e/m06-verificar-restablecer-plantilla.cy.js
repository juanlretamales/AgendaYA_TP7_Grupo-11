describe('AgendaYA - M06 Verificar restablecer plantilla', () => {

    beforeEach(() => {
        cy.visit('/M06 - Notificaciones/frontend/plantillas.html');
    });

    it('Restablece la plantilla predeterminada de confirmación y actualiza el contador', () => {
        // Arrange
        const plantillaPredeterminada = 'Estimado/a [Nombre_Invitado], le confirmamos su turno para el día [Fecha] a las [Hora]. Atentamente, Dr. [Nombre_Prof].';
        cy.get('[data-cy="tab-confirmacion"]').click();
        const plantilla = 'Le recordamos su turno el día [Fecha] a las [Hora].';
        cy.get('[data-cy="template-textarea"]').clear().type(plantilla);
        cy.get('[data-cy="template-textarea"]').should('have.value', plantilla);
        cy.get('[data-cy="char-counter"]')
            .should('have.text', `${plantilla.length} / 2000 caracteres`);

        // Act
        cy.get('[data-cy="btn-reset-template"]').click();

        // Assert
        cy.get('[data-cy="template-textarea"]').should('have.value', plantillaPredeterminada);
        cy.get('[data-cy="char-counter"]')
            .should('have.text', `${plantillaPredeterminada.length} / 2000 caracteres`);
    });

});
