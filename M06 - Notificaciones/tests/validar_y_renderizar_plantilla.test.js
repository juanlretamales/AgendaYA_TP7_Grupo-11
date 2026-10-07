const { validarPlantilla, renderizarPlantilla } = require("../src/plantillas");

describe("M06 - Validación y Renderizado de Plantillas de Email (US_005 / M06-R04F)", () => {
    // ── Test 1: Caso Normal ──────────────────────────────────────────────────
    it("validarPlantilla aprueba una plantilla válida con [Fecha], [Hora] y tamaño permitido", () => {
        // Arrange
        const texto = "Estimado/a [Nombre_Invitado], su turno es el [Fecha] a las [Hora]. Dr. [Nombre_Prof].";

        // Act
        const resultado = validarPlantilla(texto);

        // Assert
        expect(resultado.valida).toBe(true);
        expect(resultado.error).toBeUndefined();
    });

    // ── Test 2: Caso Inválido ────────────────────────────────────────────────
    it("validarPlantilla rechaza si falta [Fecha] o si falta [Hora] e indica el motivo", () => {
        // Arrange
        const sinFecha = "Su turno es a las [Hora]. Gracias.";
        const sinHora = "Su turno es el [Fecha]. Gracias.";

        // Act
        const resultadoSinFecha = validarPlantilla(sinFecha);
        const resultadoSinHora = validarPlantilla(sinHora);

        // Assert
        expect(resultadoSinFecha.valida).toBe(false);
        expect(resultadoSinFecha.error).toContain("[Fecha]");

        expect(resultadoSinHora.valida).toBe(false);
        expect(resultadoSinHora.error).toContain("[Hora]");
    });

    // ── Test 3: Límite / Borde ───────────────────────────────────────────────
    it("validarPlantilla acepta exactamente 2000 caracteres y rechaza 2001 caracteres", () => {
        // Arrange: construir un texto base válido con [Fecha] y [Hora]
        const base = "Turno: [Fecha] [Hora] "; // 21 caracteres, contiene ambas vars
        const relleno = "x".repeat(2000 - base.length);

        const texto2000 = base + relleno; // exactamente 2000 chars
        const texto2001 = base + relleno + "y"; // 2001 chars

        // Act
        const resultado2000 = validarPlantilla(texto2000);
        const resultado2001 = validarPlantilla(texto2001);

        // Assert
        expect(texto2000.length).toBe(2000);
        expect(resultado2000.valida).toBe(true);

        expect(texto2001.length).toBe(2001);
        expect(resultado2001.valida).toBe(false);
        expect(resultado2001.error).toContain("2000");
    });

    // ── Test 4: Caso Normal ──────────────────────────────────────────────────
    it("renderizarPlantilla reemplaza correctamente todas las etiquetas con los datos reales del turno", () => {
        // Arrange
        const plantilla = "Estimado/a [Nombre_Invitado], su turno es el [Fecha] a las [Hora]. Dr. [Nombre_Prof].";
        const datos = {
            Nombre_Invitado: "María López",
            Fecha: "15/10/2026",
            Hora: "10:30",
            Nombre_Prof: "García",
        };

        // Act
        const resultado = renderizarPlantilla(plantilla, datos);

        // Assert
        expect(resultado).toBe("Estimado/a María López, su turno es el 15/10/2026 a las 10:30. Dr. García.");
        expect(resultado).not.toContain("[");
    });

    // ── Test 5: Borde / Error ────────────────────────────────────────────────
    it("renderizarPlantilla maneja valores vacíos, nulos o datos faltantes sin lanzar excepción", () => {
        // Arrange
        const plantilla = "Hola [Nombre_Invitado], turno: [Fecha] a las [Hora].";

        // Act & Assert: datos parciales (falta Hora)
        expect(() => {
            const resultado = renderizarPlantilla(plantilla, { Nombre_Invitado: "Carlos", Fecha: "01/01/2027" });
            // [Hora] sin valor → debe quedar como literal [Hora], sin romper
            expect(resultado).toContain("[Hora]");
            expect(resultado).toContain("Carlos");
        }).not.toThrow();

        // Act & Assert: valor null explícito
        expect(() => {
            const resultado = renderizarPlantilla(plantilla, {
                Nombre_Invitado: null,
                Fecha: "01/01/2027",
                Hora: "09:00",
            });
            // null → etiqueta intacta
            expect(resultado).toContain("[Nombre_Invitado]");
        }).not.toThrow();

        // Act & Assert: objeto datos es null
        expect(() => {
            renderizarPlantilla(plantilla, null);
        }).not.toThrow();

        // Act & Assert: plantilla no es string
        expect(() => {
            const resultado = renderizarPlantilla(null, {});
            expect(resultado).toBe("");
        }).not.toThrow();
    });
});
