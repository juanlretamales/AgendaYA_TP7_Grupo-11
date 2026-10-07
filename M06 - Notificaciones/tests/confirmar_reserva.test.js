const { leerReservas, buscarReserva, confirmarReserva } = require("../src/confirmar_reserva");

const primera = {
    tipoEvento: "Consulta",
    fecha: "2026-09-30",
    hora: "09:00",
    nombre: "Ana",
    email: "ana@test.com",
    estado: "PENDIENTE",
};
const ultima = {
    tipoEvento: "Seguimiento",
    fecha: "2026-10-16",
    hora: "10:00",
    nombre: "Bruno",
    email: "bruno@test.com",
    estado: "PENDIENTE",
};
const referencia = {
    indice: "1",
    tipoEvento: ultima.tipoEvento,
    fecha: ultima.fecha,
    hora: ultima.hora,
    nombre: ultima.nombre,
    email: ultima.email,
};

function storageCon(reservas) {
    let dato = reservas;
    return {
        getItem: jest.fn(() => dato),
        setItem: jest.fn((_, valor) => {
            dato = valor;
        }),
    };
}

describe("Confirmación de reserva desde mail M06", () => {
    it("lee un array vacío si localStorage fue limpiado o contiene JSON inválido", () => {
        expect(leerReservas(storageCon(null))).toEqual([]);
        expect(leerReservas(storageCon("{malformado"))).toEqual([]);
    });

    it("selecciona la última reserva por índice y sus datos reales", () => {
        expect(buscarReserva([primera, ultima], referencia)).toEqual(ultima);
    });

    it("rechaza índices inválidos o referencias que ya no coinciden con el array", () => {
        expect(buscarReserva([primera, ultima], { ...referencia, indice: "-1" })).toBeNull();
        expect(buscarReserva([primera, ultima], { ...referencia, indice: "0" })).toBeNull();
        expect(buscarReserva([primera, ultima], { ...referencia, email: "otra@test.com" })).toBeNull();
    });

    it("confirma solo la reserva correspondiente y conserva las otras", () => {
        const storage = storageCon(JSON.stringify([primera, ultima]));
        expect(confirmarReserva(storage, referencia)).toBe(true);
        const guardadas = leerReservas(storage);
        expect(guardadas[0]).toEqual(primera);
        expect(guardadas[1]).toEqual({ ...ultima, estado: "CONFIRMADA" });
    });

    it("no escribe si borraron las reservas o la reserva ya no está PENDIENTE", () => {
        const vacio = storageCon(null);
        expect(confirmarReserva(vacio, referencia)).toBe(false);
        expect(vacio.setItem).not.toHaveBeenCalled();
        const confirmada = storageCon(JSON.stringify([primera, { ...ultima, estado: "CONFIRMADA" }]));
        expect(confirmarReserva(confirmada, referencia)).toBe(false);
        expect(confirmada.setItem).not.toHaveBeenCalled();
    });
});
