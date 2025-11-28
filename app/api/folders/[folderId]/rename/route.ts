import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

// PATCH: Rename a folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;

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
    const { name } = body;

    // Validate name
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Nome não pode ser vazio" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 255) {
      return NextResponse.json(
        { error: "Nome muito longo (máximo 255 caracteres)" },
        { status: 400 }
      );
    }

    // Validate the folder exists and belongs to user
    const [folder] = await db
      .select()
      .from(folders)
      .where(
        and(
          eq(folders.id, folderId),
          eq(folders.ownerId, userId)
        )
      );

    if (!folder) {
      return NextResponse.json(
        { error: "Pasta não encontrada" },
        { status: 404 }
      );
    }

    // Check for duplicate name in the same parent folder
    const existingFolder = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.ownerId, userId),
          eq(folders.name, trimmedName),
          folder.parentFolderId
            ? eq(folders.parentFolderId, folder.parentFolderId)
            : isNull(folders.parentFolderId),
          // Exclude the current folder
          ne(folders.id, folderId)
        )
      );

    if (existingFolder.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma pasta com este nome neste local" },
        { status: 409 }
      );
    }

    const oldName = folder.name;

    // Update the folder name
    const [updatedFolder] = await db
      .update(folders)
      .set({ name: trimmedName })
      .where(eq(folders.id, folderId))
      .returning();

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FOLDER_CREATE", // Using as proxy for FOLDER_RENAME
        resourceType: "folder",
        resourceId: folderId,
        metadata: {
          action: "rename",
          oldName,
          newName: trimmedName,
        },
      });
    } catch (auditError) {
      console.warn("Erro ao registrar auditoria (não crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
      },
    });
  } catch (error) {
    console.error("Erro ao renomear pasta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
