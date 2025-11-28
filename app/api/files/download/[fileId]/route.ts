import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { downloadFile } from "@/lib/storage/nextcloud";
import { logAuditEvent } from "@/lib/audit/logger";
import { canAccessResource } from "@/lib/permissions/check";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Try to get session (optional for download if share link is provided)
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const userId = session?.user?.id || null;

    // Buscar arquivo no banco de dados
    const db = getDb();
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Check if user has permission to download
    const hasAccess = await canAccessResource(
      userId,
      "file",
      fileId,
      "read"
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Você não tem permissão para baixar este arquivo" },
        { status: 403 }
      );
    }

    // Buscar arquivo do Nextcloud via WebDAV
    const downloadResult = await downloadFile(file.storagePath);

    if (!downloadResult.success || !downloadResult.data) {
      console.error("Erro ao baixar do Nextcloud:", downloadResult.error);
      return NextResponse.json(
        { error: "Erro ao baixar arquivo" },
        { status: 500 }
      );
    }

    // Registrar evento de auditoria
    await logAuditEvent({
      userId,
      action: "FILE_DOWNLOAD",
      resourceType: "file",
      resourceId: file.id,
      metadata: {
        fileName: file.name,
        fileSize: file.sizeBytes,
      },
    });

    // Retornar arquivo como resposta
    return new NextResponse(downloadResult.data, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": file.sizeBytes.toString(),
      },
    });
  } catch (error) {
    console.error("Erro no download:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
