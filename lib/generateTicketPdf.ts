import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

type Params = {
  ticketId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  price: number;
  ticketType: string;
  ticketNumber: number;
  totalTickets: number;
};

export async function generateTicketPdf({
  ticketId,
  buyerName,
  buyerEmail,
  buyerPhone,
  eventName,
  eventLocation,
  eventDate,
  eventTime,
  price,
  ticketType,
  ticketNumber,
  totalTickets,
}: Params) {
  const pdf = await PDFDocument.create();

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([420, 700]);
  const { width, height } = page.getSize();

  // =========================
  // COLORES
  // =========================

  const bg = rgb(0.04, 0.04, 0.07);
  const card = rgb(0.09, 0.09, 0.13);
  const purple = rgb(0.37, 0.11, 0.64);
  const textMuted = rgb(0.6, 0.6, 0.7);

  // =========================
  // FONDO
  // =========================

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: bg,
  });

  // =========================
  // HEADER
  // =========================

  page.drawRectangle({
    x: 0,
    y: height - 90,
    width,
    height: 90,
    color: purple,
  });

  const logoPath = path.join(process.cwd(), "public/tortuga_blanca.png");
  const logoBytes = fs.readFileSync(logoPath);
  const logo = await pdf.embedPng(logoBytes);

  page.drawImage(logo, {
    x: 20,
    y: height - 60,
    width: 30,
    height: 30,
  });

  page.drawText("ALTER EGO EXPERIENCE", {
    x: 60,
    y: height - 50,
    size: 12,
    font: bold,
    color: rgb(0.08, 0.08, 0.12),
  });

  page.drawText(`${eventDate}  •  ${eventTime}`, {
    x: 60,
    y: height - 65,
    size: 9,
    font,
    color: rgb(0.9, 0.9, 0.9),
  });

  // =========================
  // TITULO EVENTO
  // =========================

  page.drawText(eventName.toUpperCase(), {
    x: 20,
    y: height - 132,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`ENTRADA ${ticketNumber} DE ${totalTickets}`, {
    x: 20,
    y: height - 108,
    size: 9,
    font: bold,
    color: rgb(0.8, 0.7, 1),
  });

  page.drawRectangle({
    x: 20,
    y: height - 148,
    width: width - 40,
    height: 1,
    color: rgb(0.3, 0.3, 0.4),
  });

  // =========================
  // QR
  // =========================

  const qrBuffer = await QRCode.toBuffer(ticketId, {
    type: "png",
    margin: 1,
    width: 500,
  });

  const qrImage = await pdf.embedPng(qrBuffer);
  const qrSize = 180;

  // tarjeta QR
  page.drawRectangle({
    x: width / 2 - qrSize / 2 - 14,
    y: height / 2 - qrSize / 2 + 70,
    width: qrSize + 28,
    height: qrSize + 28,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qrImage, {
    x: width / 2 - qrSize / 2,
    y: height / 2 - qrSize / 2 + 84,
    width: qrSize,
    height: qrSize,
  });

  const validText = "Válido para 1 persona";
  const validWidth = font.widthOfTextAtSize(validText, 9);

  page.drawText(validText, {
    x: (width - validWidth) / 2,
    y: height / 2 - qrSize / 2 + 42,
    size: 9,
    font,
    color: textMuted,
  });

  const code = ticketId.toUpperCase();
  const codeWidth = font.widthOfTextAtSize(code, 8);

  page.drawText(code, {
    x: (width - codeWidth) / 2,
    y: height / 2 - qrSize / 2 + 24,
    size: 8,
    font,
    color: textMuted,
  });

  // =========================
  // BLOQUE ENTRADA
  // =========================

  page.drawRectangle({
    x: 20,
    y: 195,
    width: width - 40,
    height: 70,
    color: card,
  });

  page.drawText(ticketType.toUpperCase(), {
    x: 30,
    y: 240,
    size: 12,
    font: bold,
    color: rgb(0.8, 0.7, 1),
  });

  page.drawText(`Precio: ${price.toFixed(2)} €`, {
    x: 30,
    y: 223,
    size: 10,
    font,
    color: rgb(1, 1, 1),
  });

  // =========================
  // BLOQUE COMPRADOR
  // =========================

  page.drawRectangle({
    x: 20,
    y: 115,
    width: width - 40,
    height: 70,
    color: card,
  });

  page.drawText(buyerName, {
    x: 30,
    y: 160,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText(buyerPhone, {
    x: 30,
    y: 143,
    size: 9,
    font,
    color: textMuted,
  });

  page.drawText(buyerEmail, {
    x: 30,
    y: 128,
    size: 9,
    font,
    color: textMuted,
  });

  // =========================
  // FOOTER
  // =========================

  page.drawRectangle({
    x: 0,
    y: 60,
    width,
    height: 40,
    color: rgb(0.12, 0.12, 0.16),
  });

  page.drawText("UBICACIÓN", {
    x: width / 2 - 35,
    y: 85,
    size: 8,
    font,
    color: textMuted,
  });

  const locationWidth = bold.widthOfTextAtSize(eventLocation, 10);

  page.drawText(eventLocation, {
    x: (width - locationWidth) / 2,
    y: 72,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
  });

  // =========================
  // REDES
  // =========================

  const instagramPath = path.join(process.cwd(), "public/icons/instagram.png");
  const tiktokPath = path.join(process.cwd(), "public/icons/tiktok.png");

  const instagramBytes = fs.readFileSync(instagramPath);
  const tiktokBytes = fs.readFileSync(tiktokPath);

  const instagram = await pdf.embedPng(instagramBytes);
  const tiktok = await pdf.embedPng(tiktokBytes);

  const iconSize = 14;
  const gap = 8;
  const socialText = "@alterego.experience";
  const socialSize = 9;

  const textWidth = font.widthOfTextAtSize(socialText, socialSize);
  const rowWidth = iconSize + gap + textWidth;
  const startX = (width - rowWidth) / 2;

  // más abajo + más separación del bloque ubicación
  const firstRowY = 32;
  const secondRowY = 16;

  // ajuste vertical para centrar icono con texto
  const iconOffset = -5;

  // Instagram
  page.drawImage(instagram, {
    x: startX,
    y: firstRowY + iconOffset,
    width: iconSize,
    height: iconSize,
  });

  page.drawText(socialText, {
    x: startX + iconSize + gap,
    y: firstRowY,
    size: socialSize,
    font,
    color: textMuted,
  });

  // TikTok
  page.drawImage(tiktok, {
    x: startX,
    y: secondRowY + iconOffset,
    width: iconSize,
    height: iconSize,
  });

  page.drawText(socialText, {
    x: startX + iconSize + gap,
    y: secondRowY,
    size: socialSize,
    font,
    color: textMuted,
  });

  // =================================================
  // SEGUNDA PAGINA CON CONDICIONES
  // =================================================

  const page2 = pdf.addPage([420, 700]);

  page2.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: bg,
  });

  page2.drawText("CONDICIONES GENERALES", {
    x: 40,
    y: height - 60,
    size: 16,
    font: bold,
    color: rgb(1, 1, 1),
  });

  const conditions = [
    "1. Entrada válida para una sola persona.",
    "2. El QR solo puede utilizarse una vez.",
    "3. No se permite la reventa sin autorización.",
    "4. El evento es exclusivo para mayores de 18 años.",
    "5. La organización se reserva el derecho de admisión.",
    "6. La entrada debe conservarse durante todo el evento.",
    "7. No se admiten devoluciones salvo cancelación.",
    "8. El asistente acepta normas del evento.",
    "9. La organización puede modificar horarios.",
    "10. La entrada implica aceptación de condiciones.",
  ];

  let y = height - 80;

  conditions.forEach((text) => {
    page2.drawText(text, {
      x: 40,
      y,
      size: 10,
      font,
      color: textMuted,
      maxWidth: width - 80,
      lineHeight: 14,
    });
    y -= 18;
  });
  return await pdf.save();
}
