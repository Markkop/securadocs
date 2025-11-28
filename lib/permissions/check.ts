import { getDb } from "@/lib/db";
import { permissions, files, folders, shareLinks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export type PermissionLevel = "read" | "write" | "admin";
export type ResourceType = "file" | "folder";

// Permission hierarchy: admin > write > read
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  read: 1,
  write: 2,
  admin: 3,
};

/**
 * Check if a permission level meets or exceeds the required level
 */
function meetsRequiredLevel(
  actual: PermissionLevel,
  required: PermissionLevel
): boolean {
  return PERMISSION_HIERARCHY[actual] >= PERMISSION_HIERARCHY[required];
}

/**
 * Get the owner ID of a resource
 */
export async function getResourceOwner(
  resourceType: ResourceType,
  resourceId: string
): Promise<string | null> {
  const db = getDb();

  if (resourceType === "file") {
    const [file] = await db
      .select({ ownerId: files.ownerId })
      .from(files)
      .where(eq(files.id, resourceId))
      .limit(1);
    return file?.ownerId || null;
  } else {
    const [folder] = await db
      .select({ ownerId: folders.ownerId })
      .from(folders)
      .where(eq(folders.id, resourceId))
      .limit(1);
    return folder?.ownerId || null;
  }
}

/**
 * Check if a user is the owner of a resource
 */
export async function isResourceOwner(
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> {
  const ownerId = await getResourceOwner(resourceType, resourceId);
  return ownerId === userId;
}

/**
 * Get the effective permission level for a user on a resource
 * Returns null if user has no permission
 */
export async function getEffectivePermission(
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<PermissionLevel | null> {
  const db = getDb();

  // Check if user is owner (owners have admin permission)
  const isOwner = await isResourceOwner(userId, resourceType, resourceId);
  if (isOwner) {
    return "admin";
  }

  // Check direct permissions
  const [permission] = await db
    .select({ permissionLevel: permissions.permissionLevel })
    .from(permissions)
    .where(
      and(
        eq(permissions.resourceType, resourceType),
        eq(permissions.resourceId, resourceId),
        eq(permissions.userId, userId)
      )
    )
    .limit(1);

  if (permission) {
    return permission.permissionLevel as PermissionLevel;
  }

  // If it's a file, check parent folder permissions (inheritance)
  if (resourceType === "file") {
    const [file] = await db
      .select({ folderId: files.folderId })
      .from(files)
      .where(eq(files.id, resourceId))
      .limit(1);

    if (file?.folderId) {
      return getEffectivePermission(userId, "folder", file.folderId);
    }
  }

  return null;
}

/**
 * Check if a user has at least the required permission level for a resource
 */
export async function checkResourceAccess(
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  requiredLevel: PermissionLevel
): Promise<boolean> {
  const effectivePermission = await getEffectivePermission(
    userId,
    resourceType,
    resourceId
  );

  if (!effectivePermission) {
    return false;
  }

  return meetsRequiredLevel(effectivePermission, requiredLevel);
}

/**
 * Validate a share link token and get the permission level
 * Returns null if token is invalid, expired, or resource doesn't match
 */
export async function validateShareLink(
  token: string,
  resourceType?: ResourceType,
  resourceId?: string
): Promise<{
  permissionLevel: PermissionLevel;
  resourceType: ResourceType;
  resourceId: string;
} | null> {
  const db = getDb();

  const [shareLink] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  if (!shareLink) {
    return null;
  }

  // Check expiration
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return null;
  }

  // If resourceType and resourceId are provided, verify they match
  if (resourceType && resourceType !== shareLink.resourceType) {
    return null;
  }
  if (resourceId && resourceId !== shareLink.resourceId) {
    return null;
  }

  return {
    permissionLevel: shareLink.permissionLevel as PermissionLevel,
    resourceType: shareLink.resourceType as ResourceType,
    resourceId: shareLink.resourceId,
  };
}

/**
 * Check if a user can access a resource (considering ownership, permissions, and share links)
 * This is a comprehensive check that includes:
 * 1. Ownership
 * 2. Direct permissions
 * 3. Inherited folder permissions (for files)
 * 4. Valid share link (if token is provided)
 */
export async function canAccessResource(
  userId: string | null,
  resourceType: ResourceType,
  resourceId: string,
  requiredLevel: PermissionLevel,
  shareLinkToken?: string
): Promise<boolean> {
  // If a share link token is provided, validate it
  if (shareLinkToken) {
    const shareLinkData = await validateShareLink(
      shareLinkToken,
      resourceType,
      resourceId
    );
    if (shareLinkData) {
      return meetsRequiredLevel(shareLinkData.permissionLevel, requiredLevel);
    }
  }

  // If no user ID, no access (unless share link was valid above)
  if (!userId) {
    return false;
  }

  // Check user permissions
  return checkResourceAccess(userId, resourceType, resourceId, requiredLevel);
}

/**
 * Check if a file belongs to a shared folder and the share link allows access
 */
export async function canAccessFileViaFolderShareLink(
  token: string,
  fileId: string
): Promise<{ canAccess: boolean; permissionLevel?: PermissionLevel }> {
  const db = getDb();

  // Get the share link
  const [shareLink] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  if (!shareLink) {
    return { canAccess: false };
  }

  // Check expiration
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return { canAccess: false };
  }

  // Must be a folder share link
  if (shareLink.resourceType !== "folder") {
    return { canAccess: false };
  }

  // Check if the file belongs to the shared folder
  const [file] = await db
    .select({ folderId: files.folderId })
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);

  if (!file || file.folderId !== shareLink.resourceId) {
    return { canAccess: false };
  }

  return {
    canAccess: true,
    permissionLevel: shareLink.permissionLevel as PermissionLevel,
  };
}
