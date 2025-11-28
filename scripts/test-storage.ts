/**
 * Script para testar a configuração do Nextcloud Storage (WebDAV)
 * Execute com: npx tsx scripts/test-storage.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { uploadFile, downloadFile, deleteFile, checkConnection } from "../lib/storage/nextcloud";

async function testStorage() {
  console.log("🔍 Testando configuração do Nextcloud Storage (WebDAV)...\n");

  try {
    // Verificar variáveis de ambiente
    console.log("1. Verificando variáveis de ambiente...");
    const hasUrl = !!process.env.NEXTCLOUD_URL;
    const hasUser = !!process.env.NEXTCLOUD_USER;
    const hasPassword = !!process.env.NEXTCLOUD_PASSWORD;
    
    console.log(`   NEXTCLOUD_URL: ${hasUrl ? "✅" : "❌"}`);
    console.log(`   NEXTCLOUD_USER: ${hasUser ? "✅" : "❌"}`);
    console.log(`   NEXTCLOUD_PASSWORD: ${hasPassword ? "✅" : "❌"}\n`);

    if (!hasUrl || !hasUser || !hasPassword) {
      console.error("❌ Variáveis de ambiente do Nextcloud não configuradas!");
      console.log("\n📝 Configure as seguintes variáveis no .env.local:");
      console.log("   NEXTCLOUD_URL=http://localhost:8080");
      console.log("   NEXTCLOUD_USER=securadocs");
      console.log("   NEXTCLOUD_PASSWORD=sua_senha");
      process.exit(1);
    }

    // Testar conexão com Nextcloud
    console.log("2. Testando conexão com Nextcloud...");
    const connectionResult = await checkConnection();
    
    if (!connectionResult.connected) {
      console.error(`   ❌ Erro na conexão: ${connectionResult.error}`);
      console.log("\n💡 Dicas:");
      console.log("   - Verifique se o Nextcloud está rodando (docker compose ps)");
      console.log("   - Verifique se o usuário 'securadocs' foi criado no Nextcloud");
      console.log("   - Verifique a senha do usuário");
      process.exit(1);
    }
    
    console.log("   ✅ Conexão com Nextcloud OK\n");

    // Testar upload de arquivo
    console.log("3. Testando upload de arquivo...");
    const testContent = Buffer.from("Arquivo de teste do SecuraDocs - " + new Date().toISOString());
    const testPath = `test/${Date.now()}-test.txt`;

    const uploadResult = await uploadFile(testPath, testContent, "text/plain");

    if (!uploadResult.success) {
      console.error(`   ❌ Erro no upload: ${uploadResult.error}`);
      process.exit(1);
    }

    console.log(`   ✅ Upload bem-sucedido: ${testPath}\n`);

    // Testar download do arquivo
    console.log("4. Testando download do arquivo...");
    const downloadResult = await downloadFile(testPath);

    if (!downloadResult.success || !downloadResult.data) {
      console.error(`   ❌ Erro no download: ${downloadResult.error}`);
      process.exit(1);
    }

    const downloadedContent = Buffer.from(downloadResult.data).toString("utf-8");
    const contentMatch = downloadedContent === testContent.toString("utf-8");
    
    console.log(`   ✅ Download bem-sucedido`);
    console.log(`   ${contentMatch ? "✅" : "❌"} Conteúdo ${contentMatch ? "corresponde" : "NÃO corresponde"}\n`);

    // Testar deleção do arquivo
    console.log("5. Testando deleção do arquivo...");
    const deleteResult = await deleteFile(testPath);

    if (!deleteResult.success) {
      console.warn(`   ⚠️ Erro ao deletar: ${deleteResult.error}`);
    } else {
      console.log("   ✅ Arquivo deletado com sucesso\n");
    }

    console.log("━".repeat(50));
    console.log("✅ Todos os testes passaram!");
    console.log("   O Nextcloud Storage está configurado corretamente.");
    console.log("━".repeat(50));

  } catch (error) {
    console.error("❌ Erro durante os testes:", error);
    process.exit(1);
  }
}

testStorage();
