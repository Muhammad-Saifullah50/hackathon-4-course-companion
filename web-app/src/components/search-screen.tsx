"use client";

import { ArrowRight, Lock, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SearchSkeleton, Skeleton, Spinner } from "@/components/loading-ui";
import type {
  ChapterSummary,
  SearchResponse,
  SearchResult,
} from "@/lib/api-types";

const suggestions = ["agent loop", "tool use", "prompt caching", "streaming", "MCP server", "skill composition"];

export function SearchScreen({ chapters }: { chapters: ChapterSummary[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]); setSearched(false); return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true); setError("");
      void fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Search failed");
          return (await response.json()) as SearchResponse;
        })
        .then((response) => {
          setResults(response.results);
          setSearched(true);
        })
        .catch(() => setError("Search is temporarily unavailable."))
        .finally(() => setLoading(false));
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [query]);

  return (
      <div className="mx-auto max-w-[760px] px-5 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Search</h1>
        <div className="search-input">
          <Search size={17} />
          <input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chapters, concepts, terms..." />
          {loading ? <Spinner label="Searching" /> : query ? <button onClick={() => setQuery("")}><X size={16} /></button> : null}
        </div>
        {!query && (
          <>
            <p className="eyebrow mb-3 mt-8">Suggested topics</p>
            <div className="flex flex-wrap gap-2">{suggestions.map((item) => <button className="search-pill" onClick={() => setQuery(item)} key={item}>{item}</button>)}</div>
            <p className="eyebrow mb-3 mt-10">Browse chapters</p>
            <div className="grid gap-2">{chapters.map((chapter) => <Link className="search-result" href={chapter.accessible === false ? "/account" : `/course/${chapter.slug}`} key={chapter.slug}><span>{chapter.order}</span><strong>{chapter.title}</strong>{chapter.accessible === false ? <Lock size={14} /> : <ArrowRight size={14} />}</Link>)}</div>
          </>
        )}
        {loading && !searched && (
          <div className="mt-7 grid gap-3" aria-busy="true" aria-label="Loading search results">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="search-result" key={index}>
                <Skeleton className="h-7 w-7" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="form-error mt-6">{error}</p>}
        {searched && (
          <div className="mt-7 grid gap-3">
            <p className="muted text-xs">{results.length} result{results.length === 1 ? "" : "s"} for “{query}”</p>
            {loading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div className="search-result" key={index}>
                  <Skeleton className="h-7 w-7" />
                  <div className="flex-1"><Skeleton className="h-4 w-1/2" /><Skeleton className="mt-2 h-3 w-full" /></div>
                </div>
              ))
            ) : results.length ? results.map((result) => <Link className="search-result items-start" href={result.accessible === false ? "/account" : `/course/${result.slug}`} key={result.slug}>{result.accessible === false ? <Lock size={15} /> : <Search size={15} />}<span><strong>{result.title}</strong><small>{result.accessible === false ? "Premium chapter" : result.excerpt}</small></span>{result.accessible === false ? <Lock size={14} /> : <ArrowRight size={14} />}</Link>) : <div className="surface-card p-10 text-center muted">No matching course content. Try another phrase.</div>}
          </div>
        )}
      </div>
  );
}
