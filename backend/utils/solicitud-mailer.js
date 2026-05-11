const { parseEmailList, sendMailSafe } = require("./mailer");

const SUBJECT_PREFIX = "INFORMACIÓN SIUC Sistema de Ingreso CIDE";
const REVIEW_CC = parseEmailList(process.env.SOLICITUDES_REVIEW_CC);

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDetailRows(lines) {
  return lines
    .filter(Boolean)
    .map((line) => `<tr><td style="padding:10px 0;border-bottom:1px solid #d6dee7;color:#1d4d47;font-size:15px;">${escapeHtml(line)}</td></tr>`)
    .join("");
}

function buildLayout({ title, intro, lines, statusLabel, statusColor = "#10a37f", notice, actionLabel, actionUrl }) {
  const detailRows = buildDetailRows(lines);
  const safeActionUrl = actionUrl ? escapeHtml(actionUrl) : null;

  return `<!doctype html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:#eef2f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;padding:0;background:#eef2f5;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:collapse;background:#ffffff;border:1px solid #d6dee7;border-radius:8px;overflow:hidden;font-family:Segoe UI,Arial,sans-serif;box-shadow:0 8px 22px rgba(25,42,70,0.08);">
            <tr>
              <td style="padding:26px 32px;background:#1f4d43;text-align:center;">
                <div style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#cfe8df;font-weight:700;">Universidad CIDE</div>
                <div style="margin-top:8px;font-size:34px;line-height:1;color:#ffffff;font-weight:800;">SIUC</div>
                <div style="margin-top:8px;font-size:14px;color:#d7ede7;">Sistema de Ingreso CIDE</div>
              </td>
            </tr>
            <tr>
              <td style="padding:38px 34px 34px;color:#1d4d47;">
                <div style="display:inline-block;margin:0 0 18px;padding:8px 12px;border-radius:999px;background:${statusColor};color:#ffffff;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(statusLabel)}</div>
                <h1 style="margin:0 0 18px;color:#173f37;font-size:28px;line-height:1.2;font-weight:800;">${escapeHtml(title)}</h1>
                <p style="margin:0 0 26px;color:#1d4d47;font-size:17px;line-height:1.65;">${escapeHtml(intro)}</p>
                ${notice ? `
                  <div style="margin:0 0 26px;padding:18px 20px;border-left:5px solid ${statusColor};border-radius:8px;background:#f6f8fb;color:#173f37;font-size:16px;line-height:1.55;font-weight:700;">
                    ${escapeHtml(notice)}
                  </div>
                ` : ""}
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;border-collapse:collapse;">
                  ${detailRows}
                </table>
                ${safeActionUrl ? `
                  <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:26px auto;">
                    <tr>
                      <td style="border-radius:8px;background:#10a37f;">
                        <a href="${safeActionUrl}" style="display:inline-block;padding:15px 28px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;">${escapeHtml(actionLabel || "Abrir SIUC")}</a>
                      </td>
                    </tr>
                  </table>
                ` : ""}
                <p style="margin:28px 0 0;padding-top:22px;border-top:1px solid #d6dee7;color:#6f8197;font-size:13px;line-height:1.5;">
                  Este correo fue generado automáticamente por SIUC. Si tienes dudas sobre tu solicitud, responde a este mensaje o comunícate con admisiones.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    </body>
    </html>
  `;
}

function createSubmissionMail(solicitud) {
  return {
    to: solicitud.correo_institucional,
    subject: `RECEPCIÓN - ${SUBJECT_PREFIX}`,
    text: [
      `Hola ${solicitud.nombre},`,
      "Recibimos tu solicitud de inscripción en SIUC.",
      `Documento: ${solicitud.documento}`,
      `Estado actual: ${solicitud.estado || "PENDIENTE"}`,
      "La administración revisará la información y responderá a este mismo correo.",
      "Si en 48 horas no es aprobada o rechazada, la solicitud expirará automáticamente.",
    ].join("\n"),
    html: buildLayout({
      title: "Solicitud de inscripción recibida",
      intro: `Hola ${solicitud.nombre}, recibimos correctamente tu solicitud en SIUC.`,
      statusLabel: "Solicitud recibida",
      statusColor: "#1f4d43",
      notice: "La administración revisará tus documentos y responderá a este mismo correo.",
      lines: [
        `Documento: ${solicitud.documento}`,
        `Estado actual: ${solicitud.estado || "PENDIENTE"}`,
        "Si en 48 horas no se aprueba o rechaza, la solicitud expirará automáticamente.",
      ],
    }),
  };
}

function createApprovalMail(solicitud) {
  return {
    to: solicitud.correo_institucional,
    cc: REVIEW_CC,
    subject: `ACEPTACIÓN - ${SUBJECT_PREFIX}`,
    text: [
      `Hola ${solicitud.nombre},`,
      "Tu solicitud de inscripción fue aprobada.",
      `Documento: ${solicitud.documento}`,
      "Ya puedes continuar con tu proceso de ingreso institucional en SIUC.",
      solicitud.notas_revision ? `Notas de revisión: ${solicitud.notas_revision}` : null,
    ].filter(Boolean).join("\n"),
    html: buildLayout({
      title: "Solicitud aprobada",
      intro: `Hola ${solicitud.nombre}, tu solicitud de inscripción fue aprobada.`,
      statusLabel: "Aprobada",
      statusColor: "#10a37f",
      notice: "Tu registro ya fue aceptado por la administración. Ya puedes continuar con tu proceso institucional.",
      lines: [
        `Documento: ${solicitud.documento}`,
        solicitud.notas_revision ? `Notas de revisión: ${solicitud.notas_revision}` : null,
      ],
    }),
  };
}

function createRejectionMail(solicitud) {
  return {
    to: solicitud.correo_institucional,
    cc: REVIEW_CC,
    subject: `RECHAZO - ${SUBJECT_PREFIX}`,
    text: [
      `Hola ${solicitud.nombre},`,
      "Tu solicitud de inscripción fue rechazada.",
      `Documento: ${solicitud.documento}`,
      solicitud.motivo_rechazo ? `Motivo: ${solicitud.motivo_rechazo}` : null,
      solicitud.notas_revision ? `Notas de revisión: ${solicitud.notas_revision}` : null,
      "Corrige la información y registra una nueva solicitud.",
    ].filter(Boolean).join("\n"),
    html: buildLayout({
      title: "Solicitud rechazada",
      intro: `Hola ${solicitud.nombre}, tu solicitud de inscripción fue rechazada.`,
      statusLabel: "Rechazada",
      statusColor: "#fa5252",
      notice: "Corrige la información indicada y registra una nueva solicitud para continuar el proceso.",
      lines: [
        `Documento: ${solicitud.documento}`,
        solicitud.motivo_rechazo ? `Motivo: ${solicitud.motivo_rechazo}` : null,
        solicitud.notas_revision ? `Notas de revisión: ${solicitud.notas_revision}` : null,
      ],
    }),
  };
}

function createExpiredMail(solicitud) {
  return {
    to: solicitud.correo_institucional,
    subject: `RECHAZO - ${SUBJECT_PREFIX}`,
    text: [
      `Hola ${solicitud.nombre},`,
      "Tu solicitud de inscripción expiró porque no fue aprobada ni rechazada dentro del plazo de 48 horas.",
      `Documento: ${solicitud.documento}`,
      "Debes registrar una nueva solicitud para continuar con el proceso.",
    ].join("\n"),
    html: buildLayout({
      title: "Solicitud expirada",
      intro: `Hola ${solicitud.nombre}, tu solicitud expiró por falta de revisión dentro del plazo establecido.`,
      statusLabel: "Expirada",
      statusColor: "#ff922b",
      notice: "Debes registrar una nueva solicitud para continuar con el proceso.",
      lines: [
        `Documento: ${solicitud.documento}`,
      ],
    }),
  };
}

async function sendSolicitudPreviewMails(to) {
  const previewTarget = String(to || process.env.SMTP_USER || "").trim();
  if (!previewTarget) {
    return { skipped: true, reason: "No hay correo destino para enviar la vista previa." };
  }

  const sample = {
    id: 999,
    documento: "88001000",
    nombre: "Estudiante Demo SIUC",
    correo_institucional: previewTarget,
    estado: "PENDIENTE",
    motivo_rechazo: "La documentación adjunta no permite validar la tarjeta de propiedad.",
    notas_revision: "Vista previa de formato generada desde administración.",
  };

  const payloads = [
    createSubmissionMail(sample),
    createApprovalMail({ ...sample, estado: "APROBADA" }),
    createRejectionMail({ ...sample, estado: "RECHAZADA" }),
    createExpiredMail({ ...sample, estado: "EXPIRADA" }),
  ].map((payload) => ({ ...payload, to: previewTarget }));

  const results = [];
  for (const payload of payloads) {
    results.push(await sendMailSafe(payload));
  }

  return { to: previewTarget, sent: results.length, results };
}

async function notifySolicitudCreada(solicitud) {
  return sendMailSafe(createSubmissionMail(solicitud));
}

async function notifySolicitudAprobada(solicitud) {
  return sendMailSafe(createApprovalMail(solicitud));
}

async function notifySolicitudRechazada(solicitud) {
  return sendMailSafe(createRejectionMail(solicitud));
}

async function notifySolicitudExpirada(solicitud) {
  return sendMailSafe(createExpiredMail(solicitud));
}

module.exports = {
  createApprovalMail,
  createExpiredMail,
  createRejectionMail,
  createSubmissionMail,
  notifySolicitudAprobada,
  notifySolicitudCreada,
  notifySolicitudExpirada,
  notifySolicitudRechazada,
  sendSolicitudPreviewMails,
};
