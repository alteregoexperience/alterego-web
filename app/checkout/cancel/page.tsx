import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />
      <div className="absolute top-1/3 left-1/2 w-[500px] h-[500px] bg-purple-700/20 blur-[120px] -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-[0_0_40px_rgba(128,0,255,0.15)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/15 text-2xl text-amber-300">
          !
        </div>

        <h1 className="text-2xl font-semibold mb-3">Compra cancelada</h1>

        <p className="text-gray-300 text-sm leading-relaxed">
          No se ha completado el pago y no se ha generado ninguna entrada.
        </p>

        <p className="text-gray-500 text-xs mt-2">
          Puedes volver al evento y repetir la compra cuando quieras.
        </p>

        <div className="my-6 border-t border-white/10" />

        <Link
          href="/eventos"
          className="inline-block w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-all duration-200 font-medium text-center"
        >
          Volver a eventos
        </Link>
      </div>
    </div>
  );
}
