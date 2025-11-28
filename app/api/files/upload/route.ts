import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { getSupabaseAdmin, BUCKET_NAME } from "@/lib/storage/client";
import { logAuditEvent } from "@/lib/audit/logger";

// Tipos de arquivo permitidos
const ALLOWED_MIME_TYPES = [
  // Imagens
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documentos
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Texto
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
  // Arquivos compactados
  "application/zip",
  "application/x-rar-compressed",
  "application/gzip",
];

// Tamanho máximo: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    console.log("[UPLOAD] Iniciando processo de upload...");
    
    // Validar sessão
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("[UPLOAD] Erro: Sessão não encontrada");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`[UPLOAD] Usuário autenticado: ${userId}`);

    // Obter arquivo do FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.log("[UPLOAD] Erro: Nenhum arquivo enviado");
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    console.log(`[UPLOAD] Arquivo recebido: ${file.name} (${file.size} bytes, ${file.type})`);

    // Validar tipo do arquivo
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.log(`[UPLOAD] Erro: Tipo não permitido: ${file.type}`);
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido: ${file.type}` },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      console.log(`[UPLOAD] Erro: Arquivo muito grande: ${file.size} bytes`);
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: 50MB` },
        { status: 400 }
      );
    }

    // Gerar caminho único no storage
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${timestamp}-${sanitizedFileName}`;
    console.log(`[UPLOAD] Caminho no storage: ${storagePath}`);

    // Converter arquivo para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    console.log(`[UPLOAD] Buffer criado: ${buffer.length} bytes`);

    // Upload para Supabase Storage
    let supabase;
    try {
      console.log(`[UPLOAD] Inicializando cliente Supabase...`);
      supabase = getSupabaseAdmin();
      console.log(`[UPLOAD] Cliente Supabase inicializado`);
    } catch (error) {
      console.error("[UPLOAD] Erro ao inicializar Supabase:", error);
      return NextResponse.json(
        { error: "Erro de configuração do storage. Verifique as variáveis de ambiente." },
        { status: 500 }
      );
    }

    console.log(`[UPLOAD] Fazendo upload para bucket "${BUCKET_NAME}"...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[UPLOAD] Erro no upload para Supabase:", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError,
      });
      
      // Mensagens de erro mais específicas
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json(
          { error: `Bucket "${BUCKET_NAME}" não encontrado. Crie o bucket no Supabase Dashboard.` },
          { status: 500 }
        );
      }
      if (uploadError.message?.includes("new row violates row-level security") || uploadError.message?.includes("RLS")) {
        return NextResponse.json(
          { error: "Erro de permissão no storage. Verifique as políticas RLS do bucket." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${uploadError.message || JSON.stringify(uploadError)}` },
        { status: 500 }
      );
    }

    console.log(`[UPLOAD] Upload bem-sucedido!`);

    // Criar registro no banco de dados
    console.log(`[UPLOAD] Criando registro no banco de dados...`);
    const db = getDb();
    const [newFile] = await db
      .insert(files)
      .values({
        ownerId: userId,
        name: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath: storagePath,
      })
      .returning();

    console.log(`[UPLOAD] Arquivo criado no DB com ID: ${newFile.id}`);

    // Registrar evento de auditoria
    try {
      await logAuditEvent({
        userId,
        action: "FILE_UPLOAD",
        resourceType: "file",
        resourceId: newFile.id,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      });
    } catch (auditError) {
      console.warn("[UPLOAD] Erro ao registrar auditoria (não crítico):", auditError);
    }

    console.log(`[UPLOAD] Upload concluído com sucesso!`);
    return NextResponse.json({
      success: true,
      file: {
        id: newFile.id,
        name: newFile.name,
        mimeType: newFile.mimeType,
        sizeBytes: newFile.sizeBytes,
        createdAt: newFile.createdAt,
      },
    });
  } catch (error) {
    console.error("[UPLOAD] Erro geral no upload:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: `Erro interno do servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
