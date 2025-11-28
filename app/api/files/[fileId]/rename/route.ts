import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";
import { canAccessResource } from "@/lib/permissions/check";

// PATCH: Rename a file
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

    // Check if user has write permission on the file
    const hasAccess = await canAccessResource(
      userId,
      "file",
      fileId,
      "write"
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Você não tem permissão para renomear este arquivo" },
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

    const oldName = file.name;

    // Update the file name
    const [updatedFile] = await db
      .update(files)
      .set({ name: trimmedName })
      .where(eq(files.id, fileId))
      .returning();

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FILE_UPLOAD", // Using as proxy for FILE_RENAME
        resourceType: "file",
        resourceId: fileId,
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
      file: {
        id: updatedFile.id,
        name: updatedFile.name,
      },
    });
  } catch (error) {
    console.error("Erro ao renomear arquivo:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
