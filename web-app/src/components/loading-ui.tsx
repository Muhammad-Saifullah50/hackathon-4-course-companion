import { BookOpen, LoaderCircle } from "lucide-react";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`skeleton block ${className}`} aria-hidden="true" />;
}

export function Spinner({
  className = "",
  size = 16,
  label = "Loading",
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  const announcesStatus = Boolean(label);

  return (
    <span
      className={`inline-loader ${className}`}
      role={announcesStatus ? "status" : undefined}
      aria-hidden={announcesStatus ? undefined : true}
    >
      <LoaderCircle size={size} aria-hidden="true" />
      {announcesStatus ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export function BrandedLoader({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="branded-loader" role="status" aria-live="polite">
      <span className="branded-loader-mark">
        <BookOpen size={18} />
      </span>
      <Spinner size={22} label="" />
      <strong>{label}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}

export function DataErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="protected-empty" role="alert">
      <span className="branded-loader-mark">
        <BookOpen size={18} />
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

export function NavSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </header>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="mb-3 h-8 w-64" />
      <Skeleton className="mb-10 h-4 w-80 max-w-full" />
      <div className="dashboard-grid">
        <div className="grid gap-5">
          <section className="surface-card p-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-5 h-7 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-6 h-11 w-40" />
          </section>
          <section className="surface-card grid gap-3 p-6">
            <Skeleton className="mb-2 h-3 w-28" />
            {Array.from({ length: 5 }, (_, index) => (
              <div className="flex items-center gap-3" key={index}>
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </section>
        </div>
        <aside className="grid content-start gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <section className="surface-card p-5" key={index}>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-3 h-3 w-28" />
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}

export function CourseSkeleton() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Loading course">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-9 w-72 max-w-full" />
      <Skeleton className="mb-10 mt-4 h-4 w-[36rem] max-w-full" />
      <div className="course-list">
        {Array.from({ length: 5 }, (_, index) => (
          <article className="course-card" key={index}>
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-64 max-w-full" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-3 h-3 w-44" />
            </div>
            <Skeleton className="h-11 w-32 rounded-lg" />
          </article>
        ))}
      </div>
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="reader-shell" aria-busy="true" aria-label="Loading chapter">
      <aside className="reader-rail">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="mt-3 h-8 w-full" key={index} />
        ))}
      </aside>
      <main className="reader-main">
        <header className="reader-header">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-5 h-10 w-4/5" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-2/3" />
        </header>
        <div className="max-w-[760px]">
          {Array.from({ length: 4 }, (_, index) => (
            <section className="mb-9" key={index}>
              <Skeleton className="h-7 w-1/2" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
            </section>
          ))}
        </div>
      </main>
      <aside className="toc grid gap-3">
        <Skeleton className="h-3 w-24" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-4 w-full" key={index} />
        ))}
      </aside>
    </div>
  );
}

export function QuizSkeleton() {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-12" aria-busy="true" aria-label="Loading quiz">
      <div className="surface-card grid gap-5 p-8">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton className="h-12 w-full rounded-xl" key={index} />
        ))}
      </div>
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div className="page-shell" aria-busy="true" aria-label="Loading progress">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-64" />
      <div className="stats-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="surface-card p-5" key={index}>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--border)] p-5">
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div className="flex items-center gap-4 border-b border-[var(--border)] p-5 last:border-0" key={index}>
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </section>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-10" aria-busy="true" aria-label="Loading account">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mb-7 mt-4 h-8 w-56" />
      <div className="grid gap-4">
        <section className="surface-card p-6">
          <div className="mb-6 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1"><Skeleton className="h-5 w-52" /><Skeleton className="mt-2 h-3 w-36" /></div>
          </div>
          <div className="grid gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-14 w-full rounded-xl" key={index} />
            ))}
          </div>
        </section>
        {Array.from({ length: 3 }, (_, index) => (
          <section className="surface-card p-6" key={index}>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
          </section>
        ))}
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-10" aria-busy="true" aria-label="Loading search">
      <Skeleton className="mb-6 h-8 w-28" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="mb-4 mt-9 h-3 w-32" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton className="h-8 w-24 rounded-full" key={index} />
        ))}
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-10 px-6 py-12 lg:grid-cols-[1fr_440px]" aria-busy="true" aria-label="Loading authentication">
      <section>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-5 h-12 w-80 max-w-full" />
        <Skeleton className="mt-5 h-5 w-full max-w-xl" />
        <Skeleton className="mt-3 h-5 w-3/4 max-w-lg" />
      </section>
      <section className="surface-card grid gap-4 p-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </section>
    </div>
  );
}
