import PublicNav from "./PublicNav";

export default function PublicBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] bg-black text-white overflow-hidden">
      {/* GRADIENT BASE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(168,85,247,0.25),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.18),transparent_45%)]" />

      {/* HEX GRID */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(30deg, rgba(168,85,247,0.35) 1px, transparent 1px),
            linear-gradient(150deg, rgba(168,85,247,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168,85,247,0.25) 1px, transparent 1px)
          `,
          backgroundSize: "55px 95px",
          opacity: 0.45,
        }}
      />

      {/* DIAGONAL LINES */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(168,85,247,0.4) 0px, rgba(168,85,247,0.4) 1px, transparent 1px, transparent 80px)",
        }}
      />

      {/* CENTER GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_60%)]" />

      {/* VIGNETTE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,black_100%)]" />

      {/* CONTENT */}
      <div className="relative z-10">
        <PublicNav />
        {children}
      </div>
    </div>
  );
}
