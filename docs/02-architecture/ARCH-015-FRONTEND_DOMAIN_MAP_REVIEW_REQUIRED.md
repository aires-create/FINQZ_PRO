# FINQZ PRO — Frontend Domain Map

Status: DRAFT
Version: 0.2
Last Updated: 2026-06-03

## Objetivo

Documento oficial para mapear o estado do frontend e a estratégia de organização de estado por domínios, alinhado à arquitetura oficial consolidada (`ARCH-003`). O frontend é orquestrador e consumidor de APIs, não fonte de verdade operacional.

## Princípios de Arquitetura Frontend

- **Backend-first**: frontend consome APIs oficiais (`/api/v1/*`).
- **Server state**: dados operacionais residem no backend; frontend mantém cache/UI state.
- **No business logic**: regras de negócio são definidas e executadas no backend.
- **Frontend as orchestrator**: frontend coordena fluxos de usuário e renderização.
- **Gradual migration**: transição do store monolítico ocorre incrementalmente por domínio.

## Diagnóstico Atual

O frontend possui um store global principal:

```txt
src/store/index.ts
```

Este arquivo concentra estado híbrido: UI, autenticação, CRM, parceiros, financeiro, pipeline, permissões e dados mockados. O estado é parcialmente local-first e parcialmente híbrido, representando uma fase transitória de migração.

## Status do Store Monolítico

**Classificação**: Legado Transitório.

O store monolítico não deve receber novos domínios. Refatoração ocorre incrementalmente, por domínio, migrando para consumo direto de APIs backend.

## Domínios Oficiais e Mapeamento Frontend

Cada domínio de backend (`ARCH-003`) deve ter correspondência no frontend organizado como store separado ou integração com API direto.

| Domínio | Backend | Estado Frontend | Direção Futura | Prioridade |
|---|---|---|---|---|
| Auth/Session | `/api/v1/auth` | híbrido/Zustand | store/auth dedicado | 1 |
| UI | local | Zustand OK | manter store/ui | - |
| Clientes | `/api/v1/customers` | monolítico/local | API + store/customers | 5 |
| Parceiros | `/api/v1/partners` | crítico/monolítico | API + store/partners | 2 |
| Estrutura Comercial | `/api/v1/commercial/structure` | híbrido/catalogRepository | API + store/commercial-structure | 6 |
| Tabelas Comerciais | `/api/v1/commercial/tables` | híbrido/commercialRepository | API + store/commercial-tables | 6 |
| Providers | `/api/v1/providers` | parcial/local | API + store/providers | 7 |
| Oportunidades | `/api/v1/opportunities` | monolítico/local | API + store/opportunities | 4 |
| Pipeline | `/api/v1/pipeline` | local-first | API + store/pipeline | 7 |
| Simulação | `/api/v1/simulations` | local-first | API + store/simulation | 8 |
| Operações | `/api/v1/operations` | não existe | criar store/operations | 8 |
| Comissões | `/api/v1/commissions` | local/financeiro | API + store/commissions | 7 |
| Governança/RBAC | `/api/v1/governance` | duplicado/local | API + store/rbac | 3 |
| Relatórios/Dashboard | `/api/v1/reports` | agregado/local | API + store/reports | 9 |

## Domínios Descontinuados

### Products / Produtos

**Status**: Descontinuado conforme `ADR-006`.

- `state.produtos` foi removido.
- Referências legadas `Produtos.tsx`, `produtosApi` foram desativadas.
- O conceito de Product permanece parte do domínio `Estrutura Comercial`, não como domínio isolado.
- Nenhuma nova funcionalidade deve usar `state.produtos` ou reintroduzir módulo de Produtos.

## Domínios Congelados

Os seguintes domínios existem no legado/frontend mas não fazem parte da arquitetura ativa. Sem ADR explícita, não devem receber novos desenvolvimentos.

### Conversas
- Estado: congelado
- Motivo: fora do escopo de comercial/operacional atual
- Ação: sem refatoração até decisão futura

### Campanhas
- Estado: congelado
- Motivo: fora do escopo de comercial/operacional atual
- Ação: sem refatoração até decisão futura

### Audiências
- Estado: congelado
- Motivo: fora do escopo de comercial/operacional atual
- Ação: sem refatoração até decisão futura

### Eventos
- Estado: congelado
- Motivo: fora do escopo de comercial/operacional atual
- Ação: sem refatoração até decisão futura

### SDR IA
- Estado: congelado
- Motivo: experimento/paralelo, não oficializado
- Ação: sem integração ao core até decisão futura

---

## Prioridade de Migração

1. **Auth/Session**: Consolidar em store/auth com backend `/api/v1/auth`.
2. **Parceiros**: Migrar para API + store/partners.
3. **Governança/RBAC**: Backend-first, eliminar duplicação frontend.
4. **Oportunidades**: Migrar para API + store/opportunities.
5. **Clientes**: Migrar para API + store/customers.
6. **Estrutura Comercial / Tabelas Comerciais**: Consolidar API + store/commercial-structure e store/commercial-tables.
7. **Providers / Pipeline / Comissões**: Migrar para APIs respectivas.
8. **Simulação**: Criar store/simulation com API.
9. **Operações**: Criar store/operations com API.
10. **Relatórios/Dashboard**: Centralizar em store/reports.

## Estratégia de Migração

A arquitetura alvo separará domínios do store monolítico:

```txt
src/store/auth/
src/store/ui/
src/store/customers/
src/store/partners/
src/store/commercial-structure/
src/store/commercial-tables/
src/store/providers/
src/store/opportunities/
src/store/pipeline/
src/store/simulation/
src/store/operations/
src/store/commissions/
src/store/rbac/
src/store/reports/
```

Cada store comunicará com `/api/v1/{domain}` do backend, eliminando dados mockados e local-first.

## Padrão de Integração

### Frontend Atual (Legado Transitório)

```
store/index.ts (monolítico)
  ├─ UI state (local)
  ├─ Auth (híbrido)
  ├─ CRM/Customers (mock + local)
  ├─ Partners (mock + local)
  ├─ Commercial (mock + local)
  ├─ Financial (local)
  ├─ Pipeline (local)
  └─ Permissions (local duplicado)
```

### Frontend Futuro (Alinhado)

```
store/{domain}/ (separado por domínio)
  └─ Query API → /api/v1/{domain}
       ├─ Customers
       ├─ Partners
       ├─ Oportunidades
       ├─ Pipeline
       ├─ Operations
       ├─ Commissions
       ├─ Commercial (Estrutura + Tabelas)
       ├─ Providers
       ├─ Simulation
       ├─ Auth
       └─ RBAC
```

## Mapeamento de Compatibilidade Transitória

| Artifact Legado | Status | Ação |
|---|---|---|
| `creditPfCatalog` | transitório | manter para compatibilidade; descontinuar em favor de API |
| `catalogRepository` | transitório | suporta compatibilidade; migrar consumidores para API |
| `commercialRepository` | transitório | suporta compatibilidade; migrar consumidores para API |
| `state.produtos` | removido | `ADR-006` |
| `EstruturaComercial.tsx` | ativo | mapear para `/api/v1/commercial/structure` |
| `Oportunidades.tsx` | ativo | mapear para `/api/v1/opportunities` |
| `Simulador.tsx` | ativo | mapear para `/api/v1/simulations` |
| `TabelasComerciais.tsx` | ativo | mapear para `/api/v1/commercial/tables` |

## Regras de Desenvolvimento

1. **Nenhum novo estado monolítico**: domínios novos devem seguir padrão de store separado.
2. **Nenhum mock permanente**: dados mockados são transitórios para desenvolvimento; descontinuar em produção.
3. **Backend como fonte de verdade**: frontend valida, UI state, não regras de negócio.
4. **Separação clara de responsabilidades**: UI state, cache e orquestração no frontend; regras e persistência no backend.
5. **ADR obrigatório**: novos domínios requerem ADR antes de implementação.

## Status

**Fase atual**: Reorganização arquitetural e mapeamento de alinhamento.

**Proximos passos**:
- Validar mapeamento com proprietários de backend.
- Definir sequência de migração com Product Manager.
- Criar ADRs para decisões de armazenamento de estado.
- Iniciar migração com domínio Auth (prioridade 1).