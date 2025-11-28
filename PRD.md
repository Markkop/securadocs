# PRD.md — Product Requirements Document

## 1. Metadados

- **Nome do projeto:** SecuraDocs
- **Versão do documento:** v0.1
- **Data:** 2025-01-10
- **Autor(es):** Equipe SecuraDocs
- **Status:** Aprovado

---

## 2. Contexto & Problema

> Explique em poucas linhas o contexto político, social ou de negócio e o problema que o produto resolve.

- **Contexto:**  
  - Dependência de Big Techs para armazenamento de documentos sensíveis expõe organizações populares, coletivos e movimentos sociais a riscos de vigilância, vazamento de dados e perda de controle sobre informações críticas.
  - Colonialismo digital e falta de soberania sobre dados de organizações que trabalham com causas sociais, direitos humanos e ativismo.
  - Necessidade de alternativas FOSS (Free and Open Source Software) que permitam auto-hospedagem e controle total sobre infraestrutura.

- **Problema principal:**  
  - Coletivos populares, ONGs e movimentos sociais precisam armazenar e compartilhar documentos sem expor dados a terceiros, mas não têm alternativas simples e seguras que sejam acessíveis tecnicamente e financeiramente.

- **Problemas secundários/opcionais:**
  - Falta de controle fino de permissões de acesso a documentos sensíveis.
  - Dificuldade de auditar quem acessou quais documentos e quando.
  - Dependência de serviços proprietários que podem mudar políticas ou encerrar serviços.
  - Custo elevado de soluções empresariais para organizações sem fins lucrativos.
  - Complexidade técnica de soluções self-hosted existentes (Nextcloud, Seafile) para equipes pequenas.

---

## 3. Visão do Produto

> Um parágrafo que resuma a visão.

> _"Criar uma alternativa simples, segura e soberana para armazenamento e compartilhamento de arquivos para organizações populares, com foco em autonomia digital, privacidade e controle total sobre dados."_  

- **Missão:**  
  Empoderar organizações populares com ferramentas de armazenamento e compartilhamento de documentos que garantam soberania digital, privacidade e controle sobre seus dados, sem depender de Big Techs ou soluções proprietárias.

- **Posicionamento:**  
  "Google Drive-like, porém auto-hospedável, focado em segurança, autonomia e privacidade para coletivos e movimentos sociais."

---

## 4. Objetivos (MVP e além)

### 4.1 Objetivos do MVP

Liste de 3 a 5 objetivos claros.

- [ ] Permitir upload, organização e compartilhamento básico de arquivos com interface intuitiva.
- [ ] Garantir que os dados fiquem em infraestrutura sob controle da organização (self-hosted ou cloud com controle).
- [ ] Implementar autenticação básica com autorização mínima viável (usuários, permissões por arquivo/pasta).
- [ ] Fornecer logs básicos de auditoria (quem acessou o quê e quando).
- [ ] Oferecer experiência de uso simples, sem necessidade de conhecimento técnico avançado para operação básica.

### 4.2 Objetivos de Longo Prazo

- [ ] Auditoria detalhada de acessos com exportação de relatórios.
- [ ] Criptografia ponta a ponta para arquivos sensíveis.
- [ ] Ferramentas colaborativas (edição em tempo real, comentários, versões).
- [ ] Suporte a múltiplas organizações (multi-tenant) no mesmo deploy.
- [ ] Integração com ferramentas de comunicação (Matrix, Signal, etc.).
- [ ] API pública para integrações customizadas.
- [ ] Sincronização desktop/mobile (cliente nativo).

---

## 5. Público-alvo & Personas

### 5.1 Público-alvo

- **Tipo de organização:** Coletivos populares, sindicatos, ONGs, movimentos sociais, grupos de ativismo, associações comunitárias.
- **Tamanho da equipe usuária:** 5 a 50 pessoas por organização.
- **Nível de letramento digital:** Básico a intermediário (não requer conhecimento técnico avançado para uso básico).

### 5.2 Personas (exemplo de estrutura)

**Persona 1 — Maria, Coordenadora de Coletivo**

- Papel: Coordenadora de um coletivo de moradores que luta por moradia.
- Objetivos:  
  - Organizar documentos do coletivo (atas de reuniões, documentos jurídicos, fotos de ocupações).
  - Garantir acesso aos membros certos sem expor informações sensíveis.
  - Compartilhar documentos com advogados e parceiros de forma segura.
- Dores:  
  - Medo de que documentos sensíveis vazem ou sejam acessados por terceiros.
  - Dificuldade em gerenciar permissões em ferramentas como Google Drive.
  - Preocupação com custos de soluções pagas.

**Persona 2 — João, Membro de ONG**

- Papel: Membro de uma ONG que trabalha com direitos humanos.
- Objetivos:  
  - Acessar documentos compartilhados pela equipe rapidamente.
  - Saber quando documentos foram modificados ou acessados.
  - Trabalhar offline quando possível.
- Dores:  
  - Dependência de internet para acessar documentos críticos.
  - Falta de transparência sobre quem acessou quais documentos.
  - Interface confusa de ferramentas existentes.

**Persona 3 — Ana, Administradora Técnica**

- Papel: Pessoa responsável por manter a infraestrutura técnica da organização.
- Objetivos:  
  - Garantir que o sistema seja fácil de manter e atualizar.
  - Ter controle total sobre onde os dados são armazenados.
  - Poder fazer backup e migração quando necessário.
- Dores:  
  - Complexidade de soluções self-hosted existentes.
  - Falta de documentação clara para migração e manutenção.
  - Dificuldade em escalar quando a organização cresce.

---

## 6. Casos de Uso Principais

Liste os fluxos que realmente importam para o MVP.

1. **[UC-01] Upload de Arquivo**
   - Ator: Usuário autenticado
   - Descrição: Usuário envia um arquivo através da interface web. O sistema valida o arquivo (tipo, tamanho), armazena em storage seguro e exibe na interface imediatamente.
   - Critérios de aceitação:
     - [ ] O usuário vê feedback de sucesso/erro durante o upload.
     - [ ] O arquivo aparece na lista imediatamente após upload bem-sucedido.
     - [ ] Arquivos inválidos (muito grandes, tipos não permitidos) são rejeitados com mensagem clara.
     - [ ] O sistema mantém metadados do arquivo (nome, tamanho, tipo, data de upload, proprietário).

2. **[UC-02] Compartilhar Arquivo/Pasta**
   - Ator: Proprietário do arquivo/pasta ou usuário com permissão de compartilhamento
   - Descrição: Usuário cria um link de compartilhamento ou compartilha diretamente com outros usuários do sistema, definindo permissões (leitura, escrita).
   - Critérios de aceitação:
     - [ ] Permitir compartilhar por link público (com token seguro) e/ou com usuários específicos.
     - [ ] Permitir definir permissões mínimas (leitura, escrita, administração).
     - [ ] Links de compartilhamento podem ter expiração configurável.
     - [ ] Usuários compartilhados recebem notificação (opcional no MVP).

3. **[UC-03] Gerenciar Permissões**
   - Ator: Proprietário do recurso ou administrador
   - Descrição: Usuário visualiza e modifica permissões de acesso a arquivos e pastas, incluindo remoção de acesso.
   - Critérios de aceitação:
     - [ ] Visualizar lista de usuários/grupos com acesso ao recurso.
     - [ ] Adicionar/remover permissões de usuários específicos.
     - [ ] Modificar nível de permissão (leitura → escrita, etc.).
     - [ ] Revogar links de compartilhamento.

4. **[UC-04] Navegar e Organizar Arquivos**
   - Ator: Usuário autenticado
   - Descrição: Usuário navega por pastas, cria novas pastas, move arquivos entre pastas e renomeia recursos.
   - Critérios de aceitação:
     - [ ] Visualizar estrutura hierárquica de pastas.
     - [ ] Criar novas pastas dentro de pastas existentes.
     - [ ] Mover arquivos/pastas arrastando ou via menu de contexto.
     - [ ] Renomear arquivos e pastas.
     - [ ] Buscar arquivos por nome.

5. **[UC-05] Download de Arquivo**
   - Ator: Usuário com permissão de leitura
   - Descrição: Usuário baixa um arquivo compartilhado ou próprio através da interface.
   - Critérios de aceitação:
     - [ ] Download funciona para arquivos próprios e compartilhados (com permissão).
     - [ ] Sistema registra o download em logs de auditoria.
     - [ ] Download mantém nome original do arquivo.

6. **[UC-06] Visualizar Logs de Auditoria**
   - Ator: Administrador ou proprietário do recurso
   - Descrição: Usuário visualiza histórico de ações realizadas em arquivos/pastas (acessos, downloads, modificações).
   - Critérios de aceitação:
     - [ ] Exibir lista de eventos (ação, usuário, data/hora, recurso).
     - [ ] Filtrar por tipo de ação, usuário ou período.
     - [ ] Exportar logs em formato CSV/JSON (opcional no MVP).

---

## 7. Requisitos Funcionais (RF)

Liste como RF-01, RF-02, etc.

- **RF-01 — Autenticação de usuário**
  - O sistema deve permitir que pessoas usuárias se registrem e façam login usando email e senha.
  - Senhas devem ser armazenadas com hash seguro (argon2 ou bcrypt).
  - Sessões devem ser gerenciadas de forma segura (cookies assinados, expiração configurável).

- **RF-02 — Upload de arquivos**
  - O sistema deve permitir upload de arquivos individuais através da interface web.
  - Deve validar tipo de arquivo e tamanho máximo configurável.
  - Deve armazenar arquivos em storage seguro (Nextcloud WebDAV).
  - Deve manter metadados no banco de dados (nome, tamanho, tipo MIME, data, proprietário).

- **RF-03 — Criação de pastas/coleções**
  - O sistema deve permitir criar pastas hierárquicas para organização de arquivos.
  - Pastas podem conter outras pastas e arquivos.
  - Cada pasta tem um proprietário e herda permissões do contexto.

- **RF-04 — Compartilhamento com controle de acesso**
  - O sistema deve permitir compartilhar arquivos e pastas por link público (com token único).
  - Deve permitir compartilhar com usuários específicos do sistema.
  - Deve suportar níveis de permissão: leitura, escrita, administração.
  - Links de compartilhamento podem ter data de expiração.

- **RF-05 — Download de arquivos**
  - Usuários autenticados podem baixar arquivos próprios.
  - Usuários com permissão de leitura podem baixar arquivos compartilhados.
  - Sistema deve validar permissões antes de permitir download.

- **RF-06 — Navegação e organização**
  - Sistema deve exibir estrutura hierárquica de pastas e arquivos.
  - Deve permitir mover arquivos/pastas entre pastas.
  - Deve permitir renomear arquivos e pastas.
  - Deve permitir busca por nome de arquivo/pasta.

- **RF-07 — Registro de eventos de auditoria**
  - Sistema deve registrar eventos críticos: login, logout, upload, download, compartilhamento, modificação de permissões.
  - Logs devem incluir: usuário, ação, recurso afetado, data/hora, endereço IP (opcional).
  - Administradores devem poder visualizar logs de auditoria.

- **RF-08 — Gerenciamento de permissões**
  - Proprietários de recursos devem poder visualizar e modificar permissões.
  - Deve ser possível revogar acesso de usuários específicos ou links de compartilhamento.
  - Permissões devem ser herdadas de pastas pai quando aplicável (opcional no MVP).

---

## 8. Requisitos Não Funcionais (RNF)

### 8.1 Soberania & Controle de Dados

- **RNF-SOB-01** — O sistema deve permitir deployment em infraestrutura própria (servidor local, VPS, cloud própria).
- **RNF-SOB-02** — Evitar dependências proprietárias críticas (ou planejar rota de saída clara).
- **RNF-SOB-03** — Dados devem poder ser exportados/migrados sem vendor lock-in.
- **RNF-SOB-04** — Código-fonte deve ser open source e auditável.

### 8.2 Segurança & Privacidade

- **RNF-SEG-01** — Todo tráfego deve usar HTTPS/TLS em produção.
- **RNF-SEG-02** — Senhas nunca devem ser armazenadas em texto plano (hash com algoritmo moderno).
- **RNF-SEG-03** — Deve existir uma política clara de logs (o que logar, por quanto tempo, quem tem acesso).
- **RNF-SEG-04** — Tokens de compartilhamento devem ser criptograficamente seguros e não previsíveis.
- **RNF-SEG-05** — Validação de entrada para prevenir ataques (XSS, SQL injection, path traversal).
- **RNF-SEG-06** — Rate limiting em endpoints críticos (login, upload).

### 8.3 Controle de Acesso

- **RNF-CTL-01** — Permissões devem ser baseadas em contexto (usuários, grupos, recursos).
- **RNF-CTL-02** — Permissões sensíveis não podem ser públicas por padrão (princípio do menor privilégio).
- **RNF-CTL-03** — Validação de permissões deve ocorrer em todas as operações críticas (server-side).

### 8.4 Auditoria & Transparência

- **RNF-AUD-01** — O sistema deve registrar, no mínimo, logins, uploads, downloads e modificações de permissões.
- **RNF-AUD-02** — Deve existir uma forma de exportar logs para análise externa (CSV/JSON).
- **RNF-AUD-03** — Logs devem ser imutáveis ou protegidos contra modificação não autorizada.

### 8.5 Performance & Escalabilidade

- **RNF-PERF-01** — O sistema deve suportar ao menos 20 usuários simultâneos no MVP.
- **RNF-PERF-02** — Tempo de resposta médio < 500ms para operações comuns (listagem, navegação).
- **RNF-PERF-03** — Upload de arquivos até 100MB deve completar em tempo razoável (< 30s em conexão estável).
- **RNF-PERF-04** — Interface deve ser responsiva e não travar durante operações assíncronas.

### 8.6 Usabilidade & Acessibilidade

- **RNF-UX-01** — Interface responsiva (mobile/desktop).
- **RNF-UX-02** — Seguir boas práticas de acessibilidade (contraste, navegação por teclado, ARIA labels).
- **RNF-UX-03** — Mensagens de erro devem ser claras e acionáveis.
- **RNF-UX-04** — Interface deve ser intuitiva para usuários com nível básico de letramento digital.

### 8.7 Manutenibilidade & Deploy

- **RNF-DEP-01** — Deploy deve ser simples (preferencialmente via Docker Compose).
- **RNF-DEP-02** — Documentação clara para setup, migração e manutenção.
- **RNF-DEP-03** — Sistema deve suportar atualizações sem perda de dados.
- **RNF-DEP-04** — Backup e restore devem ser documentados e testáveis.

---

## 9. Escopo do MVP (Primeira Entrega)

> Liste o que **entra** e o que **não entra** no MVP.

### 9.1 Incluído

- [ ] Autenticação básica (registro/login com email e senha).
- [ ] Upload/Download de arquivos individuais.
- [ ] Estrutura mínima de pastas/coleções (criar, navegar, mover).
- [ ] Compartilhamento simples (link público com token, compartilhamento com usuários específicos).
- [ ] Permissões básicas (leitura, escrita).
- [ ] Logs básicos de auditoria (visualização de eventos principais).
- [ ] Interface web responsiva básica.

### 9.2 Fora do escopo (por enquanto)

- [ ] Edição colaborativa em tempo real de documentos.
- [ ] Criptografia ponta a ponta (E2EE).
- [ ] Interface de administração avançada (gestão de usuários em massa, configurações globais).
- [ ] Versões de arquivos (histórico de modificações).
- [ ] Comentários e anotações em arquivos.
- [ ] Preview de arquivos (visualização de imagens, PDFs, etc.) na interface.
- [ ] Sincronização desktop/mobile (cliente nativo).
- [ ] Multi-tenant (múltiplas organizações no mesmo deploy).
- [ ] Integração com serviços externos (email, notificações push).
- [ ] API pública para integrações.

---

## 10. Métricas de Sucesso

- **Adoção:**  
  - N organizações usando em X meses (meta inicial: 3-5 organizações piloto).
  - Taxa de retenção de usuários (usuários que continuam usando após primeira semana).

- **Uso:**  
  - N arquivos armazenados por organização.
  - N logins por semana/mês.
  - N compartilhamentos criados.

- **Satisfação:**  
  - Feedback qualitativo dos coletivos (entrevistas, pesquisas).
  - NPS ou similar (meta: > 50).

- **Soberania/Security:**  
  - % de infra sob controle próprio (meta: 100% para organizações que optarem por self-hosted).
  - Zero incidentes de vazamento no período de teste.
  - Tempo médio para deploy self-hosted (meta: < 2 horas para pessoa com conhecimento básico).

- **Performance:**  
  - Tempo médio de resposta de operações críticas.
  - Taxa de sucesso de uploads (> 95%).

---

## 11. Dependências & Restrições

- **Dependências externas:**
  - PostgreSQL (self-hosted via Docker, compartilhado com Nextcloud)
  - Nextcloud (self-hosted via Docker) para armazenamento de arquivos
  - Infraestrutura de deploy (VPS, cloud, servidor próprio)
  - Docker e Docker Compose

- **Restrições de tempo:**
  - MVP deve ser desenvolvido de forma incremental, validando cada feature antes de avançar.

- **Restrições de orçamento:**
  - Solução deve ser viável para organizações sem fins lucrativos (custos baixos ou zero para uso básico).
  - Infraestrutura self-hosted elimina custos de serviços gerenciados.
  - VPS básico (4GB RAM) suficiente para organizações pequenas/médias.

- **Restrições técnicas:**
  - Deve funcionar em infraestrutura comum (VPS com 2GB RAM mínimo, recomendado 4GB+).
  - Deve ser deployável via Docker Compose por pessoa com conhecimento técnico básico.
  - Requer Nextcloud para armazenamento de arquivos (via WebDAV API).

---

## 12. Riscos & Premissas

- **Riscos:**  
  - Falta de pessoas para manter o servidor no longo prazo (mitigação: documentação clara, comunidade).
  - Complexidade técnica para organizações pequenas (mitigação: interface simples, deploy automatizado).
  - Escalabilidade de storage para organizações grandes (mitigação: arquitetura preparada para crescimento).
  - Segurança: vulnerabilidades não detectadas (mitigação: auditorias de código, boas práticas).

- **Premissas:**  
  - Haverá alguém responsável por backup e manutenção básica em cada organização.
  - Organizações têm acesso a infraestrutura básica (VPS ou servidor próprio).
  - Usuários têm conhecimento básico de navegação web.
  - Internet estável para operação básica (não requer offline-first no MVP).

---

## 13. Próximos Passos

- [ ] Validar este PRD com coletivos e stakeholders potenciais.
- [ ] Definir backlog inicial baseado em casos de uso.
- [ ] Priorizar histórias para MVP seguindo abordagem incremental (ver PLAN.md).
- [ ] Criar protótipos de interface para validação de UX.
- [ ] Estabelecer métricas de acompanhamento e ferramentas de analytics (respeitando privacidade).

---

## 14. Referências & Inspirações

- **Projetos similares:**
  - Nextcloud (agora usado como backend de armazenamento do SecuraDocs).
  - Seafile (foco em sync, menos foco em web).
  - CryptPad (foco em colaboração e privacidade).

- **Integração com Nextcloud:**
  - SecuraDocs usa Nextcloud como backend de armazenamento via WebDAV API.
  - PostgreSQL é compartilhado entre SecuraDocs e Nextcloud.
  - Usuários podem acessar arquivos diretamente via interface do Nextcloud se necessário.
  - Aplicativos mobile e desktop do Nextcloud podem sincronizar arquivos.

- **Filosofia:**
  - Princípios de software livre e soberania digital.
  - Privacidade por design.
  - Acessibilidade e inclusão digital.
  - Soberania completa de dados via infraestrutura self-hosted.

