import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files, folders } from "@/lib/db/schema";
import { eq, ilike, and, desc } from "drizzle-orm";

// GET: Search files and folders by name
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

    // Get search query
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Termo de busca é obrigatório" },
        { status: 400 }
      );
    }

    const searchTerm = `%${query.trim()}%`;
    const db = getDb();

    // Search files
    const matchingFiles = await db
      .select({
        id: files.id,
        name: files.name,
        mimeType: files.mimeType,
        sizeBytes: files.sizeBytes,
        folderId: files.folderId,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(
        and(
          eq(files.ownerId, userId),
          ilike(files.name, searchTerm)
        )
      )
      .orderBy(desc(files.createdAt))
      .limit(50);

    // Search folders
    const matchingFolders = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentFolderId: folders.parentFolderId,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(
        and(
          eq(folders.ownerId, userId),
          ilike(folders.name, searchTerm)
        )
      )
      .orderBy(desc(folders.createdAt))
      .limit(50);

    // Get folder paths for context
    const folderPaths = new Map<string, string>();
    
    // Helper to get folder path
    async function getFolderPath(folderId: string): Promise<string> {
      if (folderPaths.has(folderId)) {
        return folderPaths.get(folderId)!;
      }

      const pathParts: string[] = [];
      let currentId: string | null = folderId;
      let iterations = 0;

      while (currentId && iterations < 20) {
        const [folder] = await db
          .select({ name: folders.name, parentFolderId: folders.parentFolderId })
          .from(folders)
          .where(
            and(
              eq(folders.id, currentId),
              eq(folders.ownerId, userId)
            )
          );

        if (!folder) break;
        pathParts.unshift(folder.name);
        currentId = folder.parentFolderId;
        iterations++;
      }

      const path = pathParts.length > 0 ? pathParts.join(" / ") : "";
      folderPaths.set(folderId, path);
      return path;
    }

    // Add path context to files
    const filesWithPath = await Promise.all(
      matchingFiles.map(async (file) => ({
        ...file,
        type: "file" as const,
        path: file.folderId ? await getFolderPath(file.folderId) : "",
      }))
    );

    // Add path context to folders
    const foldersWithPath = await Promise.all(
      matchingFolders.map(async (folder) => ({
        ...folder,
        type: "folder" as const,
        path: folder.parentFolderId ? await getFolderPath(folder.parentFolderId) : "",
      }))
    );

    return NextResponse.json({
      query: query.trim(),
      files: filesWithPath,
      folders: foldersWithPath,
      totalResults: filesWithPath.length + foldersWithPath.length,
    });
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
