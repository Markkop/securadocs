import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files, folders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

// PATCH: Move file to a different folder
export async function PATCH(
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

    // Parse request body
    const body = await request.json();
    const { targetFolderId } = body; // null means move to root

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

    // If targetFolderId is provided, validate it exists and belongs to user
    if (targetFolderId) {
      const [targetFolder] = await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.id, targetFolderId),
            eq(folders.ownerId, userId)
          )
        );

      if (!targetFolder) {
        return NextResponse.json(
          { error: "Pasta de destino não encontrada" },
          { status: 404 }
        );
      }
    }

    // Update the file's folderId
    const [updatedFile] = await db
      .update(files)
      .set({ folderId: targetFolderId || null })
      .where(eq(files.id, fileId))
      .returning();

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FILE_UPLOAD", // Using FILE_UPLOAD as proxy for FILE_MOVE
        resourceType: "file",
        resourceId: fileId,
        metadata: {
          action: "move",
          fromFolderId: file.folderId,
          toFolderId: targetFolderId || null,
        },
      });
    } catch (auditError) {
      console.warn("Erro ao registrar auditoria (não crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      file: {
        id: updatedFile.id,
        name: updatedFile.name,
        folderId: updatedFile.folderId,
      },
    });
  } catch (error) {
    console.error("Erro ao mover arquivo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
