# FINQZ PRO — TLS Production Plan

## Objetivo

Preparar o edge NGINX do FINQZ PRO para HTTPS/TLS em producao sem ativar SSL antes da existencia de dominio e certificados validos.

Esta fase e apenas readiness. A stack local continua usando HTTP na porta 80.

## Estado Atual

* NGINX atua como reverse proxy na porta 80.
* A API continua acessivel via Docker Compose.
* `/health`, `/ready` e `/metrics` passam pelo NGINX.
* O backend Fastify opera com `trustProxy`.
* Security headers continuam sendo emitidos pelo backend para evitar duplicidade no NGINX.
* Nenhum certificado real esta presente no repositorio.

## Estrutura

```text
backend/infra/nginx/
  nginx.conf
  tls/
    TLS_PRODUCTION_PLAN.md
    nginx-tls.blueprint.conf
    ROLLOUT_CHECKLIST.md
```

## Decisao Atual

HTTPS nao sera ativado agora.

Motivos:

* ambiente local/staging ainda precisa preservar `http://localhost`
* dominio definitivo ainda nao esta configurado
* certificados reais ainda nao existem
* HSTS antes de TLS valido pode bloquear acesso indevidamente
* o objetivo desta fase e preparar, nao forcar rollout

## Estrategia de Certificados

Quando houver dominio oficial, os certificados devem ser fornecidos por uma destas abordagens:

* Let's Encrypt via ACME/Certbot
* Caddy/Traefik em uma camada de edge externa
* Cloudflare com TLS full/strict ate o origin
* certificados gerenciados por load balancer/cloud provider

Certificados e private keys devem ser montados como volumes externos ou secrets da plataforma.

Exemplo futuro:

```yaml
volumes:
  - /opt/finqz/certs:/etc/nginx/certs:ro
```

## Redirect Strategy

O redirect HTTP para HTTPS so deve ser habilitado quando:

* DNS apontar para o edge correto
* porta 443 estiver publicada
* certificado valido estiver instalado
* `/health`, `/ready`, `/metrics`, auth e rotas protegidas funcionarem via HTTPS

Blueprint futuro:

```nginx
server {
    listen 80;
    server_name app.example.com;

    location / {
        return 301 https://$host$request_uri;
    }
}
```

## HSTS Strategy

HSTS nao deve ser ativado nesta fase.

Ativar somente depois de validar HTTPS em producao real.

Exemplo futuro:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Nao usar `preload` ate existir maturidade operacional, cobertura de subdominios e plano de rollback.

## Compatibilidade Local

O arquivo ativo `nginx.conf` permanece em HTTP e continua compatível com:

```text
http://localhost/health
http://localhost/ready
http://localhost/metrics
```

## Regras de Seguranca

* Nunca versionar certificados reais.
* Nunca versionar private keys.
* Nao usar certificados fake/self-signed em producao.
* Nao duplicar security headers que ja sao emitidos pelo backend.
* Manter a API interna atras do edge no ambiente final.
* Publicar somente 80/443 no edge final.

## Meta Final

```text
Internet
  ↓
NGINX 80/443
  ↓
FINQZ API interna :4000
```

## Status

TLS production readiness documentado.
HTTPS ainda pendente de dominio, certificados validos e rollout controlado.
