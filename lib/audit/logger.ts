import { getDb } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "FILE_UPLOAD"
  | "FILE_DOWNLOAD"
  | "FILE_DELETE"
  | "FOLDER_CREATE"
  | "FOLDER_DELETE"
  | "PERMISSION_CREATE"
  | "PERMISSION_REVOKE"
  | "SHARE_LINK_CREATE"
  | "SHARE_LINK_REVOKE";

export type ResourceType = "file" | "folder" | "user";

interface LogEventParams {
  userId: string | null;
  action: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registra um evento de auditoria no banco de dados
 */
export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId,
  ipAddress,
  metadata,
}: LogEventParams): Promise<void> {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      metadata,
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main flow
    console.error("Erro ao registrar evento de auditoria:", error);
  }
}
