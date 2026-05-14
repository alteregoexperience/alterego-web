import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

type Params = {
  ticketId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  purchaserName?: string;
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventTime: string;
  price: number;
  ticketType: string;
  ticketNumber: number;
  totalTickets: number;
};

type TextWidthFont = {
  widthOfTextAtSize: (text: string, size: number) => number;
};

function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  font: TextWidthFont,
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

export async function generateTicketPdf({
  ticketId,
  buyerName,
  buyerEmail,
  buyerPhone,
  purchaserName,
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

  const hasSeparatePurchaser =
    Boolean(purchaserName) && purchaserName !== buyerName;

  page.drawRectangle({
    x: 20,
    y: 115,
    width: width - 40,
    height: 70,
    color: card,
  });

  if (hasSeparatePurchaser) {
    page.drawText("ASISTENTE", {
      x: 30,
      y: 162,
      size: 7,
      font,
      color: textMuted,
    });

    page.drawText(buyerName, {
      x: 30,
      y: 145,
      size: 11,
      font: bold,
      color: rgb(1, 1, 1),
      maxWidth: 155,
    });

    page.drawText("DATOS DEL COMPRADOR", {
      x: 210,
      y: 162,
      size: 7,
      font,
      color: textMuted,
    });

    page.drawText(purchaserName ?? "", {
      x: 210,
      y: 146,
      size: 8,
      font: bold,
      color: rgb(1, 1, 1),
      maxWidth: 170,
    });

    page.drawText(buyerPhone, {
      x: 210,
      y: 133,
      size: 7,
      font,
      color: textMuted,
      maxWidth: 170,
    });

    page.drawText(buyerEmail, {
      x: 210,
      y: 122,
      size: 7,
      font,
      color: textMuted,
      maxWidth: 170,
    });
  } else {
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
  }

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

  page2.drawRectangle({
    x: 0,
    y: height - 118,
    width,
    height: 118,
    color: rgb(0.12, 0.04, 0.2),
  });

  page2.drawRectangle({
    x: 0,
    y: height - 122,
    width,
    height: 4,
    color: purple,
  });

  page2.drawRectangle({
    x: 26,
    y: height - 96,
    width: width - 52,
    height: 56,
    color: rgb(0.07, 0.06, 0.1),
  });

  page2.drawImage(logo, {
    x: 42,
    y: height - 78,
    width: 24,
    height: 24,
  });

  page2.drawText("MANDAMIENTOS ALTER EGO", {
    x: 78,
    y: height - 66,
    size: 15,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page2.drawRectangle({
    x: 78,
    y: height - 76,
    width: 178,
    height: 1,
    color: purple,
  });

  const conditions = [
    "I- Queda prohibido introducir alcohol, sustancias ilegales, armas u objetos peligrosos al evento.",
    "II- Nos reservamos el derecho de admision, porque no todo el mundo esta listo para descubrir su alter ego.",
    "III- Es un requisito cumplir con la edad minima de acceso de la sala. Sera imprescindible mostrar el DNI u otro documento identificativo valido original. No se admiten fotocopias, ya que la organizacion del evento no se hace responsable de entradas robadas/falsificadas.",
    "IV- Queda limitada la entrada y/o permanencia en el evento a toda persona que:",
    "A) Se encuentre en estado de embriaguez o consuma cualquier tipo de estupefacientes o sustancia ilegal.",
    "B) Provoque o incite cualquier desorden o acto de violencia dentro del evento.",
    "C) Se presente sin ganas de conocer a su verdadero yo.",
    "D) No cumpla con las medidas higienico-sanitarias del establecimiento, sudar bailando esta permitido, tranquil@.",
    'V- No estas obligad@ a cumplir tu rol, pero se te ha asignado en base a como eres. Recuerda: "Fiestas diferentes, las crean personas diferentes".',
    "VI- El equipo de ALTER EGO podra grabar, retransmitir y capturar cada instante. Tu pon la actitud, nosotros ponemos las camaras.",
    "VII- La devolucion o reembolso de entradas solo se permitira cuando el evento sea cancelado previamente por la propia organizacion.",
    "VIII- Queda terminantemente prohibido juzgar a nada ni a nadie.",
    "IX- La organizacion no se hace responsable de objetos perdidos, robados o danados durante el evento.",
    "X- La compra de la entrada implica la aceptacion de las normas y condiciones.",
    "XI- La entrada es personal e intransferible.",
  ];

  let y = height - 142;

  const conditionSize = 6.9;
  const lineHeight = 8.4;
  const paragraphGap = 4;
  const cardX = 34;
  const cardWidth = width - 68;
  const markerWidth = 32;
  const maxTextWidth = cardWidth - markerWidth - 24;

  conditions.forEach((text, index) => {
    const markerMatch = text.match(/^([A-Z]+-|[A-Z]\))/);
    const marker = markerMatch?.[1] ?? "";
    const body = marker ? text.slice(marker.length).trim() : text;
    const lines = wrapText(body, maxTextWidth, conditionSize, font);
    const cardHeight = Math.max(24, lines.length * lineHeight + 13);
    const cardY = y - cardHeight + 8;

    page2.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      color: index % 2 === 0 ? rgb(0.09, 0.08, 0.13) : rgb(0.07, 0.07, 0.11),
    });

    page2.drawRectangle({
      x: cardX,
      y: cardY,
      width: 3,
      height: cardHeight,
      color: purple,
    });

    page2.drawText(marker, {
      x: cardX + 12,
      y: y - 7,
      size: 7.2,
      font: bold,
      color: rgb(0.8, 0.7, 1),
    });

    lines.forEach((line, lineIndex) => {
      page2.drawText(line, {
        x: cardX + markerWidth + 12,
        y: y - lineIndex * lineHeight - 7,
        size: conditionSize,
        font,
        color: lineIndex === 0 ? rgb(0.86, 0.86, 0.94) : textMuted,
      });
    });

    y = cardY - paragraphGap;
  });

  page2.drawRectangle({
    x: 34,
    y: 30,
    width: width - 68,
    height: 1,
    color: rgb(0.22, 0.18, 0.3),
  });

  return await pdf.save();
}
