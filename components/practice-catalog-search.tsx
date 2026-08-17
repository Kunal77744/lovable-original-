"use client";

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PracticeCatalogSearchContextValue = {
  query: string;
  normalizedQuery: string;
  setQuery: (query: string) => void;
};

const PracticeCatalogSearchContext =
  createContext<PracticeCatalogSearchContextValue | null>(null);

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function matchesCatalogQuery(searchText: string, normalizedQuery: string) {
  return (
    normalizedQuery.length === 0 ||
    normalizeSearchText(searchText).includes(normalizedQuery)
  );
}

function usePracticeCatalogSearch() {
  return useContext(PracticeCatalogSearchContext);
}

export function PracticeCatalogSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const value = useMemo(
    () => ({
      query,
      normalizedQuery: normalizeSearchText(query),
      setQuery,
    }),
    [query],
  );

  return (
    <PracticeCatalogSearchContext.Provider value={value}>
      {children}
    </PracticeCatalogSearchContext.Provider>
  );
}

export function PracticeCatalogSearchControl({
  problemSearchTexts,
  labSearchTexts,
}: {
  problemSearchTexts: string[];
  labSearchTexts: string[];
}) {
  const search = usePracticeCatalogSearch();
  const inputId = useId();
  const statusId = useId();

  if (!search) return null;

  const problemMatchCount = problemSearchTexts.filter((searchText) =>
    matchesCatalogQuery(searchText, search.normalizedQuery),
  ).length;
  const labMatchCount = labSearchTexts.filter((searchText) =>
    matchesCatalogQuery(searchText, search.normalizedQuery),
  ).length;
  const hasQuery = search.normalizedQuery.length > 0;
  const totalMatchCount = problemMatchCount + labMatchCount;
  const resultCopy = hasQuery
    ? totalMatchCount === 0
      ? `No judged problems or guided labs match “${search.query.trim()}”.`
      : `${problemMatchCount} ${problemMatchCount === 1 ? "judged problem" : "judged problems"} and ${labMatchCount} ${labMatchCount === 1 ? "guided lab" : "guided labs"} match.`
    : `Search ${problemSearchTexts.length} visible judged problems and ${labSearchTexts.length} visible guided labs.`;

  return (
    <div className="practice-catalog-search">
      <div className="practice-catalog-search-heading">
        <div>
          <label htmlFor={inputId}>Find a practice activity</label>
          <p>Match a title or concept inside your current progress filters.</p>
        </div>
        <p aria-live="polite" id={statusId} role="status">
          {resultCopy}
        </p>
      </div>
      <div className="practice-catalog-search-field">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.4 15.4 4.1 4.1" />
        </svg>
        <input
          aria-describedby={statusId}
          autoComplete="off"
          id={inputId}
          maxLength={80}
          onChange={(event) => search.setQuery(event.target.value)}
          placeholder="Try arrays, recursion, or binary search"
          type="search"
          value={search.query}
        />
        {hasQuery ? (
          <button type="button" onClick={() => search.setQuery("")}>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function PracticeCatalogSearchGroup({
  children,
  searchTexts,
}: {
  children: ReactNode;
  searchTexts: string[];
}) {
  const search = usePracticeCatalogSearch();

  if (
    search?.normalizedQuery &&
    !searchTexts.some((searchText) =>
      matchesCatalogQuery(searchText, search.normalizedQuery),
    )
  ) {
    return null;
  }

  return children;
}

export function PracticeCatalogSearchItem({
  children,
  searchText,
}: {
  children: ReactNode;
  searchText: string;
}) {
  const search = usePracticeCatalogSearch();

  if (
    search?.normalizedQuery &&
    !matchesCatalogQuery(searchText, search.normalizedQuery)
  ) {
    return null;
  }

  return children;
}
