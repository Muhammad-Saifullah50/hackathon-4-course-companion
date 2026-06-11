import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm sm:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Course Companion
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">
          Learn to build reliable AI agents.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
          This is the foundation of the standalone LMS. The same account also
          connects your quizzes and progress inside ChatGPT.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          >
            Sign in
          </Link>
          <Link
            href="/account"
            className="rounded-xl px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            View account
          </Link>
        </div>
      </section>
    </main>
  );
}
