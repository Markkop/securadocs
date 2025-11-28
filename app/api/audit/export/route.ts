import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, users, files, folders } from "@/lib/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const action = searchParams.get("action");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const db = getDb();

    // Build where conditions
    const conditions = [eq(auditLogs.userId, session.user.id)];

    if (action && action !== "all") {
      conditions.push(eq(auditLogs.action, action));
    }

    if (dateFrom) {
      conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    // Get all logs (no pagination for export)
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        ipAddress: auditLogs.ipAddress,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10000); // Safety limit

    // Enrich logs with resource names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let resourceName: string | null = null;

        if (log.resourceId && log.resourceType) {
          if (log.resourceType === "file") {
            const file = await db
              .select({ name: files.name })
              .from(files)
              .where(eq(files.id, log.resourceId))
              .limit(1);
            resourceName = file[0]?.name || null;
          } else if (log.resourceType === "folder") {
            const folder = await db
              .select({ name: folders.name })
              .from(folders)
              .where(eq(folders.id, log.resourceId))
              .limit(1);
            resourceName = folder[0]?.name || null;
          } else if (log.resourceType === "user") {
            const user = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, log.resourceId))
              .limit(1);
            resourceName = user[0]?.name || null;
          }
        }

        return {
          id: log.id,
          action: log.action,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          resourceName,
          ipAddress: log.ipAddress,
          createdAt: log.createdAt,
        };
      })
    );

    if (format === "json") {
      return new NextResponse(JSON.stringify(enrichedLogs, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.json"`,
        },
      });
    }

    // CSV format
    const headers = [
      "ID",
      "Ação",
      "Tipo de Recurso",
      "ID do Recurso",
      "Nome do Recurso",
      "Endereço IP",
      "Data/Hora",
    ];

    const actionLabels: Record<string, string> = {
      LOGIN: "Login",
      LOGOUT: "Logout",
      FILE_UPLOAD: "Upload de arquivo",
      FILE_DOWNLOAD: "Download de arquivo",
      FILE_DELETE: "Exclusão de arquivo",
      FOLDER_CREATE: "Criação de pasta",
      FOLDER_DELETE: "Exclusão de pasta",
      PERMISSION_CREATE: "Permissão criada",
      PERMISSION_REVOKE: "Permissão revogada",
      SHARE_LINK_CREATE: "Link criado",
      SHARE_LINK_REVOKE: "Link revogado",
    };

    const resourceTypeLabels: Record<string, string> = {
      file: "Arquivo",
      folder: "Pasta",
      user: "Usuário",
    };

    const rows = enrichedLogs.map((log) => [
      log.id,
      actionLabels[log.action] || log.action,
      log.resourceType ? resourceTypeLabels[log.resourceType] || log.resourceType : "",
      log.resourceId || "",
      log.resourceName || "",
      log.ipAddress || "",
      new Date(log.createdAt).toLocaleString("pt-BR"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const cellStr = String(cell);
            // Escape quotes and wrap in quotes if contains comma or newline
            if (cellStr.includes(",") || cellStr.includes("\n") || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    // Add BOM for UTF-8 compatibility with Excel
    const bom = "\uFEFF";

    return new NextResponse(bom + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar logs de auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao exportar logs de auditoria" },
      { status: 500 }
    );
  }
}
