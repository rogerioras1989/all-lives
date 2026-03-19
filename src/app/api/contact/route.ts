import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, message } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    if (typeof message === "string" && message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Mensagem excede o limite permitido" }, { status: 400 });
    }

    console.info("[Contact Form]", {
      emailDomain: typeof email === "string" && email.includes("@") ? email.split("@")[1] : "invalid",
      hasCompany: !!company,
      hasMessage: !!message,
      at: new Date().toISOString(),
    });

    const smtpHost = process.env.SMTP_HOST;
    if (smtpHost) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT ?? "587"),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM ?? "noreply@all-livesocupacional.com.br",
        to: process.env.CONTACT_EMAIL ?? "contato@all-livesocupacional.com.br",
        subject: `[DRPS] Contato de ${name}${company ? ` — ${company}` : ""}`,
        text: `Nome: ${name}\nEmail: ${email}\nEmpresa: ${company ?? "-"}\n\n${message ?? ""}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Contact Form Error]", err);
    return NextResponse.json({ error: "Erro ao processar mensagem" }, { status: 500 });
  }
}
