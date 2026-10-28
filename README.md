This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Recuperación de compras Stripe

Antes de desplegar esta corrección, aplicar `db/migration_stripe_purchase_delivery.sql`.
Añade el seguimiento de correo y permite emitir compras ya cobradas aunque el
stock se haya agotado después de abrir Checkout. La disponibilidad de nuevas
compras se sigue comprobando antes de pagar.

El webhook verifica el pago en Stripe, registra el pedido y mantiene
`ticket_email_pending` hasta que Resend acepta el correo con todos los PDF.
Los errores quedan en `fulfillment_error`; los reintentos reutilizan pedido y QR.
`ticket_email_sent_at` indica aceptación por Resend, no entrega en la bandeja de entrada.

`/api/stripe/reconcile` requiere `Authorization: Bearer <CRON_SECRET>` y se ejecuta
diariamente mediante Vercel. Recupera correos pendientes sin límite de antigüedad
y busca compras completadas de los últimos 30 días sin pedido o entradas.
No reenvía automáticamente las compras históricas ya emitidas cuyo estado de
correo es desconocido. Para métodos de pago diferidos, suscribir también el
endpoint de Stripe a `checkout.session.async_payment_succeeded`.

Validación sin modificar producción: `npm run test:stripe` y `npm run build`.

## Permisos de Supabase para la Data API

Desde el 30 de octubre de 2026, las tablas nuevas de `public` necesitan `GRANT`
explícitos. Las tablas existentes conservan sus permisos. Referencia:
[aviso oficial de Supabase](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

Para preparar el proyecto actual:

1. En el SQL Editor del proyecto Supabase correcto, ejecutar
   `db/verify_data_api_grants.sql` como `postgres` para revisar el estado inicial.
2. Comprobar que existen las siete tablas y cuatro RPC que enumera el script.
   Si falta `ticket_sale_reminders`, aplicar antes
   `db/migration_ticket_sale_reminders.sql`. Las tablas base y las RPC de
   participantes ya deben existir; este repositorio no contiene su creación.
   `fulfill_stripe_purchase` se define en las migraciones de compras Stripe.
   No volver a ejecutar migraciones históricas de datos para corregir permisos.
3. Ejecutar `db/migration_data_api_grants.sql`. Se puede repetir; solo añade
   permisos concretos y no modifica datos, políticas RLS ni permisos existentes.
   Si falta un objeto o hay una RPC ambigua, se revierte la transacción completa.
4. Repetir `db/verify_data_api_grants.sql`: todas las filas deben indicar `OK`.
   El script comprueba permisos efectivos y RLS habilitado, pero las políticas
   siguen determinando qué filas son visibles. `RLS_DISABLED` requiere revisar
   la seguridad de esa tabla; conceder permisos no habilita RLS.
5. Comprobar eventos y tipos de entrada públicos, ranking en tiempo real,
   importación/puntos de participantes y recordatorios. Verificar compras y QR
   con Stripe en modo test en un entorno de pruebas, sin cobrar entradas reales.

Permisos añadidos (los permisos previos se conservan):

| Objetos | `anon` (navegador) | `service_role` (servidor) |
| --- | --- | --- |
| `events`, `event_ticket_types`, `event_participants` | SELECT, sujeto a RLS | SELECT, INSERT, UPDATE, DELETE |
| `participants`, `orders`, `tickets`, `ticket_sale_reminders` | Ninguno nuevo | SELECT, INSERT, UPDATE, DELETE |
| Las cuatro RPC de la app | Ninguno nuevo | EXECUTE |

La app usa una cookie propia para gestión, no Supabase Auth: no necesita añadir
permisos a `authenticated`. `service_role` necesita permisos de tabla aunque
pueda omitir RLS. Nunca usar su clave en el navegador.

El despliegue de Next.js no ejecuta estos archivos SQL. Aplicarlos también tras
restaurar o recrear el esquema, antes de habilitar tráfico en ese entorno. Los
SQL de `db/` son migraciones manuales sobre un esquema existente, no un bootstrap
completo ejecutable en orden alfabético.

En cada futura migración que cree una tabla de `public`, incluir en la misma
transacción RLS, las políticas necesarias y `GRANT` por objeto y rol. Seguir
`migration_ticket_sale_reminders.sql` para tablas privadas. Conceder SELECT a
`anon` solo cuando la app deba leer la tabla públicamente y tenga las políticas
adecuadas; las escrituras de gestión usan `service_role`. Para columnas
serial/identity, conceder también USAGE sobre su secuencia al rol que inserta;
las tablas actuales usan UUID. Las nuevas RPC deben tener EXECUTE explícito para
sus llamadores y restringir PUBLIC/anon/authenticated si son privadas. No usar
grants globales ni restaurar privilegios automáticos para todas las tablas.
