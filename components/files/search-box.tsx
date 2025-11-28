"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, File, Folder, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  folderId?: string | null;
  parentFolderId?: string | null;
  mimeType?: string | null;
  sizeBytes?: number;
}

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        // Combine files and folders, folders first
        const combined: SearchResult[] = [
          ...(data.folders || []).map((f: SearchResult) => ({ ...f, type: "folder" as const })),
          ...(data.files || []).map((f: SearchResult) => ({ ...f, type: "file" as const })),
        ];
        setResults(combined.slice(0, 10)); // Limit to 10 results
        setIsOpen(combined.length > 0);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Erro na busca:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "folder") {
      router.push(`/files/${result.id}`);
    } else {
      // Navigate to the file's folder
      if (result.folderId) {
        router.push(`/files/${result.folderId}`);
      } else {
        router.push("/files");
      }
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar arquivos e pastas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border rounded-lg shadow-lg overflow-hidden z-50">
          {results.length === 0 && !loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                >
                  {result.type === "folder" ? (
                    <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                  ) : (
                    <File className="w-5 h-5 text-zinc-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.name}</p>
                    {result.path && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.path}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
