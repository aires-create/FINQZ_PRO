# FINQZ PRO — API Exposure Plan

## Estado atual

A API ainda está exposta diretamente via Docker Compose:

```yaml
ports:
  - "4000:4000"
```

O NGINX também está exposto na porta 80:

```yaml
ports:
  - "80:80"
```

## Decisão atual

Manter temporariamente a porta 4000 exposta para validação local e smoke tests.

## Objetivo futuro

Em ambiente de produção real, a API não deverá expor porta pública diretamente.

A entrada pública deve ser:

```text
Internet
  ↓
NGINX 80/443
  ↓
API interna :4000
```

## Mudança futura

Remover da API:

```yaml
ports:
  - "4000:4000"
```

E, se necessário, substituir por:

```yaml
expose:
  - "4000"
```

## Critério antes da remoção

A porta 4000 só deve ser removida quando:

* health via NGINX estiver validado
* ready via NGINX estiver validado
* auth/login via NGINX estiver validado
* rotas protegidas via NGINX estiverem validadas
* logs/audit via NGINX estiverem validados
* Swagger via NGINX estiver validado
* ambiente de produção/staging estiver usando NGINX como edge

## Status

Remoção planejada, ainda não executada.
