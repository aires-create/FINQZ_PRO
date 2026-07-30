# HANDMAIS Provider Audit (Enterprise)

## A. Provider Audit Summary
- Provider alvo: `handmais`
- Tipo sugerido: `LOAN_PROVIDER`
- Vertical sugerida: `CLT_PRIVATE_CONSIGNMENT`
- Objetivo de negócio: esteira CLT privado / crédito do trabalhador.
- Situação atual no FINQZ PRO:
  - Catalogado como `hand-plus` em capabilities (planned), sem provider runtime ativo.
  - Não está no `providerRegistry` operacional em `integrations.module.ts`.
- Evidência externa disponível nesta auditoria:
  - Referência oficial fornecida: https://documenter.getpostman.com/view/30574153/2sB3WvNe4R
  - Snapshot público da coleção no Postman com indicação de fluxo Dataprev -> simulação -> proposta:
    - https://www.postman.com/galactic-sunset-201900/clt-hand-v2/collection/92urfii/clt-handmais-v2
- Limitação desta sessão:
  - Não foi possível extrair o conteúdo completo dinâmico do Postman (bloqueio de acesso no ambiente), então parte do mapeamento abaixo está com `confidence: medium/low` e marcada para validação assistida.

## B. Endpoint Matrix
Legenda de confiança:
- `high`: confirmado por documentação acessível nesta sessão
- `medium`: padrão de mercado + evidência parcial
- `low`: hipótese de onboarding, precisa confirmação no Postman oficial

| Capability alvo | Endpoint esperado (nome funcional) | Método esperado | Finalidade | Confidence |
|---|---|---|---|---|
| margin-consult | consulta margem Dataprev/empregador | `POST`/`GET` | elegibilidade e margem disponível | medium |
| simulation | simulação de proposta | `POST` | valor, prazo, parcela, CET | medium |
| proposal-submit | criação/envio de proposta | `POST` | abertura de proposta CLT | medium |
| proposal-status | consulta status proposta | `GET` | polling de lifecycle | medium |
| contract | geração/consulta contrato | `POST`/`GET` | contrato e formalização | low |
| disbursement-status | status de liberação/pagamento | `GET` | etapa pós-averbação | low |
| webhook-events | callback de eventos | `POST` inbound | status assíncrono | low |
| cancellation | cancelamento proposta/contrato | `POST`/`PATCH` | desistência/cancelamento | low |
| refinance | refinanciamento | `POST` | nova condição sobre contrato | low |
| portability | portabilidade | `POST` | migração de dívida | low |
| documents | upload/consulta documentos | `POST`/`GET` | KYC/compliance operacional | low |

Observação:
- A sequência Dataprev -> simulação -> proposta é tratada como evidência parcial confirmada da esteira.

## C. Payload Matrix
Campos esperados por domínio (base para contrato canônico FINQZ; validar naming exato no Postman):

| Domínio | Campos esperados | Sensibilidade |
|---|---|---|
| Identidade | `cpf`, `nome`, `dataNascimento` | alto |
| Vínculo CLT | `matricula`, `employer`/`empresa`, `cnpjEmpregador`, `tipoVinculo` | alto |
| Margem | `margemDisponivel`, `margemComprometida`, `salarioBase` | alto |
| Simulação | `valorSolicitado`, `prazo`, `parcela`, `taxa`, `cet` | médio |
| Proposta | `proposalId`, `externalReference`, `status`, `motivo` | médio |
| Contrato | `contractId`, `dataAssinatura`, `termo`, `hash` | alto |
| Operacional | `requestId`, `correlationId`, `timestamp`, `codigoRetorno` | baixo |

Regras de segurança obrigatórias no runtime FINQZ:
- Nunca logar CPF completo.
- Nunca logar tokens/chaves.
- Sanitizar payload/erros/headers via `provider-sanitizer`.

## D. Status/Lifecycle Matrix
Lifecycle alvo sugerido para o adapter canônico:

| Fase HANDMAIS (esperada) | Status canônico FINQZ |
|---|---|
| proposta criada | `CREATED` |
| análise | `UNDER_REVIEW` |
| pendência documental | `PENDING_DOCUMENTS` |
| formalização | `FORMALIZATION` |
| averbação | `REGISTERING` |
| pago/liberado | `DISBURSED` / `COMPLETED` |
| cancelado | `CANCELED` |
| rejeitado | `REJECTED` |

Nota:
- Mapas finais de status devem incluir `confidence` e `rawStatus`.

## E. Webhook Matrix
Eventos esperados para governança:

| Evento | Uso no runtime | Requisitos |
|---|---|---|
| proposal.updated | atualização de status | assinatura + idempotência |
| proposal.rejected | fechamento com erro de negócio | motivo sanitizado |
| contract.signed | avanço para formalização concluída | correlação por externalReference |
| disbursement.completed | conciliação de pagamento | sem payload sensível bruto |
| proposal.canceled | rollback operacional | auditoria de motivo |

Políticas obrigatórias:
- Verificação de assinatura webhook (HMAC ou equivalente do provider).
- Retry controlado no emissor/receptor (idempotente).
- Deduplicação por `eventId` + `externalReference`.

## F. Runtime Requirements
- Timeout inicial sugerido: 15s a 30s por operação síncrona.
- Retry policy:
  - Retryable: `429`, `5xx`, timeout transitório.
  - Non-retryable: `400`, `401`, `403`, `404`, validação de negócio.
- Backoff: exponencial + jitter.
- Correlation:
  - `requestId` obrigatório no `ProviderExecutionContext`.
  - Propagar `providerKey`, `capability`, `operation`.
- Observabilidade:
  - `ProviderHealthTracker` com `ok/degraded/down/disabled`.
  - Snapshot por capability.
  - Diagnostics sem payload bruto sensível.

## G. Suggested Capability Registry
Recomendação de mapeamento para entrada oficial (sem implementar agora):

- `providerKey`: `handmais`
- `providerType`: `LOAN_PROVIDER`
- `vertical`: `CLT_PRIVATE_CONSIGNMENT`
- `capabilities`:
  - `margin-consult`
  - `simulation`
  - `proposal-submit`
  - `proposal-status`
  - `webhook-events`
  - `contract`
  - `disbursement-status`

Compatibilização com registry atual FINQZ:
- `margin-consult` -> `marginInquiry`
- `simulation` -> `rateTables` (temporário) ou capability nova no roadmap
- `proposal-submit/proposal-status` -> `proposalPipeline`
- `webhook-events` -> `webhooks`
- `disbursement-status` -> pode coexistir com `commissions`/financeiro, sem payout direto.

## H. Suggested Diagnostics
Diagnósticos mínimos para operação segura:
- `auth`: token válido/expiração/configuração.
- `margin`: disponibilidade e latência.
- `simulation`: sucesso de cálculo e retorno consistente.
- `proposal-submit`: aceite de proposta + external ID.
- `proposal-status`: consistência de status e reason codes.
- `webhook`: assinatura válida + idempotência.
- `contract/disbursement-status`: consistência de fase final.

Métricas mínimas:
- taxa de sucesso por capability
- p95/p99 latência
- erros por código sanitizado
- retries acionados
- backlog de eventos webhook

## I. Risks
1. Divergência de contrato real HANDMAIS vs contrato presumido sem extração completa da doc.
2. Mistura de nomenclatura (`hand-plus` atual vs `handmais` desejado) pode gerar duplicidade no catálogo.
3. Falta de definição formal de webhook signing/idempotência.
4. Dependência de status assíncrono sem scheduler/persistência pode limitar rastreabilidade.
5. Risco de expor dados sensíveis se metadata não for sanitizada desde o início.

## J. P0 / P1 / P2
### P0
- Confirmar endpoint-level spec diretamente com HANDMAIS (método, payload, auth, erros).
- Fechar contrato de autenticação e expiração de token.
- Definir status mapping oficial (raw -> canônico) com confidence.

### P1
- Definir contrato de webhook (assinatura, retries, replay protection).
- Definir matriz de códigos de erro e política de retry por endpoint.
- Alinhar `providerKey` único no catálogo enterprise (`handmais`).

### P2
- Planejar capacidade avançada (refinanciamento, portabilidade, documentos).
- Evoluir para diagnósticos operacionais e painéis runtime.

## K. Safe Onboarding Strategy
1. Fase contrato:
   - validar documentação endpoint a endpoint com HANDMAIS.
2. Fase runtime foundation:
   - capability registry + context + retry + health tracking.
3. Fase leitura controlada:
   - margin/simulation/status sem efeitos financeiros.
4. Fase proposta controlada:
   - proposal-submit com idempotência e observabilidade.
5. Fase assíncrona:
   - webhook events com assinatura e dedupe.
6. Fase endurecimento:
   - SLO, alertas, auditoria e runbook operacional.

## Comparação com Providers Atuais (FINQZ)
- `sos-bolso`:
  - já opera esteira de propostas e mapping canônico; referência para status mapper e payload diagnostics.
- `sos-bolso`:
  - referência para margem/auth flow e uso de runtime governance no HTTP client.
- `bluepay`:
  - referência para idempotência e financial execution runtime em modo seguro/dry-run.

Conclusão comparativa:
- HANDMAIS deve entrar no mesmo padrão de provider-first canonical governance, sem camada paralela e sem bypass de runtime.

## Evidências usadas
- Referência oficial fornecida para auditoria:
  - https://documenter.getpostman.com/view/30574153/2sB3WvNe4R
- Coleção pública correlata (evidência parcial de fluxo):
  - https://www.postman.com/galactic-sunset-201900/clt-hand-v2/collection/92urfii/clt-handmais-v2
- Código local FINQZ (provider engine/capabilities):
  - `backend/src/modules/integrations/application/provider-capability-registry.ts`
  - `backend/src/modules/integrations/application/list-provider-capabilities.use-case.ts`
  - `backend/src/modules/integrations/integrations.module.ts`
