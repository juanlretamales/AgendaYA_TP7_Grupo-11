describe('M04 a M06 - Mail de confirmación de reserva', () => {
    const rutaM04 = '/M04 - Proceso de reserva/frontend/proceso_reserva.html';

    function crearReserva(nombre, email, hora) {
        cy.get('[data-cy="service-select"]').select('Consulta Inicial');
        cy.get('[data-cy="date-select"]').select('2026-10-15');
        cy.get('[data-cy="timeslot-select"]').select(hora);
        cy.get('[data-cy="name-input"]').type(nombre);
        cy.get('[data-cy="email-input"]').type(email);
        cy.get('[data-cy="submit-booking"]').click();
    }

    it('abre el mail de la última de dos reservas y confirma solo esa', () => {
        // Arrange
        cy.visit(rutaM04, { onBeforeLoad(win) { win.localStorage.removeItem('m04-reservas'); } });
        crearReserva('Ana Pérez', 'ana@test.com', '10:00');
        cy.visit(rutaM04);
        crearReserva('Bruno Díaz', 'bruno@test.com', '11:00');

        // Act
        cy.get('[data-cy="btn-ver-mail-confirmacion"]').should('be.visible').click();
        cy.location('pathname').should('include', '/M06%20-%20Notificaciones/frontend/confirmar_reserva.html');
        cy.get('[data-cy="nombre-reserva"]').should('have.text', 'Bruno Díaz');
        cy.get('[data-cy="evento-reserva"]').should('have.text', 'Consulta Inicial');
        cy.get('[data-cy="fecha-reserva"]').should('have.text', '2026-10-15');
        cy.get('[data-cy="hora-reserva"]').should('have.text', '11:00');
        cy.get('[data-cy="destinatario-reserva"]').should('have.text', 'bruno@test.com');
        cy.get('[data-cy="btn-cancelar-deshabilitado"]').should('be.disabled');
        cy.get('[data-cy="btn-confirmar-reserva"]').should('be.enabled').click();

        // Assert
        cy.get('[data-cy="confirmacion-reserva-exitosa"]').should('be.visible').and('contain', 'Reserva confirmada correctamente');
        cy.get('[data-cy="btn-confirmar-reserva"]').should('be.disabled');
        cy.window().then(win => {
            const reservas = JSON.parse(win.localStorage.getItem('m04-reservas'));
            expect(reservas).to.have.length(2);
            expect(reservas[0].estado).to.equal('PENDIENTE');
            expect(reservas[1].estado).to.equal('CONFIRMADA');
        });
    });

    it('no confirma una reserva que se eliminó de localStorage después de abrir el mail', () => {
        // Arrange
        cy.visit(rutaM04, { onBeforeLoad(win) { win.localStorage.removeItem('m04-reservas'); } });
        crearReserva('Ana Pérez', 'ana@test.com', '10:00');
        cy.get('[data-cy="btn-ver-mail-confirmacion"]').click();
        cy.window().then(win => win.localStorage.removeItem('m04-reservas'));

        // Act
        cy.get('[data-cy="btn-confirmar-reserva"]').click();

        // Assert
        cy.get('[data-cy="error-confirmacion"]').should('be.visible');
        cy.get('[data-cy="confirmacion-reserva-exitosa"]').should('not.be.visible');
        cy.window().then(win => expect(win.localStorage.getItem('m04-reservas')).to.be.null);
    });
});
