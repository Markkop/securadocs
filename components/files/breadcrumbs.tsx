"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Home, Loader2 } from "lucide-react";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbsProps {
  currentFolderId: string | null;
}

export function Breadcrumbs({ currentFolderId }: BreadcrumbsProps) {
  const [path, setPath] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentFolderId) {
      setPath([]);
      return;
    }

    const fetchPath = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/folders/${currentFolderId}`);
        if (response.ok) {
          const data = await response.json();
          setPath(data.path || []);
        } else {
          setPath([]);
        }
      } catch (error) {
        console.error("Erro ao buscar caminho:", error);
        setPath([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPath();
  }, [currentFolderId]);

  return (
    <nav className="flex items-center gap-1 text-sm">
      {/* Root link */}
      <Link
        href="/files"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Início</span>
      </Link>

      {loading ? (
        <>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </>
      ) : (
        path.map((item, index) => {
          const isLast = index === path.length - 1;
          return (
            <div key={item.id} className="flex items-center gap-1">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              {isLast ? (
                <span className="font-medium">{item.name}</span>
              ) : (
                <Link
                  href={`/files/${item.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              )}
            </div>
          );
        })
      )}
    </nav>
  );
}
