"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Upload,
  Download,
  Trash2,
  FolderPlus,
  Share2,
  UserPlus,
  UserMinus,
  Link2,
  LinkIcon,
  FileIcon,
  FolderIcon,
  UserIcon,
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasMore: boolean;
}

interface AuditTableProps {
  logs: AuditLog[];
  pagination: Pagination;
  loading: boolean;
  onPageChange: (page: number) => void;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LOGIN: {
    label: "Login",
    icon: <LogIn className="h-4 w-4" />,
    color: "text-green-600 bg-green-50 dark:bg-green-900/20",
  },
  LOGOUT: {
    label: "Logout",
    icon: <LogOut className="h-4 w-4" />,
    color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20",
  },
  FILE_UPLOAD: {
    label: "Upload",
    icon: <Upload className="h-4 w-4" />,
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  },
  FILE_DOWNLOAD: {
    label: "Download",
    icon: <Download className="h-4 w-4" />,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  },
  FILE_DELETE: {
    label: "Arquivo excluído",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-red-600 bg-red-50 dark:bg-red-900/20",
  },
  FOLDER_CREATE: {
    label: "Pasta criada",
    icon: <FolderPlus className="h-4 w-4" />,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
  },
  FOLDER_DELETE: {
    label: "Pasta excluída",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-red-600 bg-red-50 dark:bg-red-900/20",
  },
  PERMISSION_CREATE: {
    label: "Permissão criada",
    icon: <UserPlus className="h-4 w-4" />,
    color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20",
  },
  PERMISSION_REVOKE: {
    label: "Permissão revogada",
    icon: <UserMinus className="h-4 w-4" />,
    color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  },
  SHARE_LINK_CREATE: {
    label: "Link criado",
    icon: <Link2 className="h-4 w-4" />,
    color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
  },
  SHARE_LINK_REVOKE: {
    label: "Link revogado",
    icon: <LinkIcon className="h-4 w-4" />,
    color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20",
  },
};

function getResourceIcon(resourceType: string | null) {
  switch (resourceType) {
    case "file":
      return <FileIcon className="h-4 w-4 text-muted-foreground" />;
    case "folder":
      return <FolderIcon className="h-4 w-4 text-muted-foreground" />;
    case "user":
      return <UserIcon className="h-4 w-4 text-muted-foreground" />;
    default:
      return null;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AuditTable({
  logs,
  pagination,
  loading,
  onPageChange,
}: AuditTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          Carregando logs...
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg border">
        <div className="p-8 text-center text-muted-foreground">
          Nenhum log encontrado para os filtros selecionados.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50">
              <th className="text-left p-4 font-medium text-sm">Ação</th>
              <th className="text-left p-4 font-medium text-sm">Recurso</th>
              <th className="text-left p-4 font-medium text-sm">IP</th>
              <th className="text-left p-4 font-medium text-sm">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.action] || {
                label: log.action,
                icon: null,
                color: "text-gray-600 bg-gray-50",
              };

              return (
                <tr
                  key={log.id}
                  className="border-b last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
                    >
                      {config.icon}
                      {config.label}
                    </span>
                  </td>
                  <td className="p-4">
                    {log.resourceName || log.resourceId ? (
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resourceType)}
                        <span className="text-sm">
                          {log.resourceName || log.resourceId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground font-mono">
                      {log.ipAddress || "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t">
        <p className="text-sm text-muted-foreground">
          Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
          {Math.min(pagination.page * pagination.limit, pagination.totalCount)}{" "}
          de {pagination.totalCount} registros
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasMore}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
