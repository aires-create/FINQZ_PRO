# SDC FASE 3.4H-F - Local Activation Readiness

## Contexto

A FASE 3.4H-D consolidou o Remote Evidence Store no frontend e a FASE 3.4H-E consolidou a observabilidade operacional da fila em memória. A FASE 3.4H-F não altera comportamento funcional, não ativa HML e não toca no Runtime oficial. Seu papel é documentar as condições seguras para ativação local controlada.

## Bloqueadores Atuais

| ID | Bloqueador | Evidência | Responsável | Ação | Status |
| --- | --- | --- | --- | --- | --- |
| BLK-001 | Backend local não está em execução | `http://localhost:3001/health` e `http://localhost:4000/health` recusam conexão | Ambiente local | Iniciar o backend local antes do smoke | Aberto |
| BLK-002 | Backend carrega `backend/.env` por padrão | `backend/src/config/env/env.ts` usa `dotenv.config();` sem `path` | Configuração local | Definir `backend/.env` local seguro ou exportar variáveis no terminal | Aberto |
| BLK-003 | `backend/.env` atual não é local | `backend/.env` aponta para base remota, não para PostgreSQL local | Ambiente local | Substituir por configuração de desenvolvimento não compartilhada | Aberto |
| BLK-004 | `prisma migrate status` não concluiu no ambiente atual | O comando retornou `spawn EPERM` ao validar o datasource corrente | Banco local | Reexecutar após prover banco local e permissões adequadas | Aberto |
| BLK-005 | Não existe `backend/.env.local` | Arquivo ausente no repositório e não é consumido automaticamente pelo backend | Configuração local | Usar `backend/.env` local ou ajustar o bootstrap de ambiente manualmente | Aberto |
| BLK-006 | Frontend local não possui `.env.local` com as flags oficiais | `.env.local` está ausente e os valores ativos do runtime permanecem `<ausente>` no ambiente atual | Frontend local | Criar `.env.local` a partir do template versionado e ajustar somente o arquivo local | Aberto |

## Objetivo

Definir a prontidão local necessária para validar o fluxo de evidências em ambiente de desenvolvimento/homologação controlada, com Shadow Mode preservado, `PRIMARY_MODE` desativado e sem exposição de dados sensíveis.

## Escopo

Inclui apenas a documentação de prontidão local para:

- frontend
- backend local
- banco local
- RBAC
- usuário seed autorizado
- smoke tests não destrutivos
- rollback local

Não altera:

- Comparator
- Runtime oficial
- ACL
- Bridge
- Prisma Schema
- Migrations
- RBAC
- feature flags
- fluxo oficial de simulação
- HML
- produção

## Estado Esperado Para Ativação Local

| Item | Condição segura |
| --- | --- |
| Runtime oficial | Inalterado |
| Shadow Mode | Preservado |
| `PRIMARY_MODE` | Desativado |
| `VITE_REMOTE_EVIDENCE_ENABLED` | `false` por padrão |
| `APP_ENV` | `local` |
| `NODE_ENV` | `development` |
| Banco | PostgreSQL local ou equivalente de desenvolvimento |
| RBAC | Permissão `simulation:evidence:write` disponível |
| Usuário | Seed administrativo existente no backend |

## Configuração Local Segura

### Frontend

O frontend deve usar apenas variáveis locais não versionadas para apontar para a API de desenvolvimento. A ativação local deve manter:

- Shadow Runtime habilitado apenas no modo de avaliação local
- Remote Evidence desligado por padrão
- nenhum envio automático para ambiente remoto

### Backend

O backend local deve operar com variáveis de ambiente que apontem para o banco de desenvolvimento e mantenham efeitos externos desligados. A configuração local deve respeitar:

- `EXTERNAL_EFFECTS_ENABLED=false`
- `APP_ENV=local`
- `NODE_ENV=development`
- conexão apenas com PostgreSQL local

### Template Versionado

O template oficial versionado do frontend deve incluir as flags de runtime necessárias para a leitura local:

- `VITE_SIMULATION_RUNTIME_SHADOW_ENABLED=false`
- `VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED=false`
- `VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED=true`
- `VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED=false`
- `VITE_REMOTE_EVIDENCE_ENABLED=false`

O comando seguro para criar o arquivo local do frontend a partir do template é:

```powershell
Copy-Item .env.example .env.local
```

Depois disso, o ajuste local deve ser feito apenas em `.env.local`, sem alterar os defaults versionados.

### Banco E Migração

A base de dados local deve conter a migração da FASE 3.4H-B aplicada e a tabela de evidências disponível. A prontidão local depende de um banco que possa ser descartado e recriado sem impacto em ambientes compartilhados.

### RBAC E Usuário

A permissão `simulation:evidence:write` deve existir no seed oficial do backend. O usuário seed administrativo já existente no repositório é o ponto de partida para a ativação local. Nenhum dado sensível de credencial é documentado aqui.

## Smoke Tests Não Destrutivos

Os smoke tests desta fase são apenas de verificação local e não devem alterar dados remotos. A sequência mínima documentada é:

1. subir backend local com banco local
2. validar `health` e `ready`
3. autenticar com o usuário seed administrativo
4. confirmar acesso à permissão `simulation:evidence:write`
5. confirmar que o fluxo de simulação continua em Shadow Mode
6. confirmar que o envio remoto permanece sob a flag `VITE_REMOTE_EVIDENCE_ENABLED`
7. confirmar que a ativação local não altera `PRIMARY_MODE`
8. confirmar rollback desligando a flag e reiniciando apenas o ambiente local

O script somente leitura disponível para inspeção inicial é:

```powershell
node scripts/sdc-3.4h-f-local-readiness.mjs
```

## Arquitetura De Prontidão

O fluxo de prontidão local é apenas operacional e documental:

1. preparar variáveis locais
2. aplicar migration
3. validar seed e RBAC
4. executar smoke tests
5. registrar evidências da sessão local
6. restaurar o estado local caso algum teste falhe

## Rollback

O rollback é local e reversível:

- remover ou ajustar o override de ambiente local
- desligar `VITE_REMOTE_EVIDENCE_ENABLED`
- manter Shadow Mode sem alteração
- recriar o banco local se necessário

## Limitações

- não há ativação HML nesta fase
- não há alteração do Runtime oficial
- não há mudança de `PRIMARY_MODE`
- não há impacto em produção
- não há persistência de métricas ou evidências nesta documentação
- não há autorização para tocar em backend, schema ou migrations além da validação local existente

## Testes E Validações Documentais

Nesta etapa documental, a validação esperada é somente a verificação de integridade do repositório e da documentação da fase:

- `git diff --check`
- `git status --short`
- `git diff --stat`
- `node scripts/sdc-3.4h-f-local-readiness.mjs`

## Próximo Passo

Executar a prontidão local em ambiente não compartilhado, confirmar os smoke tests e só então considerar qualquer ampliação de escopo operacional.

## Parecer Atual

Com o estado atualmente documentado, a fase fica pronta para continuidade controlada apenas quando a configuração local segura estiver disponível fora do repositório. Até lá, o parecer é conservador e não autoriza ativação ampliada.
