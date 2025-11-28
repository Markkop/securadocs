"use client";

import { useState, useEffect, useCallback } from "react";
import { AuditFilters } from "@/components/audit/audit-filters";
import { AuditTable } from "@/components/audit/audit-table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "all",
    dateFrom: "",
    dateTo: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    action: "all",
    dateFrom: "",
    dateTo: "",
  });

  const fetchLogs = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");

        if (appliedFilters.action !== "all") {
          params.set("action", appliedFilters.action);
        }
        if (appliedFilters.dateFrom) {
          params.set("dateFrom", appliedFilters.dateFrom);
        }
        if (appliedFilters.dateTo) {
          params.set("dateTo", appliedFilters.dateTo);
        }

        const response = await fetch(`/api/audit?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Erro ao buscar logs");
        }

        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Erro ao buscar logs:", error);
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearch = () => {
    setAppliedFilters(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      action: "all",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const handlePageChange = (page: number) => {
    fetchLogs(page);
  };

  const handleExport = async (format: "csv" | "json") => {
    const params = new URLSearchParams();
    params.set("format", format);

    if (appliedFilters.action !== "all") {
      params.set("action", appliedFilters.action);
    }
    if (appliedFilters.dateFrom) {
      params.set("dateFrom", appliedFilters.dateFrom);
    }
    if (appliedFilters.dateTo) {
      params.set("dateTo", appliedFilters.dateTo);
    }

    const response = await fetch(`/api/audit/export?${params.toString()}`);
    if (!response.ok) {
      console.error("Erro ao exportar logs");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as atividades da sua conta
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={loading || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("json")}
            disabled={loading || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <AuditFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onClear={handleClear}
        />

        <AuditTable
          logs={logs}
          pagination={pagination}
          loading={loading}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
