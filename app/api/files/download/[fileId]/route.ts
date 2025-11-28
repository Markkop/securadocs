import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSupabaseAdmin, BUCKET_NAME } from "@/lib/storage/client";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

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

    // Buscar arquivo no banco de dados
    const db = getDb();
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.ownerId, userId)))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado" },
        { status: 404 }
      );
    }

    // Buscar arquivo do Supabase Storage
    const supabase = getSupabaseAdmin();
    const { data, error: downloadError } = await supabase.storage
      .from(BUCKET_NAME)
      .download(file.storagePath);

    if (downloadError || !data) {
      console.error("Erro ao baixar do Supabase:", downloadError);
      return NextResponse.json(
        { error: "Erro ao baixar arquivo" },
        { status: 500 }
      );
    }

    // Registrar evento de auditoria
    await logAuditEvent({
      userId,
      action: "FILE_DOWNLOAD",
      resourceType: "file",
      resourceId: file.id,
      metadata: {
        fileName: file.name,
        fileSize: file.sizeBytes,
      },
    });

    // Retornar arquivo como resposta
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.name)}"`,
        "Content-Length": file.sizeBytes.toString(),
      },
    });
  } catch (error) {
    console.error("Erro no download:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
