import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { permissions, files, folders, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

// POST - Create a permission for a user
export async function POST(request: NextRequest) {
  try {
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

    const currentUserId = session.user.id;
    const body = await request.json();
    const { resourceType, resourceId, userId, permissionLevel } = body;

    // Validate input
    if (!resourceType || !["file", "folder"].includes(resourceType)) {
      return NextResponse.json(
        { error: "Tipo de recurso inválido" },
        { status: 400 }
      );
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "ID do recurso é obrigatório" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    if (!permissionLevel || !["read", "write", "admin"].includes(permissionLevel)) {
      return NextResponse.json(
        { error: "Nível de permissão inválido" },
        { status: 400 }
      );
    }

    // Can't share with yourself
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: "Você não pode compartilhar com você mesmo" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify ownership of the resource
    if (resourceType === "file") {
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, resourceId), eq(files.ownerId, currentUserId)))
        .limit(1);

      if (!file) {
        return NextResponse.json(
          { error: "Arquivo não encontrado ou você não tem permissão" },
          { status: 404 }
        );
      }
    } else {
      const [folder] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, resourceId), eq(folders.ownerId, currentUserId)))
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          { error: "Pasta não encontrada ou você não tem permissão" },
          { status: 404 }
        );
      }
    }

    // Check if user exists
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if permission already exists
    const [existingPermission] = await db
      .select()
      .from(permissions)
      .where(
        and(
          eq(permissions.resourceType, resourceType),
          eq(permissions.resourceId, resourceId),
          eq(permissions.userId, userId)
        )
      )
      .limit(1);

    if (existingPermission) {
      // Update existing permission
      const [updated] = await db
        .update(permissions)
        .set({ permissionLevel })
        .where(eq(permissions.id, existingPermission.id))
        .returning();

      return NextResponse.json({
        success: true,
        permission: {
          id: updated.id,
          userId: updated.userId,
          userName: targetUser.name,
          userEmail: targetUser.email,
          permissionLevel: updated.permissionLevel,
          createdAt: updated.createdAt,
        },
        updated: true,
      });
    }

    // Create new permission
    const [permission] = await db
      .insert(permissions)
      .values({
        resourceType,
        resourceId,
        userId,
        permissionLevel,
      })
      .returning();

    // Log audit event
    await logAuditEvent({
      userId: currentUserId,
      action: "PERMISSION_CREATE",
      resourceType,
      resourceId,
      metadata: {
        permissionId: permission.id,
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        permissionLevel,
      },
    });

    return NextResponse.json({
      success: true,
      permission: {
        id: permission.id,
        userId: permission.userId,
        userName: targetUser.name,
        userEmail: targetUser.email,
        permissionLevel: permission.permissionLevel,
        createdAt: permission.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro ao criar permissão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// GET - List permissions for a resource
export async function GET(request: NextRequest) {
  try {
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
    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get("resourceType");
    const resourceId = searchParams.get("resourceId");

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: "resourceType e resourceId são obrigatórios" },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify ownership of the resource
    if (resourceType === "file") {
      const [file] = await db
        .select()
        .from(files)
        .where(and(eq(files.id, resourceId), eq(files.ownerId, userId)))
        .limit(1);

      if (!file) {
        return NextResponse.json(
          { error: "Arquivo não encontrado ou você não tem permissão" },
          { status: 404 }
        );
      }
    } else if (resourceType === "folder") {
      const [folder] = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, resourceId), eq(folders.ownerId, userId)))
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          { error: "Pasta não encontrada ou você não tem permissão" },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Tipo de recurso inválido" },
        { status: 400 }
      );
    }

    // Get all permissions for this resource with user details
    const resourcePermissions = await db
      .select({
        id: permissions.id,
        userId: permissions.userId,
        permissionLevel: permissions.permissionLevel,
        createdAt: permissions.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(permissions)
      .leftJoin(users, eq(permissions.userId, users.id))
      .where(
        and(
          eq(permissions.resourceType, resourceType),
          eq(permissions.resourceId, resourceId)
        )
      )
      .orderBy(permissions.createdAt);

    return NextResponse.json({
      permissions: resourcePermissions,
    });
  } catch (error) {
    console.error("Erro ao listar permissões:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
