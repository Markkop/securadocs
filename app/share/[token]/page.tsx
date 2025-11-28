import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { shareLinks, files, folders, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SharePageClient } from "./client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  
  try {
    const db = getDb();
    const [shareLink] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.token, token))
      .limit(1);

    if (!shareLink) {
      return {
        title: "Link não encontrado - SecuraDocs",
      };
    }

    let resourceName = "Recurso compartilhado";
    if (shareLink.resourceType === "file") {
      const [file] = await db
        .select({ name: files.name })
        .from(files)
        .where(eq(files.id, shareLink.resourceId))
        .limit(1);
      if (file) resourceName = file.name;
    } else {
      const [folder] = await db
        .select({ name: folders.name })
        .from(folders)
        .where(eq(folders.id, shareLink.resourceId))
        .limit(1);
      if (folder) resourceName = folder.name;
    }

    return {
      title: `${resourceName} - SecuraDocs`,
      description: `Acesse o arquivo compartilhado: ${resourceName}`,
    };
  } catch {
    return {
      title: "Erro - SecuraDocs",
    };
  }
}

async function getShareData(token: string) {
  const db = getDb();

  // Find the share link
  const [shareLink] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  if (!shareLink) {
    return null;
  }

  // Check if expired
  const isExpired = shareLink.expiresAt 
    ? new Date(shareLink.expiresAt) < new Date() 
    : false;

  // Get resource details
  let resource: {
    id: string;
    name: string;
    type: "file" | "folder";
    mimeType?: string | null;
    sizeBytes?: number;
    ownerName: string;
    ownerId: string;
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

    if (file) {
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
        ownerId: file.ownerId,
      };
    }
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

    if (folder) {
      const [owner] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, folder.ownerId))
        .limit(1);

      // Get folder contents for display
      const folderFiles = await db
        .select({
          id: files.id,
          name: files.name,
          mimeType: files.mimeType,
          sizeBytes: files.sizeBytes,
        })
        .from(files)
        .where(eq(files.folderId, folder.id));

      resource = {
        id: folder.id,
        name: folder.name,
        type: "folder",
        ownerName: owner?.name || "Desconhecido",
        ownerId: folder.ownerId,
      };

      return {
        shareLink: {
          token: shareLink.token,
          permissionLevel: shareLink.permissionLevel,
          expiresAt: shareLink.expiresAt?.toISOString() || null,
          isExpired,
        },
        resource,
        folderContents: folderFiles,
      };
    }
  }

  if (!resource) {
    return null;
  }

  return {
    shareLink: {
      token: shareLink.token,
      permissionLevel: shareLink.permissionLevel,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      isExpired,
    },
    resource,
    folderContents: null,
  };
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getShareData(token);

  if (!data) {
    notFound();
  }

  return <SharePageClient data={data} token={token} />;
}
