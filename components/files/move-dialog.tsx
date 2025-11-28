"use client";

import { useState, useEffect, useCallback } from "react";
import { Folder, ChevronRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FolderData {
  id: string;
  name: string;
  parentFolderId: string | null;
}

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "file" | "folder";
  resourceId: string;
  resourceName: string;
  currentFolderId: string | null;
  onMoveComplete?: () => void;
}

export function MoveDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
  currentFolderId,
  onMoveComplete,
}: MoveDialogProps) {
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [browseFolderId, setBrowseFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Início" },
  ]);

  const fetchFolders = useCallback(async (parentId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const url = parentId
        ? `/api/folders?parentFolderId=${parentId}`
        : "/api/folders";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar pastas");
      }

      // Filter out the resource being moved if it's a folder
      let filteredFolders = data.folders || [];
      if (resourceType === "folder") {
        filteredFolders = filteredFolders.filter(
          (f: FolderData) => f.id !== resourceId
        );
      }

      setFolders(filteredFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pastas");
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId]);

  useEffect(() => {
    if (open) {
      setBrowseFolderId(null);
      setBreadcrumbs([{ id: null, name: "Início" }]);
      fetchFolders(null);
    }
  }, [open, fetchFolders]);

  const navigateToFolder = async (folderId: string | null, folderName: string) => {
    setBrowseFolderId(folderId);
    
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: "Início" }]);
    } else {
      // Add to breadcrumbs if not navigating back
      const existingIndex = breadcrumbs.findIndex((b) => b.id === folderId);
      if (existingIndex >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }

    await fetchFolders(folderId);
  };

  const handleMove = async () => {
    setMoving(true);
    setError(null);

    try {
      const endpoint =
        resourceType === "file"
          ? `/api/files/${resourceId}/move`
          : `/api/folders/${resourceId}/move`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetFolderId: browseFolderId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao mover");
      }

      onOpenChange(false);
      onMoveComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao mover");
    } finally {
      setMoving(false);
    }
  };

  const isCurrentLocation = browseFolderId === currentFolderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mover {resourceType === "file" ? "arquivo" : "pasta"}</DialogTitle>
          <DialogDescription>
            Selecione a pasta de destino para &quot;{resourceName}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id ?? "root"} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
              <button
                onClick={() => navigateToFolder(crumb.id, crumb.name)}
                className="text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                disabled={loading}
              >
                {index === 0 ? (
                  <Home className="w-4 h-4" />
                ) : (
                  crumb.name
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Folder list */}
        <div className="border rounded-lg min-h-[200px] max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-500 text-sm">
              {error}
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
              <Folder className="w-8 h-8 mb-2 opacity-50" />
              <p>Nenhuma subpasta</p>
            </div>
          ) : (
            <div className="divide-y">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder.id, folder.name)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
                  disabled={loading}
                >
                  <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-sm truncate">{folder.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current location indicator */}
        <div className="text-sm text-muted-foreground">
          Destino selecionado:{" "}
          <span className="font-medium text-foreground">
            {browseFolderId ? breadcrumbs[breadcrumbs.length - 1]?.name : "Raiz"}
          </span>
          {isCurrentLocation && (
            <span className="text-amber-600 ml-2">(localização atual)</span>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={moving || isCurrentLocation}
          >
            {moving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Movendo...
              </>
            ) : (
              "Mover para cá"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
