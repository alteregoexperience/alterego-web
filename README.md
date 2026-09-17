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

## Actividad diaria de Supabase (Vercel Hobby)

`vercel.json` programa `/api/cron/supabase-keep-alive` una vez al día, entre
las 12:00 y las 12:59 UTC (Hobby no garantiza el minuto exacto). Ejecuta tres
consultas de solo lectura a `events`, obteniendo como máximo un `id` por consulta,
sin caché y sin devolver datos de eventos. Funciona aunque la tabla esté vacía.
Reutiliza `supabaseAdmin` y no depende del cron de eventos y recordatorios existente.

Para activarlo:

1. Configura `CRON_SECRET` en **Vercel → Settings → Environment Variables**, para
   **Production**, con un valor aleatorio de al menos 16 caracteres, si aún no existe.
   Es el mismo secreto que utiliza el cron existente. Vercel envía automáticamente
   `Authorization: Bearer <CRON_SECRET>`.
2. Mantén `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, ya utilizadas
   por el proyecto, y despliega los cambios en producción.
3. En **Settings → Cron Jobs**, comprueba que el cron está habilitado. Usa **Run**
   y revisa **View Logs**: debe responder HTTP 200. Sin autorización responde 401;
   si falta el secreto o falla Supabase, responde 500.

Si Supabase ya está pausado, primero reanúdalo desde su panel. Supabase indica que
unas pocas consultas diarias suelen bastar, pero no publica un umbral garantizado.
Vercel no reintenta automáticamente las ejecuciones fallidas.

Referencias: [límites de Vercel Hobby](https://vercel.com/docs/cron-jobs/usage-and-pricing),
[gestión de cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs) y
[pausas de Supabase Free](https://supabase.com/docs/guides/platform/free-project-pausing).
