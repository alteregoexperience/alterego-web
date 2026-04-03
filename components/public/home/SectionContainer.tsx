export default function SectionContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 md:px-10 py-28">
      {children}
    </section>
  );
}
