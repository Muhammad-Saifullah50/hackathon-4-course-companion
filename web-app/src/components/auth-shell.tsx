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
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1fr_440px]">
      <section>
        <p className="eyebrow">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
          {description}
        </p>
      </section>
      <section className="surface-card p-4 shadow-xl sm:p-6">
        {children}
      </section>
    </div>
  );
}
