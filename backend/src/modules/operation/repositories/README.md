# Operation Repositories

## Responsabilidade
- Conter o contrato de acesso a dados e a futura integração Prisma do aggregate `Operation`.

## Dependências permitidas
- `ARCH-021`
- `ARCH-026`
- Prisma somente quando houver implementação autorizada

## Dependências proibidas
- HTTP
- RBAC
- Audit
- lógica de negócio
- `Settlement`
- `Provider` persistido
- `Commission V2`

## Aviso
Sem implementação nesta fase.

