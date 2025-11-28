import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files, folders } from "@/lib/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // Validar sessão
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

    // Get folderId from query params (null for root)
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    const db = getDb();

    // If folderId is provided, validate it belongs to user
    if (folderId) {
      const [folder] = await db
        .select({ id: folders.id })
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
    }

    // Buscar arquivos do usuário na pasta especificada
    const userFiles = await db
      .select({
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        sizeBytes: files.sizeBytes,
        folderId: files.folderId,
        createdAt: files.createdAt,
        updatedAt: files.updatedAt,
      })
      .from(files)
      .where(
        and(
          eq(files.ownerId, userId),
          folderId
            ? eq(files.folderId, folderId)
            : isNull(files.folderId)
        )
      )
      .orderBy(desc(files.createdAt));

    // Buscar subpastas na pasta especificada
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
          folderId
            ? eq(folders.parentFolderId, folderId)
            : isNull(folders.parentFolderId)
        )
      )
      .orderBy(desc(folders.createdAt));

    return NextResponse.json({
      files: userFiles,
      folders: userFolders,
    });
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
