import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { folders, files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFile } from "@/lib/storage/nextcloud";
import { logAuditEvent } from "@/lib/audit/logger";

interface FolderBreadcrumb {
  id: string;
  name: string;
}

// GET: Get folder details including path (ancestors)
export async function GET(
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

    // Get the folder
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

    // Build path by traversing up the folder hierarchy
    const path: FolderBreadcrumb[] = [];
    let currentFolder = folder;

    // Add the current folder first
    path.unshift({ id: currentFolder.id, name: currentFolder.name });

    // Traverse up to root (max 20 levels to prevent infinite loops)
    let iterations = 0;
    while (currentFolder.parentFolderId && iterations < 20) {
      const [parentFolder] = await db
        .select()
        .from(folders)
        .where(
          and(
            eq(folders.id, currentFolder.parentFolderId),
            eq(folders.ownerId, userId)
          )
        );

      if (!parentFolder) break;

      path.unshift({ id: parentFolder.id, name: parentFolder.name });
      currentFolder = parentFolder;
      iterations++;
    }

    return NextResponse.json({
      folder: {
        id: folder.id,
        name: folder.name,
        parentFolderId: folder.parentFolderId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
      },
      path,
    });
  } catch (error) {
    console.error("Erro ao buscar pasta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Helper to recursively collect all file paths and folder IDs to delete
async function collectFolderContents(
  db: ReturnType<typeof getDb>,
  userId: string,
  folderId: string
): Promise<{ filePaths: string[]; folderIds: string[] }> {
  const filePaths: string[] = [];
  const folderIds: string[] = [folderId];

  // Get files in this folder
  const folderFiles = await db
    .select({ storagePath: files.storagePath })
    .from(files)
    .where(
      and(
        eq(files.ownerId, userId),
        eq(files.folderId, folderId)
      )
    );

  filePaths.push(...folderFiles.map((f) => f.storagePath));

  // Get subfolders and recursively collect their contents
  const subfolders = await db
    .select({ id: folders.id })
    .from(folders)
    .where(
      and(
        eq(folders.ownerId, userId),
        eq(folders.parentFolderId, folderId)
      )
    );

  for (const subfolder of subfolders) {
    const subContents = await collectFolderContents(db, userId, subfolder.id);
    filePaths.push(...subContents.filePaths);
    folderIds.push(...subContents.folderIds);
  }

  return { filePaths, folderIds };
}

// DELETE: Delete a folder and all its contents
export async function DELETE(
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

    // Collect all contents to delete
    const { filePaths, folderIds } = await collectFolderContents(db, userId, folderId);

    // Delete files from Nextcloud Storage
    if (filePaths.length > 0) {
      for (const filePath of filePaths) {
        try {
          const result = await deleteFile(filePath);
          if (!result.success) {
            console.warn(`Erro ao deletar arquivo ${filePath} do storage (não crítico):`, result.error);
          }
        } catch (storageError) {
          console.warn(`Erro ao deletar arquivo ${filePath} do storage (não crítico):`, storageError);
        }
      }
    }

    // Delete files from database (all files in all folders being deleted)
    for (const fid of folderIds) {
      await db.delete(files).where(
        and(
          eq(files.ownerId, userId),
          eq(files.folderId, fid)
        )
      );
    }

    // Delete folders from database (in reverse order to handle hierarchy)
    // Reverse a copy to avoid mutating the original array
    const foldersToDelete = [...folderIds].reverse();
    for (const fid of foldersToDelete) {
      await db.delete(folders).where(eq(folders.id, fid));
    }

    // Log audit event
    try {
      await logAuditEvent({
        userId,
        action: "FOLDER_DELETE",
        resourceType: "folder",
        resourceId: folderId,
        metadata: {
          folderName: folder.name,
          deletedFiles: filePaths.length,
          deletedFolders: folderIds.length,
        },
      });
    } catch (auditError) {
      console.warn("Erro ao registrar auditoria (não crítico):", auditError);
    }

    return NextResponse.json({
      success: true,
      deleted: {
        files: filePaths.length,
        folders: folderIds.length,
      },
    });
  } catch (error) {
    console.error("Erro ao deletar pasta:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
