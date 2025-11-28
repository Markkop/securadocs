"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
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
  Clock,
  ArrowRight,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  createdAt: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  LOGIN: {
    label: "Login realizado",
    icon: <LogIn className="h-4 w-4" />,
    color: "text-green-600",
  },
  LOGOUT: {
    label: "Logout realizado",
    icon: <LogOut className="h-4 w-4" />,
    color: "text-gray-600",
  },
  FILE_UPLOAD: {
    label: "Arquivo enviado",
    icon: <Upload className="h-4 w-4" />,
    color: "text-blue-600",
  },
  FILE_DOWNLOAD: {
    label: "Arquivo baixado",
    icon: <Download className="h-4 w-4" />,
    color: "text-purple-600",
  },
  FILE_DELETE: {
    label: "Arquivo excluído",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-red-600",
  },
  FOLDER_CREATE: {
    label: "Pasta criada",
    icon: <FolderPlus className="h-4 w-4" />,
    color: "text-amber-600",
  },
  FOLDER_DELETE: {
    label: "Pasta excluída",
    icon: <Trash2 className="h-4 w-4" />,
    color: "text-red-600",
  },
  PERMISSION_CREATE: {
    label: "Permissão concedida",
    icon: <UserPlus className="h-4 w-4" />,
    color: "text-teal-600",
  },
  PERMISSION_REVOKE: {
    label: "Permissão revogada",
    icon: <UserMinus className="h-4 w-4" />,
    color: "text-orange-600",
  },
  SHARE_LINK_CREATE: {
    label: "Link de compartilhamento criado",
    icon: <Link2 className="h-4 w-4" />,
    color: "text-indigo-600",
  },
  SHARE_LINK_REVOKE: {
    label: "Link de compartilhamento revogado",
    icon: <LinkIcon className="h-4 w-4" />,
    color: "text-pink-600",
  },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "agora mesmo";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `há ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `há ${diffInDays} dia${diffInDays > 1 ? "s" : ""}`;
  }

  return date.toLocaleDateString("pt-BR");
}

export function RecentActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setActivity(data.recentActivity || []);
        }
      } catch (error) {
        console.error("Erro ao buscar atividades:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas ações na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas ações na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade registrada ainda</p>
            <p className="text-sm mt-1">
              Suas ações aparecerão aqui quando você usar a plataforma
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas ações na plataforma</CardDescription>
        </div>
        <Link href="/audit">
          <Button variant="ghost" size="sm">
            Ver tudo
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.map((item) => {
            const config = ACTION_CONFIG[item.action] || {
              label: item.action,
              icon: null,
              color: "text-gray-600",
            };

            return (
              <div key={item.id} className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 ${config.color}`}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{config.label}</p>
                  {item.resourceName && (
                    <p className="text-sm text-muted-foreground truncate">
                      {item.resourceName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
