# SecuraDocs

## Descrição

Plataforma segura e auto-hospedável de armazenamento e compartilhamento de arquivos, projetada para organizações sociais, ONGs e coletivos que precisam de **soberania e privacidade de dados**.


### Pilares atendidos:
- **Soberania**: Infraestrutura própria via Docker, sem dependência de Big Techs
- **Segurança**: Autenticação robusta (Better Auth) e armazenamento isolado
- **Controle de Acesso**: Permissões granulares por arquivo/pasta e usuário
- **Auditoria**: Logs completos de quem acessou o quê e quando

## Tecnologias Utilizadas

| Componente | Tecnologia |
|------------|------------|
| Framework | Next.js 16 + React 19 |
| Linguagem | TypeScript |
| Banco de Dados | PostgreSQL + Drizzle ORM |
| Autenticação | Better Auth |
| Armazenamento | Nextcloud (auto-hospedado) |
| Deploy | Docker Compose |

Todas as tecnologias são **livres e de código aberto**.

## Como Atende aos Requisitos

1. **Rejeição às Big Techs**: Substitui Google Drive/Dropbox por infraestrutura própria
2. **Autonomia**: Deploy com um comando (`docker compose up`)
3. **Segurança**: Dados nunca saem do servidor da organização
4. **Transparência**: Código aberto, auditável, sem telemetria

## Instruções para Teste

### Passo a passo:
1. Clonar repositório: `git clone [url]`
2. Subir serviços: `docker compose up -d`
3. Executar migrações: `docker compose exec app pnpm db:push`
4. Acessar: `http://localhost:3000`

### Cenários de validação:
- Criar conta e fazer upload de arquivo
- Compartilhar arquivo com outro usuário com permissão de leitura
- Verificar log de auditoria do acesso

### Resultados esperados:
- Arquivos armazenados localmente no Nextcloud
- Permissões funcionando (usuário sem permissão não acessa)
- Logs de auditoria registrando todas as ações

## Descobertas e Aprendizados

- **Viabilidade**: É possível ter uma alternativa funcional ao Google Drive em infraestrutura própria
- **Obstáculos**: Configuração inicial do Nextcloud requer passos manuais (documentados)
- **Próximos passos**: Criptografia ponta-a-ponta, notificações
