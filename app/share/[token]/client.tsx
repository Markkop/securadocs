"use client";

import { useState } from "react";
import {
  FileText,
  Folder,
  Download,
  User,
  Calendar,
  Shield,
  AlertTriangle,
  Loader2,
  File,
  Image,
  FileSpreadsheet,
  FileType,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ShareData {
  shareLink: {
    token: string;
    permissionLevel: string;
    expiresAt: string | null;
    isExpired: boolean;
  };
  resource: {
    id: string;
    name: string;
    type: "file" | "folder";
    mimeType?: string | null;
    sizeBytes?: number;
    ownerName: string;
    ownerId: string;
  };
  folderContents?: Array<{
    id: string;
    name: string;
    mimeType: string | null;
    sizeBytes: number;
  }> | null;
}

interface SharePageClientProps {
  data: ShareData;
  token: string;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return FileSpreadsheet;
  if (mimeType.includes("document") || mimeType.includes("word")) return FileType;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export function SharePageClient({ data, token }: SharePageClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const { shareLink, resource, folderContents } = data;

  const handleDownload = async () => {
    if (resource.type !== "file") return;

    setIsDownloading(true);
    try {
      // Use the POST endpoint for download via share link
      const response = await fetch(`/api/share/${token}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao baixar arquivo");
        return;
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = resource.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erro no download:", err);
      alert("Erro ao baixar arquivo");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadFolderFile = async (fileId: string, fileName: string) => {
    setDownloadingFileId(fileId);
    try {
      // For folder files, we need a specific endpoint
      const response = await fetch(`/api/share/${token}/file/${fileId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao baixar arquivo");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erro no download:", err);
      alert("Erro ao baixar arquivo");
    } finally {
      setDownloadingFileId(null);
    }
  };

  // Show expired message
  if (shareLink.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-600 dark:text-red-400">
              Link Expirado
            </CardTitle>
            <CardDescription>
              Este link de compartilhamento expirou e não está mais disponível.
              Solicite um novo link ao proprietário do arquivo.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const ResourceIcon = resource.type === "folder" ? Folder : getFileIcon(resource.mimeType || null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ResourceIcon className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-xl">{resource.name}</CardTitle>
          <CardDescription>
            {resource.type === "file" ? "Arquivo compartilhado" : "Pasta compartilhada"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resource info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Compartilhado por: <strong className="text-foreground">{resource.ownerName}</strong></span>
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>
                Permissão:{" "}
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    shareLink.permissionLevel === "write"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {shareLink.permissionLevel === "write" ? "Leitura/Escrita" : "Somente leitura"}
                </span>
              </span>
            </div>

            {resource.sizeBytes && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Tamanho: {formatFileSize(resource.sizeBytes)}</span>
              </div>
            )}

            {shareLink.expiresAt && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Expira em: {formatDate(shareLink.expiresAt)}</span>
              </div>
            )}
          </div>

          {/* Download button for files */}
          {resource.type === "file" && (
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full"
              size="lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Baixar arquivo
                </>
              )}
            </Button>
          )}

          {/* Folder contents */}
          {resource.type === "folder" && folderContents && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                Conteúdo da pasta ({folderContents.length} arquivos)
              </h4>
              {folderContents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Esta pasta está vazia
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {folderContents.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center">
                          <FileIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.sizeBytes)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFolderFile(file.id, file.name)}
                          disabled={downloadingFileId === file.id}
                        >
                          {downloadingFileId === file.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SecuraDocs branding */}
          <div className="text-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-muted-foreground">
              Compartilhado com segurança via{" "}
              <span className="font-semibold text-foreground">SecuraDocs</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
