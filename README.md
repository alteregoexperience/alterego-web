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
