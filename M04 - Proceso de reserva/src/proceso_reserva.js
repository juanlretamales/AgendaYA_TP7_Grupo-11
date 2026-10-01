function validarEmail(email) {
    if (typeof email !== 'string') return false;
    const trimmed = email.trim();
    if (trimmed.length === 0) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function cumpleAntelacionMinima(fechaTurno, horasMinimas = 2) {
    if (!fechaTurno) return false;
    const turno = new Date(fechaTurno);
    const ahora = new Date();
    if (isNaN(turno.getTime())) return false;
    return (turno.getTime() - ahora.getTime()) / (1000 * 60 * 60) >= horasMinimas;
}

// Una selección temporal no bloquea el turno; una reserva pendiente o confirmada sí.
function estaHorarioDisponible(tipoEvento, fecha, hora, reservas) {
    return !reservas.some(reserva =>
        reserva.tipoEvento === tipoEvento &&
        reserva.fecha === fecha &&
        reserva.hora === hora &&
        ['PENDIENTE', 'CONFIRMADA'].includes(String(reserva.estado).toUpperCase())
    );
}

// Función 3: Verifica si una reserva es cancelable (Estado confirmada y > 24hs)
function esCancelable(reserva, fechaActual = new Date()) {
    if (!reserva || reserva.estado !== 'confirmada') return false;
    const fechaReserva = new Date(reserva.fecha);
    if (isNaN(fechaReserva.getTime())) return false;

    const diferenciaMs = fechaReserva.getTime() - fechaActual.getTime();
    const horasDiferencia = diferenciaMs / (1000 * 60 * 60);
    return horasDiferencia >= 24;
}

// Función 4: Busca reservas por email (reutiliza validarEmail)
function buscarReservasPorEmail(email, reservas) {
    if (!validarEmail(email)) return [];
    return reservas.filter(r => r.email === email);
}

// Función 5: Solicita cancelación (valida y genera token de expiración)
function solicitarCancelacion(reserva, fechaActual = new Date()) {
    if (!esCancelable(reserva, fechaActual)) return null;
    // Simula generar un token con 15 minutos de validez
    return {
        reservaId: reserva.id,
        fechaSolicitud: fechaActual.toISOString()
    };
}

// Función 6: Confirma cancelación validando 15 minutos (900000 ms)
function confirmarCancelacion(reserva, fechaSolicitudIso, fechaConfirmacion = new Date()) {
    if (!reserva || reserva.estado !== 'confirmada') return false;
    const fechaSolicitud = new Date(fechaSolicitudIso);
    if (isNaN(fechaSolicitud.getTime())) return false;

    const diferenciaMs = fechaConfirmacion.getTime() - fechaSolicitud.getTime();
    if (diferenciaMs >= 0 && diferenciaMs <= 15 * 60 * 1000) {
        reserva.estado = 'cancelada';
        return true;
    }
    return false;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { validarEmail, cumpleAntelacionMinima, estaHorarioDisponible, esCancelable, buscarReservasPorEmail, solicitarCancelacion, confirmarCancelacion };
}

const horariosConfigurados = {
    Consulta: { '2026-09-30': ['09:00', '10:00', '11:00', '12:00'] },
    'Consulta Inicial': { '2026-10-15': ['10:00', '11:00'] },
    Seguimiento: { '2026-10-16': ['09:00', '10:00'] }
};
const reservasKey = 'm04-reservas';
const form = typeof document !== 'undefined' ? document.getElementById('booking-form') : null;

if (form) {
    const serviceSelect = document.getElementById('service-select');
    const dateSelect = document.getElementById('date-select');
    const timeslotSelect = document.getElementById('timeslot-select');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const steps = {
        event: document.getElementById('step-event'),
        date: document.getElementById('step-date'),
        time: document.getElementById('step-time')
    };
    const summary = document.querySelector('[data-cy="booking-summary"]');
    const summaryService = document.getElementById('summary-service');
    const summaryDate = document.getElementById('summary-date');
    const summaryTime = document.getElementById('summary-time');
    const errorDiv = document.querySelector('[data-cy="error-message"]');
    const unavailableDiv = document.querySelector('[data-cy="time-unavailable-error"]');
    const chooseAnotherTime = document.querySelector('[data-cy="choose-another-time"]');
    const continueToDate = document.querySelector('[data-cy="continue-to-date"]');
    const continueToTime = document.querySelector('[data-cy="continue-to-time"]');
    const continueToDetails = document.querySelector('[data-cy="continue-to-details"]');
    const successDiv = document.querySelector('[data-cy="booking-confirmation"]');
    const mailLink = document.querySelector('[data-cy="btn-ver-mail-confirmacion"]');
    const notificationsLog = document.getElementById('notifications-log');

    function leerReservas() {
        try {
            const reservas = JSON.parse(localStorage.getItem(reservasKey) || '[]');
            return Array.isArray(reservas) ? reservas : [];
        } catch (_) {
            return [];
        }
    }

    function mostrarPaso(paso) {
        Object.entries(steps).forEach(([nombre, elemento]) => {
            elemento.hidden = nombre !== paso;
        });
        summary.hidden = paso !== 'details';
        form.hidden = paso !== 'details';
        continueToDate.hidden = paso !== 'event' || !serviceSelect.value;
        continueToTime.hidden = paso !== 'date' || !dateSelect.value;
        continueToDetails.hidden = paso !== 'time' || !timeslotSelect.value;
    }

    function ocultarErrores() {
        errorDiv.hidden = true;
        unavailableDiv.hidden = true;
        chooseAnotherTime.hidden = true;
    }

    function agregarOpcion(select, valor, texto) {
        const opcion = document.createElement('option');
        opcion.value = valor;
        opcion.textContent = texto;
        select.appendChild(opcion);
    }
    function horariosLibres() {
        const horarios = horariosConfigurados[serviceSelect.value]?.[dateSelect.value] || [];
        const reservas = leerReservas();
        return horarios.filter(hora => estaHorarioDisponible(serviceSelect.value, dateSelect.value, hora, reservas));
    }

    function actualizarResumen() {
        summaryService.textContent = serviceSelect.value;
        summaryDate.textContent = dateSelect.value;
        summaryTime.textContent = timeslotSelect.value;
    }

    function actualizarFechas() {
        const anterior = dateSelect.value;
        dateSelect.replaceChildren();
        agregarOpcion(dateSelect, '', '-- Elija una fecha --');
        const reservas = leerReservas();
        Object.entries(horariosConfigurados[serviceSelect.value] || {}).forEach(([fecha, horarios]) => {
            if (horarios.some(hora => estaHorarioDisponible(serviceSelect.value, fecha, hora, reservas))) {
                agregarOpcion(dateSelect, fecha, fecha);
            }
        });
        if ([...dateSelect.options].some(opcion => opcion.value === anterior)) dateSelect.value = anterior;
        else timeslotSelect.value = '';
    }

    function actualizarHorarios() {
        const anterior = timeslotSelect.value;
        timeslotSelect.replaceChildren();
        agregarOpcion(timeslotSelect, '', '-- Elija un horario --');
        horariosLibres().forEach(hora => agregarOpcion(timeslotSelect, hora, hora));
        if ([...timeslotSelect.options].some(opcion => opcion.value === anterior)) timeslotSelect.value = anterior;
    }

    serviceSelect.addEventListener('change', () => {
        ocultarErrores();
        dateSelect.value = '';
        timeslotSelect.value = '';
        actualizarFechas();
        if (serviceSelect.value) mostrarPaso('date');
    });
    continueToDate.addEventListener('click', () => {
        actualizarFechas();
        mostrarPaso('date');
    });

    dateSelect.addEventListener('change', () => {
        ocultarErrores();
        timeslotSelect.value = '';
        actualizarHorarios();
        if (dateSelect.value) mostrarPaso('time');
    });
    continueToTime.addEventListener('click', () => {
        actualizarHorarios();
        mostrarPaso('time');
    });

    timeslotSelect.addEventListener('change', () => {
        ocultarErrores();
        if (timeslotSelect.value) {
            actualizarResumen();
            mostrarPaso('details');
        }
    });
    continueToDetails.addEventListener('click', () => {
        actualizarResumen();
        mostrarPaso('details');
    });

    document.querySelector('[data-cy="back-to-event"]').addEventListener('click', () => {
        ocultarErrores();
        mostrarPaso('event');
    });
    document.querySelector('[data-cy="back-to-date"]').addEventListener('click', () => {
        ocultarErrores();
        actualizarFechas();
        mostrarPaso('date');
    });
    function volverAHorarios() {
        ocultarErrores();
        actualizarHorarios();
        mostrarPaso('time');
    }
    document.querySelector('[data-cy="back-to-time"]').addEventListener('click', volverAHorarios);
    chooseAnotherTime.addEventListener('click', volverAHorarios);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        ocultarErrores();
        const nombre = nameInput.value.trim();
        const email = emailInput.value.trim();
        const tipoEvento = serviceSelect.value;
        const fecha = dateSelect.value;
        const hora = timeslotSelect.value;

        if (!tipoEvento || !fecha || !hora || !nombre || !email) {
            errorDiv.textContent = 'Por favor complete todos los campos obligatorios.';
            errorDiv.hidden = false;
            return;
        }
        if (!validarEmail(email)) {
            errorDiv.textContent = 'Ingrese un formato de correo electrónico válido.';
            errorDiv.hidden = false;
            return;
        }

        // Releer justo antes de guardar: lo mostrado al seleccionar puede haber cambiado.
        const reservas = leerReservas();
        if (!estaHorarioDisponible(tipoEvento, fecha, hora, reservas)) {
            unavailableDiv.textContent = 'El horario seleccionado ya no está disponible.';
            unavailableDiv.hidden = false;
            chooseAnotherTime.hidden = false;
            return;
        }

        reservas.push({ tipoEvento, fecha, hora, nombre, email, estado: 'PENDIENTE' });
        localStorage.setItem(reservasKey, JSON.stringify(reservas));
        const referencia = new URLSearchParams({
            indice: String(reservas.length - 1), tipoEvento, fecha, hora, nombre, email
        });
        mailLink.href = `../../M06 - Notificaciones/frontend/confirmar_reserva.html?${referencia}`;
        mailLink.hidden = false;
        mostrarPaso('success');
        successDiv.hidden = false;
        successDiv.textContent = `¡Reserva Pendiente de Confirmación! Solicitud registrada para ${nombre} (${email}) el ${fecha} a las ${hora} para ${tipoEvento}.`;
        notificationsLog.textContent = `Correo enviado a ${email}: recibimos tu solicitud de turno para ${tipoEvento} el ${fecha} a las ${hora}.`;
    });

  // =============================================================
  // Lógica de "Mis Reservas"
  // =============================================================
  const misReservasContainer = document.getElementById('mis-reservas-container');
  const mensajeCancelacion = document.getElementById('mensaje-cancelacion-resultado');
  const emailBusquedaInput = document.getElementById('email-busqueda');
  const btnBuscarReservas = document.getElementById('btn-buscar-reservas');

  // Datos hardcodeados simulando reservas del usuario
    const reservasUsuario = [
    { id: 1, email: "invitado@test.com", servicio: "Consulta Inicial", fecha: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), estado: "confirmada" },
    { id: 2, email: "invitado@test.com", servicio: "Seguimiento", fecha: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), estado: "confirmada" },
    { id: 3, email: "otro@test.com", servicio: "Consulta Inicial", fecha: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), estado: "confirmada" },
    // Reservas de prueba para evaluar los distintos estados visuales
    { id: 4, email: "ejemplo@correo.com", servicio: "Consulta Inicial", fecha: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), estado: "confirmada" }, // Faltan 3 días -> Cancelable
    { id: 5, email: "ejemplo@correo.com", servicio: "Seguimiento", fecha: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), estado: "confirmada" }, // Faltan 12 hs -> No cancelable
    { id: 6, email: "ejemplo@correo.com", servicio: "Consulta Inicial", fecha: new Date(Date.now() + 100 * 60 * 60 * 1000).toISOString(), estado: "cancelada" }, // Estado distinto a confirmada -> No cancelable
    { id: 7, email: "ejemplo@correo.com", servicio: "Seguimiento", fecha: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), estado: "confirmada" } // Fue hace 2 días -> No cancelable
  ];

  let reservasVisualizadas = []; // Reservas del usuario actual

  function todasLasReservas() {
      const creadas = leerReservas().map((reserva, indice) => ({
          ...reserva,
          id: `local-${indice}`,
          servicio: reserva.tipoEvento,
          fecha: `${reserva.fecha}T${reserva.hora}:00`,
          estado: String(reserva.estado).toLowerCase()
      }));
      return [...reservasUsuario, ...creadas];
  }

  if (btnBuscarReservas) {
      btnBuscarReservas.addEventListener('click', () => {
          const email = emailBusquedaInput?.value.trim() ?? '';
          if (!validarEmail(email)) {
              if (mensajeCancelacion) {
                  mensajeCancelacion.innerText = 'Por favor, ingrese un email válido para buscar.';
                  mensajeCancelacion.style.display = 'block';
                  mensajeCancelacion.style.color = 'red';
              }
              if (misReservasContainer) misReservasContainer.innerHTML = '';
              return;
          }
          if (mensajeCancelacion) mensajeCancelacion.style.display = 'none';
           reservasVisualizadas = buscarReservasPorEmail(email, todasLasReservas());
          renderizarReservas();
      });
  }

  function renderizarReservas() {
    if (!misReservasContainer) return;
    misReservasContainer.innerHTML = '';

    if (reservasVisualizadas.length === 0) {
      misReservasContainer.innerHTML = '<p>No se encontraron reservas para este correo.</p>';
      return;
    }

    reservasVisualizadas.forEach(reserva => {
        const div = document.createElement('div');
        div.className = 'summary-box';
        div.style.marginBottom = '10px';
        const fechaFormateada = new Date(reserva.fecha).toLocaleString();

        let html = `
            <p><strong>Servicio:</strong> ${reserva.servicio}</p>
            <p><strong>Fecha:</strong> ${fechaFormateada}</p>
            <p><strong>Estado:</strong> <span data-cy="estado-reserva">${reserva.estado}</span></p>
        `;

        if (esCancelable(reserva)) {
            html += `<button data-cy="btn-cancelar-reserva" data-id="${reserva.id}" class="btn-cancelar" style="background-color: #ffc107; color: black; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Solicitar Cancelación</button>`;
        } else if (reserva.estado === 'confirmada') {
            html += `<p style="color: #dc3545; font-size: 0.9em;">(No cancelable - Faltan menos de 24hs)</p>`;
        }

        div.innerHTML = html;
        misReservasContainer.appendChild(div);
    });

    // Agregar listeners a los botones de solicitar cancelación
    document.querySelectorAll('.btn-cancelar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const reserva = reservasVisualizadas.find(r => String(r.id) === id);

            const token = solicitarCancelacion(reserva);
            if (token) {
                // Actualizar el estado visual del botón
                e.target.innerText = 'Notificación de cancelación enviada';
                e.target.style.backgroundColor = '#6c757d';
                e.target.style.color = 'white';
                e.target.disabled = true;
                e.target.style.cursor = 'default';

                if (mensajeCancelacion) {
                    mensajeCancelacion.style.display = 'none';
                }

                // NOTA: No inyectamos el enlace de confirmación en pantalla
                // ya que ese flujo corresponde al módulo M06 (Notificaciones).
            } else {
                if (mensajeCancelacion) {
                    mensajeCancelacion.innerText = 'No se pudo solicitar la cancelación.';
                    mensajeCancelacion.style.display = 'block';
                    mensajeCancelacion.style.color = 'red';
                }
            }
        });
    });
  }
}
