# Document Naming Standard

## Objetivo

Padronizar nomes, prefixos, versões e convenções da documentação FINQZ PRO Enterprise.

## Prefixos oficiais

| Prefixo | Uso |
| --- | --- |
| DCA | Documento mestre / directional canonical architecture |
| PCCD | Documento de continuidade / continuity companion |
| ARCH | Arquitetura, blueprints, contratos e matrizes |
| AUD | Auditorias e rechecks |
| EPC | Programas e planos executivos de enterprise closure / readiness / go-live |
| PRP | Product / readiness programs e planos de consolidação |
| ADR | Architectural Decision Record |
| IMPL | Implementação técnica |
| GO-LIVE | Operação de liberação e execução |
| INFRA | Infraestrutura, provisioning e readiness |
| DOC | Governança documental |

## Convenção de nome

Padrão recomendado:

```text
<PREFIX>-<DOMINIO>-<NUMERO>-<SUBTEMA>-<SUFIXO>.md
```

Exemplos:

- `EPC-INFRA-01-INFRASTRUCTURE-READINESS-AUDIT.md`
- `EPC-GO-LIVE-02-DEPLOY-RUNBOOK.md`
- `ADR-003-simulation-engine-source-of-truth.md`
- `ARCH-016-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`

## Regras de versão

- use sufixo `v2`, `v3` apenas quando houver evolução real do conteúdo;
- não crie variações numéricas sem necessidade;
- prefira continuidade sobre duplicação.

## Regras de datas

- datas só devem aparecer quando forem relevantes para contextualização;
- use formato ISO ou data explícita no corpo do documento;
- não misturar múltiplos formatos no mesmo documento.

## Convenções de status

Use consistentemente:

- `GO`
- `GO WITH RESTRICTIONS`
- `NO GO`
- `READY`
- `READY WITH ACTIONS`
- `READY FOR PRODUCTION`

## Regras finais

- um documento por tema canônico;
- nomes devem refletir o domínio, não a opinião;
- evitar sinônimos para o mesmo artefato;
- evitar títulos genéricos sem prefixo ou sem propósito claro.
