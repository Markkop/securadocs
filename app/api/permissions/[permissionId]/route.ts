import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { permissions, files, folders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

// Helper to verify resource ownership
async function verifyOwnership(
  db: ReturnType<typeof getDb>,
  resourceType: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  if (resourceType === "file") {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, resourceId), eq(files.ownerId, userId)))
      .limit(1);
    return !!file;
  } else {
    const [folder] = await db
      .select()
      .from(folders)
      .where(and(eq(folders.id, resourceId), eq(folders.ownerId, userId)))
      .limit(1);
    return !!folder;
  }
}

// PATCH - Update permission level
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ permissionId: string }> }
) {
  try {
    const { permissionId } = await params;

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
    const body = await request.json();
    const { permissionLevel } = body;

    if (!permissionLevel || !["read", "write", "admin"].includes(permissionLevel)) {
      return NextResponse.json(
        { error: "Nível de permissão inválido" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Get the permission
    const [permission] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (!permission) {
      return NextResponse.json(
        { error: "Permissão não encontrada" },
        { status: 404 }
      );
    }

    // Verify ownership of the resource
    const isOwner = await verifyOwnership(
      db,
      permission.resourceType,
      permission.resourceId,
      userId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Você não tem permissão para modificar este acesso" },
        { status: 403 }
      );
    }

    // Update the permission
    const [updated] = await db
      .update(permissions)
      .set({ permissionLevel })
      .where(eq(permissions.id, permissionId))
      .returning();

    return NextResponse.json({
      success: true,
      permission: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar permissão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke permission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ permissionId: string }> }
) {
  try {
    const { permissionId } = await params;

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

    // Get the permission
    const [permission] = await db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId))
      .limit(1);

    if (!permission) {
      return NextResponse.json(
        { error: "Permissão não encontrada" },
        { status: 404 }
      );
    }

    // Verify ownership of the resource
    const isOwner = await verifyOwnership(
      db,
      permission.resourceType,
      permission.resourceId,
      userId
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Você não tem permissão para remover este acesso" },
        { status: 403 }
      );
    }

    // Delete the permission
    await db.delete(permissions).where(eq(permissions.id, permissionId));

    // Log audit event
    await logAuditEvent({
      userId,
      action: "PERMISSION_REVOKE",
      resourceType: permission.resourceType as "file" | "folder",
      resourceId: permission.resourceId,
      metadata: {
        permissionId: permission.id,
        revokedUserId: permission.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover permissão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
