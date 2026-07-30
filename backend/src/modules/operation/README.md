# Operation Module

## Objetivo
Espaço físico inicial do módulo `Operation` no backend do FINQZ PRO.

## Responsabilidade
- Centralizar a futura execução financeira oficial do ciclo operacional.
- Servir como boundary físico para a camada de aplicação, orquestração, persistência e apresentação HTTP do domínio `Operation`.

## Dependências permitidas
- `ARCH-026` como referência principal do blueprint do módulo.
- Camadas internas do próprio módulo.
- Infraestruturas transversais já consolidadas do backend, como tenant, RBAC, auditoria, correlação e Prisma, apenas quando forem consumidas pelos subdiretórios apropriados.

## Dependências proibidas
- `Settlement`
- `Provider` persistido
- `Commission V2`
- `Opportunity` como runtime do módulo
- `commercial-governance` como dono da execução financeira
- `proposals` como runtime de operação
- `Express` como base do módulo

## Aviso
Sem implementação nesta fase.
