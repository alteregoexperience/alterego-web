import PublicNav from "./PublicNav";
import PublicFooter from "./PublicFooter";

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

      {/* CENTER GLOW */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_60%)]" />

      {/* VIGNETTE */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_60%,black_100%)]" />

      {/* CONTENT */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        <PublicNav />
        <div className="flex-1">{children}</div>
        <PublicFooter />
      </div>
    </div>
  );
}
