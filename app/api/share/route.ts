import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { shareLinks, files, folders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logAuditEvent } from "@/lib/audit/logger";

// POST - Create a new share link
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

    const userId = session.user.id;
    const body = await request.json();
    const { resourceType, resourceId, permissionLevel, expiresAt } = body;

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

    if (!permissionLevel || !["read", "write"].includes(permissionLevel)) {
      return NextResponse.json(
        { error: "Nível de permissão inválido" },
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
    } else {
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
    }

    // Generate unique token
    const token = nanoid(32);

    // Parse expiration date if provided
    let expiresAtDate: Date | null = null;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return NextResponse.json(
          { error: "Data de expiração inválida" },
          { status: 400 }
        );
      }
    }

    // Create share link
    const [shareLink] = await db
      .insert(shareLinks)
      .values({
        resourceType,
        resourceId,
        token,
        createdBy: userId,
        permissionLevel,
        expiresAt: expiresAtDate,
      })
      .returning();

    // Log audit event
    await logAuditEvent({
      userId,
      action: "SHARE_LINK_CREATE",
      resourceType,
      resourceId,
      metadata: {
        shareLinkId: shareLink.id,
        permissionLevel,
        expiresAt: expiresAtDate?.toISOString() || null,
      },
    });

    // Build the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${token}`;

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        url: shareUrl,
        permissionLevel: shareLink.permissionLevel,
        expiresAt: shareLink.expiresAt,
        createdAt: shareLink.createdAt,
      },
    });
  } catch (error) {
    console.error("Erro ao criar link de compartilhamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// GET - List share links for a resource
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

    // Get all share links for this resource
    const links = await db
      .select()
      .from(shareLinks)
      .where(
        and(
          eq(shareLinks.resourceType, resourceType),
          eq(shareLinks.resourceId, resourceId)
        )
      )
      .orderBy(shareLinks.createdAt);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      shareLinks: links.map((link) => ({
        id: link.id,
        token: link.token,
        url: `${baseUrl}/share/${link.token}`,
        permissionLevel: link.permissionLevel,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
        isExpired: link.expiresAt ? new Date(link.expiresAt) < new Date() : false,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar links de compartilhamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
