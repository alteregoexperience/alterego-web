import Link from "next/link";
import { ShieldCheck, Ticket, UserCheck } from "lucide-react";

import PublicBackground from "@/components/public/layout/PublicBackground";

export default function TerminosCondicionesPage() {
  return (
    <PublicBackground>
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-32 text-white md:pt-36">
        <section className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-purple-300">
              Condiciones legales
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              Términos y condiciones
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              Estas condiciones regulan la compra, uso y validacion de entradas
              para eventos organizados o comercializados a traves de ALTER EGO
              Experience.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-400/25 bg-purple-500/10 p-5 shadow-[0_0_35px_rgba(168,85,247,0.14)]">
            <p className="text-sm font-semibold text-purple-200">
              Resumen esencial
            </p>
            <div className="mt-5 space-y-4 text-sm text-zinc-300">
              <SummaryItem
                icon={<Ticket />}
                text="Cada QR es unico y valido para una sola persona."
              />
              <SummaryItem
                icon={<UserCheck />}
                text="El acceso esta sujeto a verificacion de edad e identidad."
              />
              <SummaryItem
                icon={<ShieldCheck />}
                text="La organizacion puede denegar accesos fraudulentos o duplicados."
              />
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4">
          <LegalSection title="1. Titularidad y contacto">
            ALTER EGO Experience es la plataforma utilizada para la publicacion
            de eventos, venta de entradas, gestion de accesos y comunicacion con
            asistentes. El titular responsable de la web es Ivan Sancha Casado,
            con NIF 79297858E, domicilio de contacto en Av. del Ferrocarril, 10,
            Basurto-Zorroza, 48012 Bilbao, Bizkaia y correo electronico de
            contacto a.ego.experience@gmail.com.
          </LegalSection>

          <LegalSection title="2. Objeto">
            Estas condiciones regulan el acceso a la web, la compra de entradas,
            la recepcion de entradas digitales, la validacion mediante codigo QR
            y la asistencia a los eventos publicados.
          </LegalSection>

          <LegalSection title="3. Compra de entradas">
            La compra se realiza mediante los medios de pago habilitados en la
            web. La confirmacion efectiva de la compra depende de la validacion
            del pago por la pasarela correspondiente. Tras la confirmacion, el
            comprador recibira sus entradas digitales en el correo indicado
            durante el proceso de compra.
          </LegalSection>

          <LegalSection title="4. Entradas digitales y codigo QR">
            Cada entrada incluye un codigo QR unico. El QR es el elemento valido
            para controlar el acceso al evento. La entrada solo permite un
            acceso y queda marcada como utilizada tras su primera validacion. La
            copia, duplicacion, reenvio o manipulacion de una entrada no concede
            derechos adicionales de acceso.
          </LegalSection>

          <LegalSection title="5. Validacion en accesos">
            El personal de acceso podra escanear el QR para comprobar si la
            entrada existe, corresponde al evento y no ha sido usada con
            anterioridad. Si el sistema indica que la entrada ya ha sido
            utilizada, es invalida, pertenece a otro evento o presenta signos de
            manipulacion, el acceso podra ser denegado.
          </LegalSection>

          <LegalSection title="6. Edad minima y derecho de admision">
            Los eventos pueden estar reservados a mayores de 18 anos. El
            personal de acceso podra solicitar DNI, NIE, pasaporte u otro
            documento acreditativo. La organizacion se reserva el derecho de
            admision conforme a la normativa aplicable y podra denegar el acceso
            por motivos de seguridad, edad, aforo, comportamiento inadecuado o
            incumplimiento de estas condiciones.
          </LegalSection>

          <LegalSection title="7. Precio, disponibilidad y aforo">
            Los precios, tipos de entrada, disponibilidad y condiciones de cada
            evento se muestran en la web. La disponibilidad puede cambiar en
            tiempo real. La inclusion de una entrada en el proceso de compra no
            garantiza su reserva hasta que el pago haya sido confirmado.
          </LegalSection>

          <LegalSection title="8. Cambios, cancelaciones y devoluciones">
            Salvo que se indique expresamente lo contrario o resulte obligatorio
            por ley, las entradas no seran reembolsables una vez completada la
            compra. En caso de cancelacion del evento, la organizacion informara
            sobre el procedimiento aplicable. La organizacion podra modificar
            horarios, ubicación, programa o condiciones del evento por causas
            justificadas, comunicandolo cuando resulte necesario.
          </LegalSection>

          <LegalSection title="9. Uso correcto de la web">
            El usuario se compromete a utilizar la web de forma licita, correcta
            y respetuosa. Queda prohibido intentar acceder a zonas privadas,
            alterar sistemas de venta o validacion, introducir datos falsos,
            realizar compras fraudulentas o interferir en el funcionamiento de
            la plataforma.
          </LegalSection>

          <LegalSection title="10. Datos personales">
            Los datos personales facilitados durante la compra, suscripcion a
            recordatorios o contacto con la organizacion se trataran conforme a
            la politica de privacidad aplicable. El usuario debe facilitar datos
            veraces y mantenerlos actualizados cuando sea necesario.
          </LegalSection>

          <LegalSection title="11. Responsabilidad">
            ALTER EGO Experience no se responsabiliza de errores derivados de
            datos incorrectos facilitados por el usuario, perdida de acceso al
            correo electronico, reenvio no autorizado de entradas o uso indebido
            de los codigos QR. El comprador es responsable de custodiar sus
            entradas digitales.
          </LegalSection>

          <LegalSection title="12. Legislacion aplicable">
            Estas condiciones se interpretaran conforme a la legislacion
            espanola y la normativa europea que resulte aplicable, sin perjuicio
            de los derechos que correspondan a consumidores y usuarios.
          </LegalSection>
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

function SummaryItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-200 [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <p className="leading-6">{text}</p>
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-4 text-sm leading-7 text-zinc-400">
        {children}
      </div>
    </article>
  );
}
