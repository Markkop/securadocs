import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { shareLinks, files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";
import { downloadFile } from "@/lib/storage/nextcloud";

// POST - Download a file from a shared folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; fileId: string }> }
) {
  try {
    const { token, fileId } = await params;
    const db = getDb();

    // Find the share link
    const [shareLink] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, token))
      .limit(1);

    if (!shareLink) {
      return NextResponse.json(
        { error: "Link não encontrado" },
        { status: 404 }
      );
    }

    // Check if expired
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Este link expirou" },
        { status: 410 }
      );
    }

    // Only folders can have file downloads via this endpoint
    if (shareLink.resourceType !== "folder") {
      return NextResponse.json(
        { error: "Este endpoint é apenas para pastas compartilhadas" },
        { status: 400 }
      );
    }

    // Get the file and verify it belongs to the shared folder
    const [file] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.folderId, shareLink.resourceId)
        )
      )
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado nesta pasta" },
        { status: 404 }
      );
    }

    // Download from Nextcloud Storage via WebDAV
    const downloadResult = await downloadFile(file.storagePath);

    if (!downloadResult.success || !downloadResult.data) {
      console.error("Erro ao baixar do Nextcloud:", downloadResult.error);
      return NextResponse.json(
        { error: "Erro ao baixar arquivo" },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: null,
      action: "FILE_DOWNLOAD",
      resourceType: "file",
      resourceId: file.id,
      metadata: {
        fileName: file.name,
        fileSize: file.sizeBytes,
        viaShareLink: true,
        shareLinkToken: token,
        sharedFolderId: shareLink.resourceId,
      },
    });

    // Return file
    return new NextResponse(downloadResult.data, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": file.sizeBytes.toString(),
      },
    });
  } catch (error) {
    console.error("Erro no download via link compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
