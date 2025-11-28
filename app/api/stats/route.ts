import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files, folders, auditLogs } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const db = getDb();
    const userId = session.user.id;

    // Get file count and total size
    const fileStats = await db
      .select({
        count: sql<number>`count(*)`,
        totalSize: sql<number>`coalesce(sum(${files.sizeBytes}), 0)`,
      })
      .from(files)
      .where(eq(files.ownerId, userId));

    // Get folder count
    const folderStats = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(folders)
      .where(eq(folders.ownerId, userId));

    // Get recent activity (last 10 events)
    const recentActivity = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    // Enrich activity with resource names
    const enrichedActivity = await Promise.all(
      recentActivity.map(async (log) => {
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
          }
        }

        return {
          ...log,
          resourceName,
        };
      })
    );

    return NextResponse.json({
      stats: {
        totalFiles: Number(fileStats[0]?.count || 0),
        totalFolders: Number(folderStats[0]?.count || 0),
        totalStorageBytes: Number(fileStats[0]?.totalSize || 0),
      },
      recentActivity: enrichedActivity,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
