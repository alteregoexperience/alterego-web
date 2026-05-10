import { getBaseUrl } from "@/lib/getBaseUrl";

type Params = {
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventUrl: string;
};

const baseUrl = getBaseUrl();
const logo = `${baseUrl}/pegatina_alter_ego_solo_letras.png`;
const tortuga = `${baseUrl}/tortuga_blanca.png`;

export function renderTicketSaleReminderEmail({
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  eventUrl,
}: Params) {
  return `
<!doctype html>
<html>
<head>
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
</head>
<body style="margin:0;padding:0;background-color:#07070a;color:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#07070a" style="
  background-color:#07070a;
  background: radial-gradient(circle at top, #1a0730 0%, #07070a 62%);
  padding:40px 0;
  font-family:Arial,Helvetica,sans-serif;
">
<tr>
<td align="center">

<table width="540" cellpadding="0" cellspacing="0" bgcolor="#0c0c12" style="
  background-color:#0c0c12;
  background:#0c0c12;
  border-radius:20px;
  padding:34px;
  color:#ffffff;
  border:1px solid #332047;
  box-shadow:0 0 46px rgba(168,85,247,0.18);
">
<tr>
<td align="center">
  <table cellpadding="0" cellspacing="0" bgcolor="#12091d" style="
    background-color:#12091d;
    border:1px solid #332047;
    border-radius:999px;
    margin:0 auto 14px auto;
  ">
    <tr>
      <td align="center" style="padding:12px">
        <img src="${tortuga}" width="96" alt="ALTER EGO" style="display:block;margin:0 auto" />
      </td>
    </tr>
  </table>
  <img src="${logo}" width="170" alt="ALTER EGO" style="display:block;margin:0 auto 8px auto" />
  <p style="
    margin:0;
    color:#a855f7;
    font-size:12px;
    letter-spacing:2.4px;
    text-transform:uppercase;
  ">
    Venta de entradas abierta
  </p>
</td>
</tr>

<tr>
<td style="padding-top:28px">
  <h1 style="
    margin:0 0 12px 0;
    font-size:24px;
    line-height:1.2;
    color:#ffffff;
  ">
    Ya puedes comprar tus entradas
  </h1>

  <p style="color:#cfcfe6;font-size:15px;line-height:1.55;margin:0">
    Activaste un recordatorio para <strong>${eventTitle}</strong>. La venta ya esta disponible.
  </p>
</td>
</tr>

<tr>
<td style="padding-top:24px">
  <table width="100%" cellpadding="0" cellspacing="0" style="
    background:linear-gradient(180deg,#12121b,#09090f);
    border-radius:16px;
    padding:22px;
    border:1px solid #2b1c3d;
  ">
    <tr>
      <td>
        <p style="margin:0 0 8px 0;color:#a855f7;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;">
          ${eventDate}
        </p>
        <p style="margin:0 0 8px 0;color:#ffffff;font-size:18px;font-weight:700;">
          ${eventTitle}
        </p>
        <p style="margin:0;color:#9ca3af;font-size:14px;">
          ${eventTime}${eventLocation ? ` · ${eventLocation}` : ""}
        </p>
      </td>
    </tr>
  </table>
</td>
</tr>

<tr>
<td align="center" style="padding-top:28px">
  <a href="${eventUrl}" style="
    display:inline-block;
    background:#7c3aed;
    color:#ffffff;
    text-decoration:none;
    padding:14px 24px;
    border-radius:12px;
    font-size:14px;
    font-weight:700;
    box-shadow:0 12px 30px rgba(124,58,237,0.35);
  ">
    Comprar entradas
  </a>
</td>
</tr>

<tr>
<td style="padding-top:24px">
  <p style="margin:0;text-align:center;color:#81818f;font-size:12px;line-height:1.5;">
    Las entradas pueden agotarse. Este aviso no reserva plaza ni garantiza disponibilidad.
  </p>
</td>
</tr>

<tr>
<td align="center" style="padding-top:26px">
  <p style="font-size:11px;color:#6b7280;margin:0;">
    @alterego.experience
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
