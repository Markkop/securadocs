"use client";

import Link from "next/link";
import { Folder, MoreVertical, Pencil, Move, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderData {
  id: string;
  name: string;
  parentFolderId: string | null;
  createdAt: Date;
}

interface FolderItemProps {
  folder: FolderData;
  onRename?: (folder: FolderData) => void;
  onMove?: (folder: FolderData) => void;
  onDelete?: (folder: FolderData) => void;
  onShare?: (folder: FolderData) => void;
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

export function FolderItem({ folder, onRename, onMove, onDelete, onShare }: FolderItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      <Link
        href={`/files/${folder.id}`}
        className="shrink-0 w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
      >
        <Folder className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </Link>

      <Link href={`/files/${folder.id}`} className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate hover:underline">{folder.name}</p>
        <p className="text-xs text-muted-foreground">
          Pasta • {formatDate(folder.createdAt)}
        </p>
      </Link>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onShare?.(folder)}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename?.(folder)}>
              <Pencil className="w-4 h-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove?.(folder)}>
              <Move className="w-4 h-4 mr-2" />
              Mover
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(folder)}
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
