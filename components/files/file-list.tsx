"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, FolderOpen } from "lucide-react";
import { FileItem, FileData } from "./file-item";
import { FolderItem } from "./folder-item";
import { RenameDialog } from "./rename-dialog";
import { MoveDialog } from "./move-dialog";
import { ShareDialog } from "./share-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FolderData {
  id: string;
  name: string;
  parentFolderId: string | null;
  createdAt: Date;
}

interface FileListProps {
  folderId?: string | null;
  refreshTrigger?: number;
  onRefresh?: () => void;
}

type ResourceType = "file" | "folder";
type ResourceData = (FileData & { type: "file" }) | (FolderData & { type: "folder" });

export function FileList({ folderId, refreshTrigger, onRefresh }: FileListProps) {
  const [files, setFiles] = useState<FileData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [renameResource, setRenameResource] = useState<ResourceData | null>(null);
  const [moveResource, setMoveResource] = useState<ResourceData | null>(null);
  const [shareResource, setShareResource] = useState<ResourceData | null>(null);

  const fetchContents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = folderId ? `/api/files?folderId=${folderId}` : "/api/files";
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar arquivos");
      }

      setFiles(data.files || []);
      setFolders(data.folders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents, refreshTrigger]);

  const handleRenameFile = (file: FileData) => {
    setRenameResource({ ...file, type: "file" });
  };

  const handleRenameFolder = (folder: FolderData) => {
    setRenameResource({ ...folder, type: "folder" } as ResourceData);
  };

  const handleMoveFile = (file: FileData) => {
    setMoveResource({ ...file, type: "file" });
  };

  const handleMoveFolder = (folder: FolderData) => {
    setMoveResource({ ...folder, type: "folder" } as ResourceData);
  };

  const handleShareFile = (file: FileData) => {
    setShareResource({ ...file, type: "file" });
  };

  const handleShareFolder = (folder: FolderData) => {
    setShareResource({ ...folder, type: "folder" } as ResourceData);
  };

  const handleDeleteFile = async (file: FileData) => {
    if (!confirm(`Tem certeza que deseja excluir "${file.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir arquivo");
      }

      onRefresh?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir arquivo");
    }
  };

  const handleDeleteFolder = async (folder: FolderData) => {
    if (!confirm(`Tem certeza que deseja excluir a pasta "${folder.name}" e todo seu conteúdo?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir pasta");
      }

      onRefresh?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir pasta");
    }
  };

  const handleRenameComplete = () => {
    setRenameResource(null);
    onRefresh?.();
  };

  const handleMoveComplete = () => {
    setMoveResource(null);
    onRefresh?.();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm">Carregando arquivos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-red-500">
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalItems = files.length + folders.length;

  if (totalItems === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
          <CardDescription>
            Esta pasta está vazia. Faça upload de arquivos ou crie uma nova pasta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm">Nenhum arquivo ou pasta encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
          <CardDescription>
            {folders.length > 0 && `${folders.length} ${folders.length === 1 ? "pasta" : "pastas"}`}
            {folders.length > 0 && files.length > 0 && " • "}
            {files.length > 0 && `${files.length} ${files.length === 1 ? "arquivo" : "arquivos"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Folders first */}
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onRename={handleRenameFolder}
                onMove={handleMoveFolder}
                onDelete={handleDeleteFolder}
                onShare={handleShareFolder}
              />
            ))}
            {/* Then files */}
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onRename={handleRenameFile}
                onMove={handleMoveFile}
                onDelete={handleDeleteFile}
                onShare={handleShareFile}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rename Dialog */}
      {renameResource && (
        <RenameDialog
          open={!!renameResource}
          onOpenChange={(open) => !open && setRenameResource(null)}
          resourceType={renameResource.type}
          resourceId={renameResource.id}
          currentName={renameResource.name}
          onRenameComplete={handleRenameComplete}
        />
      )}

      {/* Move Dialog */}
      {moveResource && (
        <MoveDialog
          open={!!moveResource}
          onOpenChange={(open) => !open && setMoveResource(null)}
          resourceType={moveResource.type}
          resourceId={moveResource.id}
          resourceName={moveResource.name}
          currentFolderId={folderId || null}
          onMoveComplete={handleMoveComplete}
        />
      )}

      {/* Share Dialog */}
      {shareResource && (
        <ShareDialog
          open={!!shareResource}
          onOpenChange={(open) => !open && setShareResource(null)}
          resourceType={shareResource.type}
          resourceId={shareResource.id}
          resourceName={shareResource.name}
        />
      )}
    </>
  );
}
