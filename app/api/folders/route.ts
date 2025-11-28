import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { folders } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

// GET: List folders (optionally filtered by parentFolderId)
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

    // Get parentFolderId from query params (null for root folders)
    const { searchParams } = new URL(request.url);
    const parentFolderId = searchParams.get("parentFolderId");

    const db = getDb();

    // Build query based on parentFolderId
    const userFolders = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentFolderId: folders.parentFolderId,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
      })
      .from(folders)
      .where(
        and(
          eq(folders.ownerId, userId),
          parentFolderId 
            ? eq(folders.parentFolderId, parentFolderId)
            : isNull(folders.parentFolderId)
        )
      )
      .orderBy(desc(folders.createdAt));

    return NextResponse.json({
      folders: userFolders,
    });
  } catch (error) {
    console.error("Erro ao listar pastas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Create a new folder
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

    // Parse request body
    const body = await request.json();
    const { name, parentFolderId } = body;

    // Validate folder name
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nome da pasta é obrigatório" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: "Nome da pasta não pode ser vazio" },
        { status: 400 }
      );
    }

    if (trimmedName.length > 255) {
      return NextResponse.json(
        { error: "Nome da pasta muito longo (máximo 255 caracteres)" },
        { status: 400 }
      );
    }

    const db = getDb();

    // If parentFolderId is provided, validate that it exists and belongs to user
    if (parentFolderId) {
      const [parentFolder] = await db
        .select({ id: folders.id })
        .from(folders)
        .where(
          and(
            eq(folders.id, parentFolderId),
            eq(folders.ownerId, userId)
          )
        );

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Pasta pai não encontrada ou sem permissão" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate folder name in the same parent
    const existingFolder = await db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(
          eq(folders.ownerId, userId),
          eq(folders.name, trimmedName),
          parentFolderId
            ? eq(folders.parentFolderId, parentFolderId)
            : isNull(folders.parentFolderId)
        )
      );

    if (existingFolder.length > 0) {
      return NextResponse.json(
        { error: "Já existe uma pasta com este nome neste local" },
        { status: 409 }
      );
    }

    // Create folder
    const [newFolder] = await db
      .insert(folders)
      .values({
        ownerId: userId,
        name: trimmedName,
        parentFolderId: parentFolderId || null,
      })
      .returning();

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FOLDER_CREATE",
        resourceType: "folder",
        resourceId: newFolder.id,
        metadata: {
          folderName: trimmedName,
          parentFolderId: parentFolderId || null,
        },
      });
    } catch (auditError) {
      console.warn("Erro ao registrar auditoria (não crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        parentFolderId: newFolder.parentFolderId,
        createdAt: newFolder.createdAt,
        updatedAt: newFolder.updatedAt,
      },
    });
  } catch (error) {
    console.error("Erro ao criar pasta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
