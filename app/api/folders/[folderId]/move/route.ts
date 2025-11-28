import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

// Helper to check if targetFolderId is a descendant of folderId
async function isDescendant(
  db: ReturnType<typeof getDb>,
  userId: string,
  folderId: string,
  targetFolderId: string
): Promise<boolean> {
  let currentId: string | null = targetFolderId;
  let iterations = 0;

  while (currentId && iterations < 50) {
    if (currentId === folderId) {
      return true;
    }

    const [folder] = await db
      .select({ parentFolderId: folders.parentFolderId })
      .from(folders)
      .where(
        and(
          eq(folders.id, currentId),
          eq(folders.ownerId, userId)
        )
      );

    if (!folder) break;
    currentId = folder.parentFolderId;
    iterations++;
  }

  return false;
}

// PATCH: Move folder to a different parent folder
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
    const { targetFolderId } = body; // null means move to root

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

    // Can't move a folder into itself
    if (targetFolderId === folderId) {
      return NextResponse.json(
        { error: "Não é possível mover uma pasta para dentro dela mesma" },
        { status: 400 }
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

      // Check for circular reference (can't move folder into its descendant)
      const isCircular = await isDescendant(db, userId, folderId, targetFolderId);
      if (isCircular) {
        return NextResponse.json(
          { error: "Não é possível mover uma pasta para dentro de uma subpasta dela" },
          { status: 400 }
        );
      }
    }

    // Update the folder's parentFolderId
    const [updatedFolder] = await db
      .update(folders)
      .set({ parentFolderId: targetFolderId || null })
      .where(eq(folders.id, folderId))
      .returning();

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FOLDER_CREATE", // Using as proxy for FOLDER_MOVE
        resourceType: "folder",
        resourceId: folderId,
        metadata: {
          action: "move",
          fromParentFolderId: folder.parentFolderId,
          toParentFolderId: targetFolderId || null,
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
        parentFolderId: updatedFolder.parentFolderId,
      },
    });
  } catch (error) {
    console.error("Erro ao mover pasta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
