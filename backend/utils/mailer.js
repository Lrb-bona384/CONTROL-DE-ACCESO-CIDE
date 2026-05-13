const nodemailer = require("nodemailer");
const dns = require("node:dns");
const dnsPromises = require("node:dns").promises;

let transporterPromise = null;
let smtpHostPromise = null;

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

function getSmtpTimeout() {
  const timeout = Number(process.env.SMTP_TIMEOUT_MS || 12000);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : 12000;
}

async function resolveSmtpHost(host) {
  const forceIpv4 = String(process.env.SMTP_FORCE_IPV4 || "true").toLowerCase() !== "false";
  if (!forceIpv4) return host;

  if (!smtpHostPromise) {
    smtpHostPromise = dnsPromises
      .resolve4(host)
      .then((addresses) => addresses[0] || host)
      .catch((error) => {
        console.warn(`[mail] no fue posible resolver IPv4 para ${host}: ${error.message}`);
        return host;
      });
  }

  return smtpHostPromise;
}

function parseEmailList(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const cc = parseEmailList(process.env.SMTP_CC);
  const timeout = getSmtpTimeout();

  if (!host || !port || !from) {
    return null;
  }

  return {
    host,
    port,
    secure,
    from,
    cc,
    timeout,
    auth: user && pass ? { user, pass } : undefined,
  };
}

async function getTransporter() {
  const config = getSmtpConfig();
  if (!config) return null;

  if (!transporterPromise) {
    transporterPromise = resolveSmtpHost(config.host).then((resolvedHost) =>
      nodemailer.createTransport({
        host: resolvedHost,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        family: 4,
        tls: {
          servername: config.host,
        },
        connectionTimeout: config.timeout,
        greetingTimeout: config.timeout,
        socketTimeout: config.timeout,
      })
    );
  }

  return transporterPromise;
}

async function sendMail({ to, cc, subject, text, html }) {
  const config = getSmtpConfig();
  const transporter = await getTransporter();

  if (!config || !transporter) {
    console.warn(`[mail] SMTP no configurado. Correo omitido para ${to}: ${subject}`);
    return { skipped: true };
  }

  const combinedCc = [...new Set([...(config.cc || []), ...parseEmailList(cc)])];

  return transporter.sendMail({
    from: config.from,
    to,
    cc: combinedCc.length ? combinedCc : undefined,
    subject,
    text,
    html,
    textEncoding: "base64",
    headers: {
      "Content-Language": "es-CO",
    },
  });
}

async function sendMailSafe(payload) {
  try {
    return await sendMail(payload);
  } catch (error) {
    console.error("[mail] error al enviar correo", error.message);
    return { error: error.message };
  }
}

module.exports = {
  getSmtpConfig,
  parseEmailList,
  sendMail,
  sendMailSafe,
};
