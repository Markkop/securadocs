import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/storage/nextcloud";
import { logAuditEvent } from "@/lib/audit/logger";

// DELETE: Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Validate session
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const db = getDb();

    // Validate the file exists and belongs to user
    const [file] = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.id, fileId),
          eq(files.ownerId, userId)
        )
      );

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Delete from Nextcloud Storage
    try {
      const result = await deleteFile(file.storagePath);
      if (!result.success) {
        console.warn("Erro ao deletar do storage (não crítico):", result.error);
      }
    } catch (storageError) {
      console.warn("Erro ao deletar do storage (não crítico):", storageError);
    }

    // Delete from database
    await db.delete(files).where(eq(files.id, fileId));

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FILE_DELETE",
        resourceType: "file",
        resourceId: fileId,
        metadata: {
          fileName: file.name,
          fileSize: file.sizeBytes,
        },
      });
    } catch (auditError) {
      console.warn("Erro ao registrar auditoria (não crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar arquivo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
