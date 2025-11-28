"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Link2,
  Copy,
  Check,
  Trash2,
  Calendar,
  Users,
  Search,
  UserPlus,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShareLink {
  id: string;
  token: string;
  url: string;
  permissionLevel: string;
  expiresAt: string | null;
  createdAt: string;
  isExpired: boolean;
}

interface UserPermission {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  permissionLevel: string;
  createdAt: string;
}

interface SearchUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "file" | "folder";
  resourceId: string;
  resourceName: string;
}

type TabType = "links" | "users";

export function ShareDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  resourceName,
}: ShareDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>("links");

  // Share links state
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [linkPermissionLevel, setLinkPermissionLevel] = useState<string>("read");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User permissions state
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [userPermissionLevel, setUserPermissionLevel] = useState<string>("read");

  const [error, setError] = useState<string | null>(null);

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchShareLinks();
      fetchUserPermissions();
    }
  }, [open, resourceType, resourceId]);

  // Debounced user search
  useEffect(() => {
    if (!userSearchQuery || userSearchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  const fetchShareLinks = async () => {
    setIsLoadingLinks(true);
    try {
      const response = await fetch(
        `/api/share?resourceType=${resourceType}&resourceId=${resourceId}`
      );
      const data = await response.json();
      if (response.ok) {
        setShareLinks(data.shareLinks || []);
      }
    } catch (err) {
      console.error("Erro ao carregar links:", err);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const fetchUserPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const response = await fetch(
        `/api/permissions?resourceType=${resourceType}&resourceId=${resourceId}`
      );
      const data = await response.json();
      if (response.ok) {
        setUserPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error("Erro ao carregar permissões:", err);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const searchUsers = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        // Filter out users who already have permissions
        const existingUserIds = new Set(userPermissions.map((p) => p.userId));
        const filteredUsers = (data.users || []).filter(
          (u: SearchUser) => !existingUserIds.has(u.id)
        );
        setSearchResults(filteredUsers);
      }
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateLink = async () => {
    setIsCreatingLink(true);
    setError(null);

    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          permissionLevel: linkPermissionLevel,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar link");
      }

      setShareLinks((prev) => [...prev, { ...data.shareLink, isExpired: false }]);
      setLinkPermissionLevel("read");
      setExpiresAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar link");
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const link = shareLinks.find((l) => l.id === linkId);
      if (!link) return;

      const response = await fetch(`/api/share/${link.token}`, { method: "DELETE" });
      if (response.ok) {
        setShareLinks((prev) => prev.filter((l) => l.id !== linkId));
      } else {
        const data = await response.json();
        setError(data.error || "Erro ao revogar link");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao revogar link");
    }
  };

  const handleExtendLink = async (linkId: string) => {
    try {
      const link = shareLinks.find((l) => l.id === linkId);
      if (!link) return;

      // Extend by 7 days from now
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const response = await fetch(`/api/share/${link.token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: newExpiry.toISOString() }),
      });

      const data = await response.json();
      if (response.ok) {
        setShareLinks((prev) =>
          prev.map((l) => (l.id === linkId ? data.shareLink : l))
        );
      } else {
        setError(data.error || "Erro ao renovar link");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao renovar link");
    }
  };

  const handleCopyLink = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  const handleSelectUser = (user: SearchUser) => {
    setSelectedUser(user);
    setUserSearchQuery("");
    setSearchResults([]);
  };

  const handleAddUserPermission = async () => {
    if (!selectedUser) return;

    setIsAddingUser(true);
    setError(null);

    try {
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          userId: selectedUser.id,
          permissionLevel: userPermissionLevel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao adicionar usuário");
      }

      setUserPermissions((prev) => [...prev, data.permission]);
      setSelectedUser(null);
      setUserPermissionLevel("read");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar usuário");
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUserPermission = async (permissionId: string) => {
    try {
      const response = await fetch(`/api/permissions/${permissionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUserPermissions((prev) => prev.filter((p) => p.id !== permissionId));
      } else {
        const data = await response.json();
        setError(data.error || "Erro ao remover acesso");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover acesso");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  };

  const getMinDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
          <DialogDescription>
            Compartilhe &quot;{resourceName}&quot; com pessoas ou via link
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("links")}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "links"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="w-4 h-4 inline-block mr-1.5" />
            Links
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-1.5" />
            Pessoas
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 text-center py-2">{error}</p>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Links Tab */}
          {activeTab === "links" && (
            <>
              {/* Create new link form */}
              <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <h4 className="text-sm font-medium">Criar novo link</h4>

                <div className="space-y-2">
                  <Label htmlFor="link-permission">Permissão</Label>
                  <Select value={linkPermissionLevel} onValueChange={setLinkPermissionLevel}>
                    <SelectTrigger id="link-permission">
                      <SelectValue placeholder="Selecione a permissão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">Somente leitura</SelectItem>
                      <SelectItem value="write">Leitura e escrita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Expiração (opcional)
                  </Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    min={getMinDate()}
                  />
                </div>

                <Button onClick={handleCreateLink} disabled={isCreatingLink} className="w-full">
                  {isCreatingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Criar link
                    </>
                  )}
                </Button>
              </div>

              {/* Existing links */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Links existentes ({shareLinks.length})</h4>

                {isLoadingLinks ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : shareLinks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum link criado ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {shareLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`p-3 rounded-lg border ${
                          link.isExpired
                            ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                            : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono truncate text-muted-foreground">
                              {link.url}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  link.permissionLevel === "write"
                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                }`}
                              >
                                {link.permissionLevel === "write" ? "Leitura/Escrita" : "Leitura"}
                              </span>
                              {link.isExpired && (
                                <span className="text-xs text-red-600 dark:text-red-400">
                                  Expirado
                                </span>
                              )}
                              {link.expiresAt && !link.isExpired && (
                                <span className="text-xs text-muted-foreground">
                                  Expira: {formatDate(link.expiresAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {link.isExpired ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleExtendLink(link.id)}
                                title="Renovar link por mais 7 dias"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyLink(link)}
                              >
                                {copiedId === link.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteLink(link.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <>
              {/* Add user form */}
              <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <h4 className="text-sm font-medium">Adicionar pessoa</h4>

                {!selectedUser ? (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {/* Search results dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-sm font-medium">
                              {user.name?.charAt(0) || user.email.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {userSearchQuery.length >= 2 &&
                      !isSearching &&
                      searchResults.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Nenhum usuário encontrado
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Selected user */}
                    <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-sm font-medium">
                        {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedUser.email}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                      >
                        Alterar
                      </Button>
                    </div>

                    {/* Permission selector */}
                    <div className="space-y-2">
                      <Label htmlFor="user-permission">Permissão</Label>
                      <Select
                        value={userPermissionLevel}
                        onValueChange={setUserPermissionLevel}
                      >
                        <SelectTrigger id="user-permission">
                          <SelectValue placeholder="Selecione a permissão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Somente leitura</SelectItem>
                          <SelectItem value="write">Leitura e escrita</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleAddUserPermission}
                      disabled={isAddingUser}
                      className="w-full"
                    >
                      {isAddingUser ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adicionando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Adicionar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Users with access */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">
                  Pessoas com acesso ({userPermissions.length})
                </h4>

                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : userPermissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma pessoa adicionada ainda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userPermissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center text-sm font-medium">
                          {perm.userName?.charAt(0) || perm.userEmail?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {perm.userName || "Usuário"}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {perm.userEmail}
                            </p>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                perm.permissionLevel === "admin"
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                                  : perm.permissionLevel === "write"
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              }`}
                            >
                              {perm.permissionLevel === "admin"
                                ? "Admin"
                                : perm.permissionLevel === "write"
                                ? "Escrita"
                                : "Leitura"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveUserPermission(perm.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
