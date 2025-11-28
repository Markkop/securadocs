import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, users, files, folders } from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, or } from "drizzle-orm";

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
    const action = searchParams.get("action");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const resourceId = searchParams.get("resourceId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

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
      // Add 1 day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(auditLogs.createdAt, endDate));
    }

    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId));
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    // Get logs with pagination
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
      .limit(limit)
      .offset(offset);

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
          ...log,
          resourceName,
        };
      })
    );

    return NextResponse.json({
      logs: enrichedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar logs de auditoria:", error);
    return NextResponse.json(
      { error: "Erro ao buscar logs de auditoria" },
      { status: 500 }
    );
  }
}
