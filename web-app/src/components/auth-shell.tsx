export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1fr_440px]">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600">
          {description}
        </p>
      </section>
      <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-200/50 sm:p-6">
        {children}
      </section>
    </main>
  );
}
