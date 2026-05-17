# FINQZ PRO — TLS Readiness Strategy

## Objetivo

Documentar a estratégia de preparação HTTPS/TLS do edge NGINX sem ativar SSL prematuramente.

## Estado Atual

* API operacional via Docker Compose
* NGINX funcionando como reverse proxy na porta 80
* Fastify operando atrás de proxy confiável (`trustProxy`)
* Security headers funcionando sem duplicidade
* Health checks `/health` e `/ready` operacionais via NGINX

## Decisão Atual

TLS/HTTPS ainda NÃO será ativado nesta fase.

Motivos:

* ambiente ainda local/staging
* ausência de domínio definitivo
* ausência de certificados válidos
* evitar configuração insegura/self-signed improvisada

## Estratégia Futura

Quando houver domínio oficial:

### Porta 443

O NGINX será expandido para HTTPS/TLS utilizando:

* `listen 443 ssl`
* certificados válidos
* redirect HTTP → HTTPS

### Certificados

Os certificados serão montados via volumes Docker externos.

Exemplo futuro:

```yaml
volumes:
  - ./infra/nginx/certs:/etc/nginx/certs:ro
```

## HSTS

HSTS NÃO deve ser habilitado antes do HTTPS funcional.

Somente após TLS válido:

```nginx
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## Segurança

Regras obrigatórias:

* nunca versionar certificados reais no Git
* nunca armazenar private keys no repositório
* evitar self-signed em produção
* expor somente 80/443 no edge final

## Meta Final

Arquitetura desejada:

```text
Internet
   ↓
NGINX (80/443)
   ↓
FINQZ API
```

A porta 4000 deverá permanecer apenas interna no ambiente Docker.

## Status

TLS readiness documentado.
HTTPS ainda pendente de domínio e certificados válidos.
