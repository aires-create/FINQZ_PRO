# AUD-009 — Seed Governance Audit (RFC)

Result: ISSUES FOUND

Status: NOT SAFE FOR PRODUCTION SEED

## 1. Resumo executivo

O seed localizado em `backend/prisma/seed.ts` apresenta múltiplos problemas de segurança, compatibilidade e idempotência. As principais questões: credenciais hard-coded para o `SUPER_ADMIN`, presença de roles legadas (`ROLE_*`) misturadas com novos slugs, convenções de slug de permissões inconsistentes, mistura de conceito Lead ↔ Opportunity no pipeline `Consignado` (estágio `Novo Lead`), e riscos de inconsistência entre `membership.role` livre e `role.slug` formal. Considerando o impacto no login/admin e na governança RBAC, o seed não é seguro para execução em produção até correções controladas serem validadas.

## 2. Achados (P0 — P5)

Cada achado segue o formato: arquivo, linha (referência aproximada no arquivo), problema, impacto, recomendação.

- P0 — Seed Security
  - arquivo: `backend/prisma/seed.ts`
  - linhas: ~L1942–L1979 (criação do SUPER_ADMIN; senha em claro em ~L1951)
  - problema: senha `SuperAdmin123!` hard-coded; `upsert` usa `update: {}` vazio para usuário (não atualiza credenciais em reexecuções) e criação de `userRole` sem controles de reset.
  - impacto: credenciais previsíveis em ambientes que receberem o seed; risco imediato de comprometimento de admin; reexecução pode não aplicar correções ou pode sobrescrever senhas se alterado sem flags de controle.
  - recomendação: não manter senha hard-coded; usar `process.env.SEED_SUPER_ADMIN_PASSWORD` ou exigir criação manual; alterar fluxo de upsert para não alterar senha a menos que `SEED_FORCE_RESET_ADMIN=true`; adicionar guardrails de ambiente (somente local/dev por padrão).

- P1 — Role Compatibility Map
  - arquivo: `backend/prisma/seed.ts`
  - linhas: ~L925 (roles iniciais), ~L1099–L1279 (muitos `ROLE_*` legados)
  - problema: coexistência de slugs canônicos (`super-admin`, `admin`, `manager`, `auditor`) e roles legadas `ROLE_*` gerando duplicidade e ambiguidade (ex.: `auditor` e `ROLE_AUDITOR`).
  - impacto: resolução de permissões inconsistente em runtime; políticas que verificam slugs específicos podem falhar; migração e interoperabilidade afetadas com a Scope Compatibility Layer SAFE.
  - recomendação: introduzir um mapa de compatibilidade no seed (aliasing) que garanta que roles legadas existam como aliases ou que roles canônicos recebam permissões em ambos slugs; documentar mapeamento antes de qualquer consolidação.

- P2 — Permission Convention Compatibility
  - arquivo: `backend/prisma/seed.ts`
  - linhas: ~L196 (início `createPermissions`), exemplos `DASHBOARD_VIEW` em ~L699 e uso em roles ~L1383
  - problema: mistura de convenções de `slug` (alguns `resource:action` como `user:create`, outros tokens UPPERCASE como `DASHBOARD_VIEW`).
  - impacto: verificações de autorização que assumem um padrão único podem perder permissões; manutenção e busca por permissão tornam-se frágeis.
  - recomendação: definir convenção canônica (`resource:action`) e prover camada de compatibilidade no seed (criar alias legacy ou criar ambas permission entries) sem apagar as legadas.

- P3 — Pipeline Stage Naming
  - arquivo: `backend/prisma/seed.ts`
  - linhas: ~L53–L59 (definição `consignadoPipelineSeed`; estágio `Novo Lead` em ~L59)
  - problema: pipeline `Consignado` contém estágio `Novo Lead` — mistura de Lead com Opportunity workflow.
  - impacto: potencial violação da ADR-007 (se ADR exige Opportunity como centro operacional) e confusão em relatórios/automação; integrações que assumem separação podem quebrar.
  - recomendação: não renomear automaticamente agora; produzir documento de transição e, se aprovado, criar novo estágio canônico (ex.: `Qualificação`) com migração controlada e período de compatibilidade.

- P4 — Membership Role Alignment
  - arquivo: `backend/prisma/seed.ts`
  - linhas: ~L1822–L1912 (definição `membershipData` e `prisma.membership.upsert` em ~L1912)
  - problema: `membership.role` usa strings livres (`owner`, `admin`, `manager`) sem garantir criação/associação correspondente em `role.slug`/`userRole`.
  - impacto: memberships podem existir sem a correspondente `userRole` formal, levando a inconsistências de ownership/partner scope e comportamento inesperado de autorização.
  - recomendação: resolver `membership.role` para `role.slug` existente e assegurar `userRole` upsert paralelo; logar warning e falhar em modo estrito se role não puder ser mapeado.

- P5 — Seed Idempotency Report
  - arquivo: `backend/prisma/seed.ts`
  - linhas: múltiplas (uso amplo de `upsert`, algumas chamadas com `update: {}` vazias — ex.: user upsert ~L1960, rolePermission upsert ~L932)
  - problema: embora `upsert` seja usado extensivamente, `update: {}` vazio deixa campos imutáveis pelo seed; inconsistências e comportamento parcial idempotente.
  - impacto: reexecução do seed pode deixar dados "stale"; mudanças planejadas no seed podem não ser aplicadas sem flags específicas; logs de `warn` podem mascarar falhas.
  - recomendação: instrumentar e gerar relatório de idempotência (ver P5 plano), explicitar campos que o seed atualiza e quais campos são imutáveis, e adicionar modo de execução `--dry-run` para validação.

## 3. Riscos por severidade

- Crítico / BLOCKER
  - Hard-coded admin password e manipulação insegura de credenciais (P0). Pode permitir acesso administrativo não autorizado.
  - Alteração inadvertida da credencial admin sem validação pode quebrar login/admin (P0).

- Alto
  - Ambiguidade entre roles legadas e canônicas levando a gaps de autorização (P1).
  - Permissões com slugs inconsistentes causando perda de cobertura de autorização (P2).

- Médio
  - Mismatch entre `membership.role` e `userRole` causando inconsistências de ownership (P4).
  - Logs warning silenciosos durante rolePermission upserts (pode mascarar erro real) (P5).

- Baixo
  - Nome de estágio `Novo Lead` (P3) — impacto operacional/arquitetural mais do que técnico imediato; exigir coordenação de produto.

## 4. O que pode ser corrigido agora (pequenos patches seguros)

- P0 (controlado): remover hard-coded password no código e usar `process.env.SEED_SUPER_ADMIN_PASSWORD`; implementar `SEED_FORCE_RESET_ADMIN` flag para forçar reset da senha. *IMPORTANTE:* não ativar reset em produção; marcar como BLOCKER até validação manual de login.
- P1 (seed-only): adicionar `ROLE_COMPAT_MAP` no seed que mapeia `ROLE_*` -> slug canônico e, ao atribuir permissões, aplicar tanto a slug canônico quanto ao slug legado (criar role legado apenas se ausente). Não remover roles legadas.
- P2 (seed-only): adicionar camada de compatibilidade de permissões — ao buscar perm por slug, tentar variantes (legacy uppercase, `resource:action`) e logar diferenças; criar ambas entradas quando necessário.
- P4 (seed-only): ao criar `membership`, resolver/mapeaar `membership.role` para um `role.id` e garantir `userRole.upsert` correspondente; se mapeamento falhar, emitir erro em `--strict` ou `warn` em modo permissivo.
- P5 (test): adicionar script/test de idempotência que executa seed duas vezes em DB de teste e gera `seed-idempotency-report.json` listando diffs.

## 5. O que deve ser apenas documentado

- P3 Pipeline Stage Naming: documentar a incongruência com ADR-007 e requerer aprovação de produto/arquitetura antes de qualquer alteração de estágio. Criar RFC separado para renomeação/migração de estágios.
- Mapas de compatibilidade (roles/perms): documentar convenções e o plano de substituição progressiva (esta documentação deve acompanhar qualquer patch que introduza aliases).
- Instruções operacionais para rodar seed: variáveis de ambiente necessárias (`SEED_SUPER_ADMIN_PASSWORD`, `SEED_FORCE_RESET_ADMIN`, `SEED_ENV=local|staging|production`) e checklist pré-execução (backup, CI dry-run, validação de login manual).

## 6. O que NÃO deve ser feito

- NÃO rodar o seed em produção até que P0 seja tratado com validação de login/admin. (DECISÃO: BLOCK)
- NÃO commitar mudanças do seed junto com outras alterações funcionais (separar patches pequenos e revisáveis).
- NÃO remover roles legadas diretamente do seed ou do DB — migrar via processo controlado e com rollout.
- NÃO alterar `schema.prisma` / NÃO criar migrations agora.
- NÃO alterar o frontend ou runtime como parte desses patches; o objetivo é compatibilidade regressiva no seed.

## 7. Critérios de aceite para futuros patches (por patch)

- P0 Seed Security
  - Tests: execução do seed em DB de teste duas vezes sem alterar senha por padrão; opção `SEED_FORCE_RESET_ADMIN=true` reseta a senha somente quando explicitamente fornecida; revisão de credenciais em ambiente de staging com validação manual de login. CI gate: falha se detectada senha hard-coded.
  - Aceite: senha hard-coded removida; criação/atualização segura condicionada a variável; documentação operacional atualizada.

- P1 Role Compatibility Map
  - Tests: roles legadas e canônicas existem após seed; permissões esperadas associadas a ambos; middleware `tenantContext` identifica roles admin esperados (testar via endpoint mock).
  - Aceite: não haver gaps de permissão entre legados e canônicos; logs claros quando uma role legacy é usada.

- P2 Permission Convention Compatibility
  - Tests: permissão canônica criada e legacy alias disponível; rolePermission upserts sucedem sem warnings não explicados.
  - Aceite: autorização de endpoints protegidos funciona usando ambas convenções (testes automatizados que simulam checagem de permissão).

- P3 Pipeline Stage Naming
  - Tests: RFC aprovada por arquitetura/produto; plano de migração e rollback; staging validation mostrando que relatórios e automações continuam funcionando.
  - Aceite: aprovação explícita e plano de rollout documentado antes de qualquer mudança automática.

- P4 Membership Role Alignment
  - Tests: para cada membership seedada, existe `userRole` correspondente; reexecução não cria duplicatas nem perde associação.
  - Aceite: memberships e userRoles consistentes após seed.

- P5 Seed Idempotency Report
  - Tests: executar seed duas vezes em DB efêmero e gerar relatório mostrando sem duplicação e listando campos imutáveis; CI integra esse teste.
  - Aceite: relatório aprovado e divergências documentadas com ações mitigadoras.

## 8. Decisão final

- não rodar seed em produção
- não commitar seed com outras mudanças
- não aplicar P0 sem validação de login/admin
- nenhuma migration agora

---

Auditor: script-assisted code review
Data: 2026-06-04
