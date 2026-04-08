import { getBaseUrl } from "@/lib/getBaseUrl";

type TicketEmail = {
  qr: string;
  qr_code: string;
};

type Params = {
  name: string;
  tickets: TicketEmail[];
};

const baseUrl = getBaseUrl();

const logo = `${baseUrl}/pegatina_alter_ego_solo_letras.png`;
const tortuga = `${baseUrl}/tortuga_blanca.png`;

export function renderPurchaseEmail({ name, tickets }: Params) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="
  background: radial-gradient(circle at top, #1a0826 0%, #07070a 60%);
  padding:40px 0;
  font-family:Arial,Helvetica,sans-serif;
">

<tr>
<td align="center">

<table width="520" cellpadding="0" cellspacing="0" style="
  background:#0c0c12;
  border-radius:18px;
  padding:32px;
  color:#ffffff;
  border:1px solid #2a1a3a;
  box-shadow:0 0 40px rgba(168,85,247,0.15);
">

<!-- HEADER -->
<tr>
<td align="center" style="padding-bottom:10px">

<img 
  src="${tortuga}" 
  width="70"
  style="display:block;margin:0 auto 12px auto"
/>

<img 
  src="${logo}" 
  width="160"
  style="display:block;margin:0 auto 5px auto"
/>

<p style="
  margin:0;
  color:#a78bfa;
  font-size:12px;
  letter-spacing:2px;
  text-transform:uppercase;
">
Entradas oficiales
</p>

</td>
</tr>

<!-- TITLE -->
<tr>
<td style="padding-top:20px">

<h2 style="
  margin:0 0 12px 0;
  font-size:20px;
  color:#ffffff;
">
Compra confirmada
</h2>

<p style="color:#cfcfe6;font-size:14px;margin:0 0 8px 0">
Hola <strong>${name}</strong>,
</p>

<p style="color:#9ca3af;font-size:14px;margin:0">
Estas son tus entradas. Preséntalas en el acceso del evento.
</p>

</td>
</tr>

${tickets
  .map(
    (t, i) => `
<tr>
<td style="padding-top:28px">

<table width="100%" cellpadding="0" cellspacing="0" style="
  background:linear-gradient(180deg,#0f0f17,#0a0a0f);
  border-radius:14px;
  padding:22px;
  text-align:center;
  border:1px solid #2b1c3d;
  box-shadow:0 0 25px rgba(168,85,247,0.08);
">

<tr>
<td>

<p style="
  margin:0 0 14px 0;
  color:#a78bfa;
  font-size:11px;
  letter-spacing:1.5px;
">
ENTRADA ${i + 1}
</p>

<img 
  src="${baseUrl}/api/qr/${t.qr_code}"
  width="180" 
  height="180"
  style="
    display:block;
    margin:0 auto;
    border-radius:10px;
    background:white;
    padding:6px;
  "
/>

<p style="
  margin:14px 0 0 0;
  color:#6b7280;
  font-size:11px;
">
ID: ${t.qr_code}
</p>

</td>
</tr>

</table>

</td>
</tr>
`,
  )
  .join("")}

<tr>
<td style="padding-top:28px">

<table width="100%" cellpadding="0" cellspacing="0" style="
  background:#0a0a0f;
  border-radius:12px;
  padding:18px;
  text-align:center;
  border:1px solid #22152e;
">

<tr>
<td>

<p style="
  font-size:12px;
  color:#9ca3af;
  margin:0;
">
Recuerda llevar tu <strong style="color:#fff">DNI</strong>.  
Acceso solo para <strong style="color:#a78bfa">mayores de 18 años</strong>.
</p>

</td>
</tr>

</table>

</td>
</tr>

</table>

</td>
</tr>

</table>
`;
}
