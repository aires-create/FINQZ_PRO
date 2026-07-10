# SDC FASE 3.4H-E - Runtime Evidence Monitoring and Homologation Rollout

## Contexto

A SDC FASE 3.4H-D concluiu o wiring do Remote Evidence Store no frontend, mantendo Shadow Mode, PRIMARY_MODE e o Runtime oficial intactos. A FASE 3.4H-E adiciona observabilidade operacional da fila de evidências sem alterar o comportamento funcional da simulação.

## Objetivo

Fornecer monitoramento local e telemetria agregada do fluxo de Remote Evidence para homologação, com leitura segura do estado da fila, sem persistência e sem impacto perceptível ao usuário.

## Escopo

Inclui apenas a camada de Remote Evidence do frontend:

- `src/features/simulation-runtime/evidence/remote`
- `src/features/simulation-runtime/telemetry`

Não altera:

- Comparator
- Runtime
- ACL
- Bridge
- Prisma Schema
- Migrations
- RBAC
- PRIMARY_MODE
- fluxo oficial de simulação

## Arquitetura Das Métricas

A fila em memória passa a manter um estado agregado interno atualizado durante enqueue, retries e encerramento de cada tentativa. Esse estado é convertido em snapshot por `buildSimulationRuntimeRemoteEvidenceMetricsSnapshot(...)` e publicado pela telemetria existente via evento `shadow_remote_evidence_metrics`.

O snapshot é calculado a partir de um estado local que existe apenas em runtime no navegador. Não há armazenamento persistente nem sincronização para backend.

## Métricas

### `enqueuedCount`

Incrementado imediatamente quando `enqueue(evidence)` é chamado.

### `successCount`

Incrementado no momento em que a resposta do client remoto retorna `2xx`.

### `conflictCount`

Incrementado no momento em que o backend retorna `409`. Esse caso é tratado como conflito operacional, sem retry.

### `retryCount`

Incrementado imediatamente antes de cada nova tentativa em situações retryable:

- erro de rede
- timeout
- resposta `5xx`

### `failureCount`

Incrementado quando a fila encerra a evidência de forma definitiva, sem sucesso, sem conflito e sem mais retries possíveis.

### `averageSendTimeMs`

Média aritmética do tempo gasto em cada tentativa concluída de envio ao client remoto.

Definição exata:

- inicia no instante imediatamente antes de chamar `client.send(evidence)`
- termina quando a Promise do client resolve ou rejeita
- cada tentativa concluída conta uma vez no acumulado
- retries entram na média como tentativas concluídas individualmente

### `currentQueueSize`

Representa o tamanho atual da fila em memória no instante do snapshot.

## Momento Exato De Incremento

- `enqueuedCount`: no início de `enqueue`
- `successCount`: após resposta `2xx`
- `conflictCount`: após resposta `409`
- `retryCount`: ao decidir reagendar uma nova tentativa
- `failureCount`: ao encerrar definitivamente por erro terminal ou exaustão de retries
- `currentQueueSize`: recalculado no snapshot e refletido após cada mudança de fila

## Comportamento Durante Retries

- O item permanece em fila até sucesso, conflito ou falha definitiva.
- O backoff continua exponencial.
- `retryCount` é incrementado a cada reprocessamento agendado.
- `averageSendTimeMs` considera somente tentativas concluídas, não o tempo de espera do backoff.

## Telemetria

O evento `shadow_remote_evidence_metrics` publica:

- requestId opcional
- correlationId opcional
- evidenceId opcional
- snapshot agregado da fila

A telemetria continua usando a infraestrutura existente do Shadow Runtime. Nenhum novo sistema de telemetry foi introduzido.

## Snapshot

`buildSimulationRuntimeRemoteEvidenceMetricsSnapshot(...)` converte o estado interno da fila em uma visão estável para inspeção em homologação e análise operacional.

## Segurança E Sanitização

A observabilidade não expõe:

- tenantId
- payload bruto
- CPF
- nome
- telefone
- documentos
- conteúdo bruto da resposta

Somente métricas agregadas e identificadores operacionais já sanitizados são enviados.

## Métricas Em Memória

As métricas vivem apenas em memória do navegador e da sessão corrente.

## Reinicialização Em Reload

Ao recarregar a página, o estado da fila e os snapshots são reiniciados do zero. Isso é esperado e aceitável para homologação.

## Testes Executados

Cobertura unitária adicionada para:

- fila vazia
- sucesso
- conflito
- retries
- falhas
- snapshot agregado
- cálculo do tempo médio

## Resultados

Os testes e validações da implementação ficaram verdes na validação final da fase:

- suíte frontend aprovada
- build frontend aprovado
- arch-check aprovado
- backend typecheck aprovado
- backend unit tests aprovados
- backend integration tests aprovados
- backend build aprovado

## Limitações

- Métricas são somente em memória
- Não existe persistência histórica
- Não existe exportação fora da telemetria existente
- O snapshot reflete apenas a sessão atual

## Rollback

O rollback operacional consiste em desabilitar `VITE_REMOTE_EVIDENCE_ENABLED`. A observabilidade permanece inativa sem alterar Shadow Mode nem o Runtime oficial.

## Próximo Passo

Usar os snapshots e a telemetria para acompanhar o rollout gradual em homologação e confirmar estabilidade operacional antes de qualquer ampliação de escopo.
