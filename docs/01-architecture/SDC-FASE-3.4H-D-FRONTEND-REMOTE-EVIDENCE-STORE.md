# SDC FASE 3.4H-D - Frontend Remote Evidence Store Wiring

## Arquitetura

O frontend continua executando o Shadow Runtime oficial sem alterar o resultado visível para o usuário. Depois que o Comparator e o Evidence Builder concluem, a evidência sanitizada passa para uma Remote Evidence Store em memória assíncrona, que enfileira o envio ao endpoint oficial da fase 3.4H-C.

## Fluxo

1. Simulation Result
2. Comparator
3. Evidence Builder
4. Remote Evidence Store
5. HTTP Client existente
6. `POST /api/v1/simulations/runtime-evidence`
7. `200`, `201` ou `409`
8. Telemetry

## Retries

O envio remoto usa fila FIFO com retry exponencial.

- Máximo de 3 retries
- Retenta apenas `5xx`, erro de rede e timeout
- Não retenta `400`, `401`, `403`, `404` e `409`

## Conflito

Quando o backend responde `409`, o frontend considera o evento um conflito operacional não bloqueante. Nenhum retry é executado, nenhum `success` é emitido, apenas a telemetria de `conflict`. O item sai da fila e o usuário não percebe erro.

## Telemetria

A telemetria reaproveita a infraestrutura existente do Shadow Runtime e registra:

- enqueue
- success
- retry
- failure
- conflict
- disabled

## Fase Seguinte

A observabilidade operacional da fila foi detalhada na SDC FASE 3.4H-E.

## Feature Flag

- Flag: `VITE_REMOTE_EVIDENCE_ENABLED`
- Default: `false`

Quando a flag está desligada, nada é enviado ao endpoint remoto.

## Rollback

O rollback consiste em desligar `VITE_REMOTE_EVIDENCE_ENABLED`. O Shadow Runtime continua funcionando normalmente, sem impacto perceptível ao usuário.

## Limitações

- Não altera o Runtime oficial
- Não altera `PRIMARY_MODE`
- Não altera Comparator, Gateway, Bridge, ACL, Banco, Prisma, Proposal ou PDF
- Não cria novo sistema de relatórios
- Não expõe payload bruto, CPF, nome, telefone ou documentos
- Não persiste fila local; o envio é apenas em memória
