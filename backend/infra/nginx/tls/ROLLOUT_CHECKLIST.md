# FINQZ PRO — TLS Rollout Checklist

## Pre-requisitos

* Dominio oficial definido.
* DNS apontando para o edge correto.
* Porta 443 liberada no ambiente.
* Certificados validos disponiveis fora do Git.
* Private keys protegidas fora do repositorio.
* Plano de rollback documentado.
* Janela de validacao aprovada.

## Antes de Ativar HTTPS

* Confirmar que `nginx.conf` atual continua funcionando em HTTP.
* Confirmar `/health` via NGINX.
* Confirmar `/ready` via NGINX.
* Confirmar `/metrics` via NGINX.
* Confirmar auth/login via NGINX.
* Confirmar rotas protegidas via NGINX.
* Confirmar Swagger via NGINX, se exposto no ambiente.
* Confirmar que security headers nao aparecem duplicados.

## Ativacao Inicial

* Montar certificados reais via volume externo ou secret da plataforma.
* Publicar porta 443 no edge.
* Usar blueprint `nginx-tls.blueprint.conf` como referencia.
* Validar sintaxe do NGINX antes de trocar config ativa.
* Subir NGINX com HTTPS sem redirect obrigatorio no primeiro passo.
* Validar `curl -I https://<dominio>/health`.
* Validar `curl https://<dominio>/ready`.
* Validar `curl https://<dominio>/metrics`.

## Redirect HTTP para HTTPS

* Ativar redirect somente depois que HTTPS estiver validado.
* Confirmar que ACME challenge nao foi quebrado, se Let's Encrypt for usado.
* Confirmar que `http://<dominio>/health` redireciona corretamente.
* Confirmar que clientes internos nao dependem de HTTP direto.

## HSTS

* Nao ativar HSTS no primeiro deploy de HTTPS.
* Ativar somente apos estabilidade operacional.
* Comecar sem `preload`.
* Confirmar cobertura de subdominios antes de `includeSubDomains`.
* Registrar decisao e janela de rollback.

## Validacao Pos-Rollout

* `/health` retorna 200 via HTTPS.
* `/ready` retorna 200 via HTTPS.
* `/metrics` retorna 200 via HTTPS.
* API nao expõe porta publica direta em producao final.
* NGINX esta healthy.
* API esta healthy.
* Logs nao expõem secrets.
* Security headers seguem sem duplicidade.
* Certificados nao foram versionados.

## Go / No-Go

Go:

* Certificado valido.
* DNS correto.
* Health, ready e metrics OK via HTTPS.
* Auth e rotas protegidas OK via HTTPS.
* Rollback testado.

No-Go:

* certificado ausente, expirado ou self-signed em producao
* porta 443 indisponivel
* redirect quebrando endpoints
* HSTS ativado sem HTTPS validado
* security headers duplicados
* secrets ou private keys no repositorio

## Status

Checklist preparado.
Rollout TLS ainda nao executado.
