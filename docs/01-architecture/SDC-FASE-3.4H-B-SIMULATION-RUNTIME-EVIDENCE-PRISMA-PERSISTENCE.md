# SDC FASE 3.4H-B - Simulation Runtime Evidence Prisma Persistence

## Contexto
Esta fase adiciona persistência oficial Prisma/PostgreSQL para as evidências sanitizadas do Simulation Runtime, mantendo o isolamento multi-tenant e o comportamento idempotente já validado na FASE 3.4H-A.

## Objetivo
Persistir evidências de Shadow Mode sem alterar o resultado oficial da simulação, sem expor dados pessoais e sem criar integração HTTP nesta etapa.

## Escopo
- schema Prisma para `SimulationRuntimeEvidence`;
- migration versionada;
- mapper Prisma;
- repository Prisma;
- testes unitários e de integração;
- documentação técnica da fase.

## Modelo persistente
O modelo dedicado registra identidade, campanha, contexto de comparação, contadores de divergência, versões de contrato e timestamps operacionais.

Campos sensíveis não são armazenados, incluindo nome, CPF, CNPJ, telefone, e-mail, endereço, renda, placa, chassi e dados bancários.

## Isolamento multi-tenant
A tabela usa `tenantId` como chave de escopo primária de consulta e possui `ON DELETE CASCADE` para remoção automática ao excluir o tenant.

## Regra de idempotência
`save` procura por `tenantId + campaignId + evidenceId`. Se o registro já existir e for semanticamente idêntico, o mesmo conteúdo é reutilizado sem sobrescrita.

## Regra de conflito
Se um retry reutilizar a mesma identidade com conteúdo diferente, o repository lança `ConflictingSimulationRuntimeEvidenceError`.

## Dados proibidos
Nenhum payload bruto legado ou canônico é persistido. A evidência permanece sanitizada e limitada ao contrato aprovado.

## Garantias de Shadow Mode
Somente evidências com `shadowMode = true` são aceitas pelo domínio. `PRIMARY_MODE` permanece desativado e não foi alterado nesta fase.

## Migration criada
Foi criada a migration manual `20260710120000_sdc_3_4h_b_simulation_runtime_evidence` com tabela, índices, unique composta e foreign key para `tenants`.

## Testes executados
Esta fase inclui testes unitários do repository Prisma e teste de integração real com PostgreSQL via Prisma.

## Resultado
Persistência oficial foi adicionada sem rota HTTP e sem alterar o comportamento do runtime.

## Limitações
- nenhuma rota HTTP criada;
- nenhuma ativação de `PRIMARY_MODE`;
- nenhuma alteração no resultado oficial;
- campanha ainda não está operacionalmente conectada ao frontend.

## Próximo passo
SDC FASE 3.4H-C - Evidence HTTP Ingestion and RBAC
