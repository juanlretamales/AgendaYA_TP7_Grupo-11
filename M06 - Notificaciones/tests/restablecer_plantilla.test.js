const {
    obtenerPlantillaPredeterminada,
    generarTextoContador
} = require('../src/plantillas');

describe('M06 - Restablecimiento de plantilla', () => {
    describe('obtenerPlantillaPredeterminada', () => {
        it('devuelve la plantilla predeterminada de confirmación', () => {
            // Arrange
            const tipo = 'confirmacion';

            // Act
            const resultado = obtenerPlantillaPredeterminada(tipo);

            // Assert
            expect(resultado).toBe('Estimado/a [Nombre_Invitado], le confirmamos su turno para el día [Fecha] a las [Hora]. Atentamente, Dr. [Nombre_Prof].');
        });

        it('devuelve la plantilla predeterminada de cancelación', () => {
            // Arrange
            const tipo = 'cancelacion';

            // Act
            const resultado = obtenerPlantillaPredeterminada(tipo);

            // Assert
            expect(resultado).toBe('Estimado/a [Nombre_Invitado], le informamos que su turno programado para el día [Fecha] a las [Hora] ha sido cancelado. Atentamente, Dr. [Nombre_Prof].');
        });

        it('devuelve una cadena vacía para un tipo inexistente', () => {
            // Arrange
            const tipo = 'inexistente';

            // Act
            const resultado = obtenerPlantillaPredeterminada(tipo);

            // Assert
            expect(resultado).toBe('');
        });
    });

    describe('generarTextoContador', () => {
        it('cuenta los caracteres de una plantilla, incluidas sus variables', () => {
            // Arrange
            const texto = 'Estimado/a [Nombre_Invitado], le confirmamos su turno para el día [Fecha] a las [Hora]. Atentamente, Dr. [Nombre_Prof].';

            // Act
            const resultado = generarTextoContador(texto);

            // Assert
            expect(resultado).toBe(`${texto.length} / 2000 caracteres`);
        });

        it('muestra cero caracteres cuando el texto está vacío', () => {
            // Arrange
            const texto = '';

            // Act
            const resultado = generarTextoContador(texto);

            // Assert
            expect(resultado).toBe('0 / 2000 caracteres');
        });
    });
});
