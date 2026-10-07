describe("AgendaYA - M04 Proceso de Reserva Público", () => {
    beforeEach(() => {
        cy.visit("/M04 - Proceso de reserva/frontend/proceso_reserva.html", {
            onBeforeLoad(win) {
                win.localStorage.removeItem("m04-reservas");
            },
        });
    });

    it("Permite completar el flujo completo de reserva exitosa (Happy Path)", () => {
        // Arrange
        cy.get('[data-cy="service-select"]').select("Consulta Inicial");
        cy.get('[data-cy="date-select"]').select("2026-10-15");
        cy.get('[data-cy="timeslot-select"]').select("10:00");
        cy.get('[data-cy="name-input"]').type("Patricio Zamorano");
        cy.get('[data-cy="email-input"]').type("patricio.zamorano@test.com");

        // Act
        cy.get('[data-cy="submit-booking"]').click();

        // Assert
        cy.get('[data-cy="booking-confirmation"]')
            .should("be.visible")
            .and("contain", "¡Reserva Pendiente de Confirmación!")
            .and("contain", "Patricio Zamorano");

        cy.get('[data-cy="notifications-log"]').should("contain", "patricio.zamorano@test.com");
        cy.window().then((win) => {
            expect(JSON.parse(win.localStorage.getItem("m04-reservas"))).to.deep.include({
                tipoEvento: "Consulta Inicial",
                fecha: "2026-10-15",
                hora: "10:00",
                nombre: "Patricio Zamorano",
                email: "patricio.zamorano@test.com",
                estado: "PENDIENTE",
            });
        });
        cy.get('[data-cy="email-busqueda-input"]').type("patricio.zamorano@test.com");
        cy.get('[data-cy="btn-buscar-reservas"]').click();
        cy.get('[data-cy="mis-reservas-container"]').should("contain", "Consulta Inicial").and("contain", "pendiente");
    });
});
