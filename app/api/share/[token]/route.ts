import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { shareLinks, files, folders, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";
import { downloadFile } from "@/lib/storage/nextcloud";

// GET - Get share link info and resource details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
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

    // Get resource details
    let resource: {
      id: string;
      name: string;
      type: "file" | "folder";
      mimeType?: string | null;
      sizeBytes?: number;
      ownerName: string;
    } | null = null;

    if (shareLink.resourceType === "file") {
      const [file] = await db
        .select({
          id: files.id,
          name: files.name,
          mimeType: files.mimeType,
          sizeBytes: files.sizeBytes,
          ownerId: files.ownerId,
        })
        .from(files)
        .where(eq(files.id, shareLink.resourceId))
        .limit(1);

      if (!file) {
        return NextResponse.json(
          { error: "Arquivo não encontrado" },
          { status: 404 }
        );
      }

      // Get owner name
      const [owner] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, file.ownerId))
        .limit(1);

      resource = {
        id: file.id,
        name: file.name,
        type: "file",
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        ownerName: owner?.name || "Desconhecido",
      };
    } else {
      const [folder] = await db
        .select({
          id: folders.id,
          name: folders.name,
          ownerId: folders.ownerId,
        })
        .from(folders)
        .where(eq(folders.id, shareLink.resourceId))
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          { error: "Pasta não encontrada" },
          { status: 404 }
        );
      }

      // Get owner name
      const [owner] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, folder.ownerId))
        .limit(1);

      resource = {
        id: folder.id,
        name: folder.name,
        type: "folder",
        ownerName: owner?.name || "Desconhecido",
      };
    }

    return NextResponse.json({
      resource,
      permissionLevel: shareLink.permissionLevel,
      expiresAt: shareLink.expiresAt,
    });
  } catch (error) {
    console.error("Erro ao buscar link compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Update/extend a share link (requires auth and ownership)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
    const { expiresAt, permissionLevel } = body;

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

    // Verify ownership - only the creator can update
    if (shareLink.createdBy !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para atualizar este link" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: { expiresAt?: Date | null; permissionLevel?: string } = {};

    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        updateData.expiresAt = null;
      } else {
        const newExpiry = new Date(expiresAt);
        if (isNaN(newExpiry.getTime())) {
          return NextResponse.json(
            { error: "Data de expiração inválida" },
            { status: 400 }
          );
        }
        updateData.expiresAt = newExpiry;
      }
    }

    if (permissionLevel !== undefined) {
      if (!["read", "write"].includes(permissionLevel)) {
        return NextResponse.json(
          { error: "Nível de permissão inválido" },
          { status: 400 }
        );
      }
      updateData.permissionLevel = permissionLevel;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado para atualizar" },
        { status: 400 }
      );
    }

    // Update the share link
    const [updated] = await db
      .update(shareLinks)
      .set(updateData)
      .where(eq(shareLinks.id, shareLink.id))
      .returning();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return NextResponse.json({
      success: true,
      shareLink: {
        id: updated.id,
        token: updated.token,
        url: `${baseUrl}/share/${updated.token}`,
        permissionLevel: updated.permissionLevel,
        expiresAt: updated.expiresAt,
        createdAt: updated.createdAt,
        isExpired: updated.expiresAt ? new Date(updated.expiresAt) < new Date() : false,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar link compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke a share link (requires auth and ownership)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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

    // Verify ownership - only the creator can revoke
    if (shareLink.createdBy !== userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para revogar este link" },
        { status: 403 }
      );
    }

    // Delete the share link
    await db.delete(shareLinks).where(eq(shareLinks.id, shareLink.id));

    // Log audit event
    await logAuditEvent({
      userId,
      action: "SHARE_LINK_REVOKE",
      resourceType: shareLink.resourceType as "file" | "folder",
      resourceId: shareLink.resourceId,
      metadata: {
        shareLinkId: shareLink.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao revogar link compartilhado:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Download file via share link (public)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
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

    // Only files can be downloaded directly
    if (shareLink.resourceType !== "file") {
      return NextResponse.json(
        { error: "Apenas arquivos podem ser baixados diretamente" },
        { status: 400 }
      );
    }

    // Get file details
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, shareLink.resourceId))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
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

    // Log audit event (without user ID since this is public)
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
