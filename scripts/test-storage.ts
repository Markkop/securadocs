/**
 * Script para testar a configuração do Supabase Storage
 * Execute com: npx tsx scripts/test-storage.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente do arquivo .env
config({ path: resolve(process.cwd(), ".env") });

import { getSupabaseAdmin, BUCKET_NAME } from "../lib/storage/client";

async function testStorage() {
  console.log("🔍 Testando configuração do Supabase Storage...\n");

  try {
    // Verificar variáveis de ambiente
    console.log("1. Verificando variáveis de ambiente...");
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log(`   ✓ NEXT_PUBLIC_SUPABASE_URL: ${hasUrl ? "✅" : "❌"}`);
    console.log(`   ✓ SUPABASE_SERVICE_ROLE_KEY: ${hasKey ? "✅" : "❌"}\n`);

    if (!hasUrl || !hasKey) {
      console.error("❌ Variáveis de ambiente não configuradas!");
      process.exit(1);
    }

    // Inicializar cliente Supabase
    console.log("2. Inicializando cliente Supabase...");
    const supabase = getSupabaseAdmin();
    console.log("   ✓ Cliente inicializado\n");

    // Verificar se o bucket existe
    console.log(`3. Verificando se o bucket "${BUCKET_NAME}" existe...`);
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error(`   ❌ Erro ao listar buckets: ${listError.message}`);
      process.exit(1);
    }

    const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);
    console.log(`   ${bucketExists ? "✅" : "❌"} Bucket "${BUCKET_NAME}" ${bucketExists ? "existe" : "NÃO existe"}\n`);

    if (!bucketExists) {
      console.error(`❌ O bucket "${BUCKET_NAME}" não foi encontrado!`);
      console.log("\n📝 Para criar o bucket:");
      console.log("   1. Acesse o Supabase Dashboard");
      console.log("   2. Vá em Storage");
      console.log(`   3. Crie um bucket chamado "${BUCKET_NAME}"`);
      console.log("   4. Configure as políticas RLS conforme necessário\n");
      process.exit(1);
    }

    // Testar upload de um arquivo pequeno
    console.log("4. Testando upload de arquivo de teste...");
    const testContent = new TextEncoder().encode("test file content");
    const testPath = `test/${Date.now()}-test.txt`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testPath, testContent, {
        contentType: "text/plain",
        upsert: false,
      });

    if (uploadError) {
      console.error(`   ❌ Erro no upload: ${uploadError.message}`);
      if (uploadError.message?.includes("new row violates row-level security")) {
        console.log("\n💡 Dica: Configure as políticas RLS do bucket para permitir uploads.");
      }
      process.exit(1);
    }

    console.log("   ✅ Upload de teste bem-sucedido\n");

    // Limpar arquivo de teste
    console.log("5. Limpando arquivo de teste...");
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([testPath]);

    if (deleteError) {
      console.warn(`   ⚠️  Erro ao deletar arquivo de teste: ${deleteError.message}`);
    } else {
      console.log("   ✅ Arquivo de teste removido\n");
    }

    console.log("✅ Todos os testes passaram! O storage está configurado corretamente.");
  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
    process.exit(1);
  }
}

testStorage();
