export default function GestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-black via-[#0f0b1a] to-black text-white overflow-hidden">
      {/* LUZ HORIZONTAL */}
      <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-40 blur-sm" />

      {/* GLOW SUAVE */}
      <div className="absolute top-[40%] left-0 w-full h-[200px] bg-purple-600/10 blur-[120px]" />

      {/* CONTENIDO */}
      <div className="relative z-10 min-h-[100dvh]">{children}</div>
    </div>
  );
}
