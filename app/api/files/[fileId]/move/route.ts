import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";
import { canAccessResource } from "@/lib/permissions/check";

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

    // Check if user has write permission on the file
    const hasFileAccess = await canAccessResource(
      userId,
      "file",
      fileId,
      "write"
    );

    if (!hasFileAccess) {
      return NextResponse.json(
        { error: "Você não tem permissão para mover este arquivo" },
        { status: 403 }
      );
    }

    // Get the file
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

    // If targetFolderId is provided, validate user has write access to it
    if (targetFolderId) {
      const hasTargetAccess = await canAccessResource(
        userId,
        "folder",
        targetFolderId,
        "write"
      );

      if (!hasTargetAccess) {
        return NextResponse.json(
          { error: "Pasta de destino não encontrada ou sem permissão" },
          { status: 403 }
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
