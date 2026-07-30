# Operation Domain

## Responsabilidade
- Guardar o lifecycle conceitual de `Operation`.
- Conter regras e invariantes do agregado.
- Centralizar erros de domínio e validações puras.

## Dependências permitidas
- `ARCH-026`
- `ADR-009`
- Contratos internos do próprio módulo

## Dependências proibidas
- Prisma
- HTTP
- RBAC concreto
- Audit concreto
- `Settlement`
- `Provider` persistido
- `Commission V2`

## Aviso
Sem implementação nesta fase.
