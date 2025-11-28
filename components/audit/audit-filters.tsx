"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

const AUDIT_ACTIONS = [
  { value: "all", label: "Todas as ações" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "FILE_UPLOAD", label: "Upload de arquivo" },
  { value: "FILE_DOWNLOAD", label: "Download de arquivo" },
  { value: "FILE_DELETE", label: "Exclusão de arquivo" },
  { value: "FOLDER_CREATE", label: "Criação de pasta" },
  { value: "FOLDER_DELETE", label: "Exclusão de pasta" },
  { value: "PERMISSION_CREATE", label: "Permissão criada" },
  { value: "PERMISSION_REVOKE", label: "Permissão revogada" },
  { value: "SHARE_LINK_CREATE", label: "Link criado" },
  { value: "SHARE_LINK_REVOKE", label: "Link revogado" },
];

interface AuditFiltersProps {
  filters: {
    action: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: {
    action: string;
    dateFrom: string;
    dateTo: string;
  }) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function AuditFilters({
  filters,
  onFiltersChange,
  onSearch,
  onClear,
}: AuditFiltersProps) {
  const hasFilters =
    filters.action !== "all" || filters.dateFrom || filters.dateTo;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border p-4 space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="action">Tipo de Ação</Label>
          <Select
            value={filters.action}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, action: value })
            }
          >
            <SelectTrigger id="action">
              <SelectValue placeholder="Selecione uma ação" />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_ACTIONS.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateFrom">Data Inicial</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateFrom: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateTo">Data Final</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              onFiltersChange({ ...filters, dateTo: e.target.value })
            }
          />
        </div>

        <div className="flex items-end gap-2">
          <Button onClick={onSearch} className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          {hasFilters && (
            <Button variant="outline" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
