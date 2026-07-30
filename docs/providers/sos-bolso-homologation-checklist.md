# SOS BOLSO Homologation Checklist

## Objetivo

Preparar e conduzir o primeiro teste real de homologacao do provider SOS BOLSO no FINQZ PRO com seguranca operacional, rastreabilidade e criterio claro de sucesso/falha, sem alteracao de contrato publico e sem expansao de escopo funcional.

## Escopo da homologacao

- Validar OAuth (token endpoint)
- Validar consulta de margem (margin inquiry)
- Validar normalizacao de resposta no fluxo FINQZ
- Validar logs e rastreio por request-id
- Validar health tracker e diagnostico de falhas

## Variaveis obrigatorias

As variaveis abaixo sao obrigatorias para homologacao real quando `SOS_BOLSO_ENABLED=true`:

- `SOS_BOLSO_ENABLED` (manter `false` por padrao no repositorio)
- `SOS_BOLSO_BASE_URL`
- `SOS_BOLSO_TOKEN_PATH`
- `SOS_BOLSO_MARGIN_PATH`
- `SOS_BOLSO_CLIENT_ID`
- `SOS_BOLSO_CLIENT_SECRET`

## Variaveis opcionais

- `SOS_BOLSO_TIMEOUT_MS` (fallback no client: `5000ms`)
- `SOS_BOLSO_SIGNED_JWT` (legado/opcional; preferir `CLIENT_ID/CLIENT_SECRET`)

## Campos que nunca devem ser commitados

- `SOS_BOLSO_CLIENT_ID` real
- `SOS_BOLSO_CLIENT_SECRET` real
- `SOS_BOLSO_SIGNED_JWT` real
- qualquer token de acesso/refresh retornado no OAuth
- payloads com dados sensiveis de cliente sem mascaramento

## Pre-flight (antes do teste real)

1. Garantir ambiente de homologacao isolado (sem trafego de producao).
2. Confirmar que `SOS_BOLSO_ENABLED` esta habilitado somente no ambiente de homologacao (nunca por padrao no repositorio).
3. Confirmar que `SOS_BOLSO_BASE_URL`, `SOS_BOLSO_TOKEN_PATH` e `SOS_BOLSO_MARGIN_PATH` vieram do parceiro.
4. Confirmar credenciais validas (`CLIENT_ID` e `CLIENT_SECRET`).
5. Definir timeout operacional inicial (`SOS_BOLSO_TIMEOUT_MS`, recomendado iniciar com 5000-8000ms em homolog).
6. Definir `requestId` de rastreio para cada execucao de teste.
7. Confirmar observabilidade ativa (logs + health tracker + metricas de provider request).

## Durante o teste real

1. Executar teste de conectividade/auth (`testConnection`) no fluxo oficial.
2. Executar consulta de margem com payload minimo valido.
3. Repetir consulta para validar reutilizacao de token cacheado.
4. Simular pelo menos um cenario de erro controlado (ex.: credencial invalida em janela de teste) para validar tratamento.
5. Coletar evidencias: status HTTP, durationMs, codigos de erro sanitizados, request-id e status do health tracker.

## Validacao de token OAuth

Esperado:

- POST no endpoint de token
- retorno com `access_token` e `expires_in` valido
- cache de token ativo (`TokenManager`) sem refresh desnecessario enquanto token valido
- em erro 401/403: classificacao de autenticacao

## Validacao de consulta de margem

Esperado:

- POST no endpoint de margem com `Authorization: Bearer <token>` e `X-Request-ID`
- envio de:
  - `cnpj_convenio`
  - `cpf_cliente`
  - `matricula_cliente`
- retorno normalizado para:
  - `providerKey: "sos-bolso"`
  - `availableMargin` numerico
  - `currency: "BRL"`

## Payload minimo esperado

Entrada FINQZ (minima):

```json
{
  "document": "12345678901",
  "metadata": {
    "convenioCnpj": "12345678000190",
    "enrollmentId": "98765",
    "requestId": "req-hmlg-001"
  }
}
```

Payload enviado ao parceiro (normalizado):

```json
{
  "cnpj_convenio": "12345678000190",
  "cpf_cliente": "12345678901",
  "matricula_cliente": "98765"
}
```

## Resposta minima esperada

```json
{
  "providerKey": "sos-bolso",
  "availableMargin": 0,
  "currency": "BRL"
}
```

## Logs esperados

- `Provider health check completed` ou `Provider health check failed`
- `Provider margin inquiry completed` ou `Provider margin inquiry failed`
- Campos-chave:
  - `providerKey`
  - `durationMs`
  - `requestId` (quando fornecido)
  - `errorCode` (sanitizado em falha)
- CPF deve permanecer mascarado nos logs de service.

## Request-id / tracing

- Cada chamada de homologacao deve transportar `requestId` unico.
- Header esperado para saida ao parceiro: `X-Request-ID`.
- O mesmo `requestId` deve aparecer em logs e contexto de runtime.

## Health tracker

Validar transicoes por capability:

- `authentication`: `ok`, `degraded`, `down`
- `marginInquiry`: `ok`, `degraded`, `down`

Coletar:

- `lastLatencyMs`
- `lastSuccessAt`
- `lastFailureAt`
- `sanitizedErrorCode`

## Rollback operacional

Se o teste falhar:

1. Desativar integracao no ambiente (`SOS_BOLSO_ENABLED=false`).
2. Revogar credenciais/token no parceiro, se aplicavel.
3. Preservar logs e evidencias para analise.
4. Reabrir teste somente apos corrigir causa-raiz.

## Criterios de sucesso

- Token OAuth obtido com sucesso.
- Consulta de margem retorna resposta normalizada consistente.
- Retry/timeout e tratamento de erro observados conforme esperado.
- Request-id propagado de ponta a ponta.
- Health tracker registrando status e latencia.

## Criterios de falha

- Falha recorrente de autenticacao.
- Timeout recorrente sem recuperacao.
- Payload de resposta do parceiro incompatível com normalizacao minima.
- Ausencia de rastreabilidade por request-id.
- Falta de evidencias operacionais (logs/health).

## Checklist final (READY/PARTIAL/MISSING)

| Item | Status | Observacao |
| --- | --- | --- |
| Configuracao de env de homolog | PARTIAL | Estrutura pronta; depende inserir credenciais reais fora do repo |
| Credenciais de homolog | MISSING | Deve vir do parceiro/secret manager |
| Endpoint OAuth validado | MISSING | Pendente teste real |
| Endpoint margin validado | MISSING | Pendente teste real |
| Token cache validado em homolog | PARTIAL | Coberto em teste local; falta evidencia externa |
| Error handling validado em homolog | PARTIAL | Coberto em testes; falta cenario real |
| Request-id/tracing fim a fim | PARTIAL | Implementado; falta evidencia de homolog |
| Health tracker operacional | PARTIAL | Implementado; falta coleta em execucao real |
| Monitoramento/alerting de homolog | MISSING | Definir regra operacional |
| Rollback operacional documentado | READY | Procedimento definido acima |

## Drift conhecido (catalogo x implementacao)

No catalogo atual (`provider-catalog.ts`), `sos-bolso.marginInquiry` permanece como `planned`.
Implementacao de `marginInquiry` ja existe em client/service/use-case.

Decisao atual:

- **Nao alterar nesta fase**.
- Reavaliar para `active/true` somente apos evidencia de homologacao real concluida.
