import type { ReactNode } from "react";
import { SearchMethodExplorer } from "@/components/search-method-explorer";

export default function SearchSortLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SearchMethodExplorer />
    </>
  );
}
