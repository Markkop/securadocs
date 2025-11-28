"use client";

import {
  FileText,
  Image,
  FileSpreadsheet,
  FileType,
  File,
  Download,
  MoreVertical,
  Pencil,
  Move,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FileData {
  id: string;
  name: string;
  mimeType: string | null;
  sizeBytes: number;
  folderId?: string | null;
  createdAt: Date;
}

interface FileItemProps {
  file: FileData;
  onRename?: (file: FileData) => void;
  onMove?: (file: FileData) => void;
  onDelete?: (file: FileData) => void;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;

  if (mimeType.startsWith("image/")) return Image;
  if (mimeType === "application/pdf") return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return FileSpreadsheet;
  if (mimeType.includes("document") || mimeType.includes("word"))
    return FileType;

  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function FileItem({ file, onRename, onMove, onDelete }: FileItemProps) {
  const Icon = getFileIcon(file.mimeType);

  const handleDownload = () => {
    window.open(`/api/files/download/${file.id}`, "_blank");
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.sizeBytes)} • {formatDate(file.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          className="hidden sm:flex"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename?.(file)}>
              <Pencil className="w-4 h-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove?.(file)}>
              <Move className="w-4 h-4 mr-2" />
              Mover
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(file)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
