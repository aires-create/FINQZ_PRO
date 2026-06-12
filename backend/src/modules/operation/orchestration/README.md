# Operation Orchestration

## Responsabilidade
- Definir estratégia conceitual de handlers, transações, idempotência, auditoria, correlação e publicação de eventos.

## Dependências permitidas
- `ARCH-024`
- `ARCH-026`
- Application do próprio módulo
- Domain do próprio módulo

## Dependências proibidas
- Handlers reais
- SQL
- Prisma fora do repository
- Rotas
- `Settlement`
- `Provider` persistido
- `Commission V2`

## Aviso
Sem implementação nesta fase.

