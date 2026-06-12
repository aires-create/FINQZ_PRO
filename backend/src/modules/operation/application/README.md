# Operation Application

## Responsabilidade
- Definir comandos, queries e contratos conceituais da aplicação de `Operation`.
- Orquestrar a intenção de uso sem implementar regra de negócio funcional.

## Dependências permitidas
- `ARCH-023`
- `ARCH-026`
- Domain do próprio módulo
- DTOs e contracts do próprio módulo

## Dependências proibidas
- Prisma direto
- HTTP
- `Settlement`
- `Provider` persistido
- `Commission V2`
- `Opportunity` como proxy de execução

## Aviso
Sem implementação nesta fase.

