"use client";

export default function GestionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-purple-400">{title}</h1>
        {subtitle && <p className="text-zinc-400 text-sm">{subtitle}</p>}
      </div>

      {right && <div>{right}</div>}
    </div>
  );
}
