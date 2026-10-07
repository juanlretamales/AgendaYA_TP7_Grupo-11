describe("M04 - Horario no disponible", () => {
    const ruta = "/M04 - Proceso de reserva/frontend/proceso_reserva.html";
    const reserva = {
        tipoEvento: "Consulta",
        fecha: "2026-09-30",
        hora: "10:00",
        nombre: "Otra persona",
        email: "otra@test.com",
        estado: "PENDIENTE",
    };

    it("E2E-01 oculta un horario que ya estaba ocupado", () => {
        // Arrange
        cy.visit(ruta, {
            onBeforeLoad(win) {
                win.localStorage.setItem("m04-reservas", JSON.stringify([reserva]));
            },
        });
        cy.get('[data-cy="service-select"]').select("Consulta");

        // Act
        cy.get('[data-cy="date-select"]').select("2026-09-30");

        // Assert
        cy.get('[data-cy="timeslot-select"] option').then((opciones) => {
            const horas = [...opciones].map((opcion) => opcion.value);
            expect(horas).to.include.members(["09:00", "11:00", "12:00"]);
            expect(horas).not.to.include("10:00");
        });
    });

    it("E2E-02 rechaza un horario ocupado después de seleccionarlo y permite cambiarlo", () => {
        // Arrange
        cy.visit(ruta, {
            onBeforeLoad(win) {
                win.localStorage.removeItem("m04-reservas");
            },
        });
        cy.get('[data-cy="service-select"]').select("Consulta");
        cy.get('[data-cy="date-select"]').select("2026-09-30");
        cy.get('[data-cy="timeslot-select"]').select("11:00");
        const reservaAjena = { ...reserva, hora: "11:00" };
        cy.window().then((win) => win.localStorage.setItem("m04-reservas", JSON.stringify([reservaAjena])));
        cy.get('[data-cy="name-input"]').type("Patricio Zamorano");
        cy.get('[data-cy="email-input"]').type("patricio@test.com");

        // Act
        cy.get('[data-cy="submit-booking"]').click();

        // Assert
        cy.get('[data-cy="time-unavailable-error"]')
            .should("be.visible")
            .and("have.text", "El horario seleccionado ya no está disponible.");
        cy.get('[data-cy="booking-confirmation"]').should("not.be.visible");
        cy.window().then((win) => {
            expect(JSON.parse(win.localStorage.getItem("m04-reservas"))).to.deep.equal([reservaAjena]);
        });
        cy.get('[data-cy="choose-another-time"]').click();
        cy.get('[data-cy="timeslot-select"]').should("be.visible");
        cy.get('[data-cy="timeslot-select"] option[value="11:00"]').should("not.exist");
        cy.get('[data-cy="timeslot-select"]').select("12:00");
        cy.get('[data-cy="name-input"]').should("have.value", "Patricio Zamorano");
        cy.get('[data-cy="submit-booking"]').click();
        cy.get('[data-cy="booking-confirmation"]').should("be.visible");
    });

    it("conserva los datos al retroceder y no crea reservas con datos incompletos", () => {
        // Arrange
        cy.visit(ruta, {
            onBeforeLoad(win) {
                win.localStorage.removeItem("m04-reservas");
            },
        });
        cy.get('[data-cy="service-select"]').select("Consulta");
        cy.get('[data-cy="date-select"]').select("2026-09-30");
        cy.get('[data-cy="timeslot-select"]').select("09:00");
        cy.get('[data-cy="name-input"]').type("Invitado");

        // Act
        cy.get('[data-cy="back-to-time"]').click();
        cy.get('[data-cy="back-to-date"]').click();
        cy.get('[data-cy="date-select"]').should("have.value", "2026-09-30");
        cy.get('[data-cy="continue-to-time"]').click();
        cy.get('[data-cy="timeslot-select"]').should("have.value", "09:00");
        cy.get('[data-cy="timeslot-select"]').select("11:00");
        cy.get('[data-cy="submit-booking"]').click();

        // Assert
        cy.get('[data-cy="name-input"]').should("have.value", "Invitado");
        cy.get('[data-cy="error-message"]').should("be.visible");
        cy.get('[data-cy="booking-confirmation"]').should("not.be.visible");
        cy.window().then((win) => expect(win.localStorage.getItem("m04-reservas")).to.be.null);
    });
});
