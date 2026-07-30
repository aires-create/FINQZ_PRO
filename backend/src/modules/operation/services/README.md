# Operation Services

## Responsabilidade
- Coordenar a camada de aplicação e a orquestração do módulo `Operation`.
- Servir como superfície de composição para casos de uso futuros.

## Dependências permitidas
- `ARCH-023`
- `ARCH-024`
- `ARCH-026`
- Application do próprio módulo
- Orchestration do próprio módulo

## Dependências proibidas
- CRUD completo
- regra financeira
- `Settlement`
- `Provider` persistido
- `Commission V2`
- `Opportunity` como executor

## Aviso
Sem implementação nesta fase.
