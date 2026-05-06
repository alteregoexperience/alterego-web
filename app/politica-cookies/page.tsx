import Link from "next/link";

import PublicBackground from "@/components/public/layout/PublicBackground";

export default function PoliticaCookiesPage() {
  return (
    <PublicBackground>
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32 text-white md:pt-36">
        <section className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-purple-300">
              Informacion legal
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Politica de cookies
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Esta politica explica que cookies se utilizan en ALTER EGO
              Experience y con que finalidad.
            </p>
          </div>

          <LegalBlock title="Uso actual de cookies">
            Actualmente esta web utiliza unicamente cookies tecnicas necesarias
            para permitir la navegacion, mantener sesiones seguras en la zona de
            gestion y prestar los servicios solicitados por el usuario.
          </LegalBlock>

          <LegalBlock title="Cookies tecnicas">
            Las cookies tecnicas son necesarias para el funcionamiento de la web
            y no requieren consentimiento previo. Entre otros usos, pueden
            utilizarse para recordar que se ha mostrado este aviso o para
            mantener una sesion iniciada en areas privadas.
          </LegalBlock>

          <LegalBlock title="Cookies no utilizadas">
            No utilizamos cookies de analitica, publicidad comportamental,
            remarketing, perfiles comerciales ni seguimiento de terceros. Si en
            el futuro se incorporan herramientas de este tipo, se actualizara
            esta politica y se solicitara el consentimiento correspondiente.
          </LegalBlock>

          <LegalBlock title="Gestion desde el navegador">
            Puedes permitir, bloquear o eliminar cookies desde la configuracion
            de tu navegador. Ten en cuenta que bloquear cookies tecnicas puede
            afectar al funcionamiento correcto de algunas partes de la web.
          </LegalBlock>

          <LegalBlock title="Ultima actualizacion">
            Esta politica se ha preparado para la version actual de la web,
            basada exclusivamente en cookies tecnicas.
          </LegalBlock>
        </section>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </PublicBackground>
  );
}

function LegalBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{children}</p>
    </div>
  );
}
