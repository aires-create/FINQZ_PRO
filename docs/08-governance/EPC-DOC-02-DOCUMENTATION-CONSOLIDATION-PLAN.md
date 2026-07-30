# EPC-DOC-02 - Documentation Consolidation Plan

## 1. Objetivo

Definir a consolidação segura da documentação do FINQZ PRO Enterprise, reduzindo sobreposições sem perder rastreabilidade histórica.

## 2. Grupos que podem ser unificados

| Grupo | Documentos atuais | Documento canônico sugerido | Observação |
| --- | --- | --- | --- |
| Master continuity | `DCA-FINQZ-PRO-ENTERPRISE-v2.md`, `PCCD-FINQZ-PRO-ENTERPRISE.md`, `FINQZ-EOS-*` | `DCA` + `PCCD` como núcleo de continuidade | EOS fica como arquitetura de base; não precisa ser reescrito toda vez |
| Opportunity / Workspace | `ARCH-016`, `ARCH-017`, `ARCH-018`, `ARCH-019`, `ARCH-059`, `ARCH-060`, `ARCH-061`, `ARCH-062`, `ARCH-063`, `AUD-EPC-W2-5`, `AUD-EWT-CROSS` | `ARCH-016` ou successor canônico de Workspace | Os demais viram apêndices, matrizes ou histórico |
| Master Catalog | `ARCH-040..055`, `ADR-004`, `H19/H20` | `ARCH-040` + `ARCH-039` + `ADR-004` | Persistência, contrato e rollout ficam em camadas, não em múltiplos textos paralelos |
| Partner Acquisition | `ARCH-068..073`, `H19B-1`, `H19-COMPLETION-REPORT` | `ARCH-068` + `ARCH-073` | Os demais viram suporte de migração e histórico |
| Pipeline / Stage | `ARCH-056`, `ARCH-067`, `H15-*`, `PIPELINE-*` | `ARCH-056` + `PIPELINE-CLOSURE-*` | Separar pipeline canon + plano de transição |
| Simulator / Decision | `ADR-003`, `ADR-007`, `AUD-W0`, `AUD-EWT-CROSS`, `AUD-EPC-W2-5` | `ADR-003` + auditoria de convergência atual | Mantém o cálculo como verdade e o UX como camada contextual |
| Legacy removal chain | `EPC-W2-B`..`L` | `EPC-W2-D` + `EPC-W2-I` + `EPC-W2-L` | Os demais passam a histórico da execução |
| Release operations | `EPC-GO-LIVE-01`..`03C` | `README.md` + `01` + `02` + `03` + `03A` + `03B` | `03C` vira relatório de encerramento da normalização |
| Infrastructure readiness | `EPC-INFRA-01`..`03` | `EPC-INFRA-01` + `EPC-INFRA-03` | `02` pode ser mantido apenas como ponte de gaps |

## 3. Ordem segura de consolidação

### Fase 1 - Canonicalização de leitura

1. Definir um documento canônico por domínio.
2. Adicionar no topo dos documentos secundários um aviso de `supporting`, `historical` ou `superseded by`.
3. Criar índice mestre e links cruzados.

### Fase 2 - Compactação temática

1. Workspace / Opportunity.
2. Master Catalog.
3. Partner Acquisition.
4. Pipeline / Stage.
5. Simulator / Decision.
6. Legacy removal chain.
7. Release operations.
8. Infrastructure readiness.

### Fase 3 - Arquivamento controlado

1. Mover relatórios concluídos para seção histórica.
2. Manter ADRs e masters como referências permanentes.
3. Reduzir documentos duplicados de auditoria e plano.

## 4. Riscos

| Risco | Descrição | Mitigação |
| --- | --- | --- |
| Quebra de rastreabilidade | Um documento antigo pode ainda ser citado por outros artefatos | Manter links de supersession e seção de histórico |
| Perda de contexto | Consolidação excessiva pode apagar decisões importantes | Preservar ADRs e relatórios de fechamento |
| Confusão de fonte canônica | Dois docs podem disputar o mesmo tema | Definir um canônico por tema e um índice mestre |
| Overwriting de histórico | O processo pode transformar histórico em ruído | Separar histórico, canon e suportes |
| Nomenclatura inconsistente | GO/READY/RESTRICTIONS usados de forma diferente | Normalizar estados no índice mestre |

## 5. Impacto nas referências

- As referências internas devem apontar para o documento canônico.
- Documentos secundários devem usar uma linha clara de supersession.
- O arquivo histórico permanece acessível para auditoria.
- Nenhum arquivo deve ser excluído nesta fase.

## 6. Estratégia de migração sem perda de rastreabilidade

1. **Mapear o canônico** por tema antes de alterar qualquer documento.
2. **Adicionar referências cruzadas** entre o canônico e os suportes.
3. **Marcar os secundários** com status explícito.
4. **Arquivar apenas depois** de existir um substituto canônico consolidado.
5. **Preservar IDs e nomenclatura** para facilitar busca histórica.
6. **Evitar reescrita total** de documentos já auditados; prefira anexos, resumos e supersession notes.

## 7. Estrutura recomendada do futuro índice mestre

```text
docs/
  00-master/        - Verdade oficial do programa
  02-architecture/  - Contratos e blueprints canônicos
  03-audits/        - Auditorias e rechecks
  04-plans/         - Planos de execução e corte
  05-adr/           - Decisões aceitas
  06-release/       - Operação de release e go-live
  07-infrastructure/ - Readiness e provisionamento
  08-governance/    - Governança documental e consolidação
```

## 8. Critério de pronto

- Existe um documento canônico por tema.
- Todos os suportes têm vínculo explícito com o canônico.
- Os documentos históricos estão identificados.
- As séries repetidas foram reduzidas ou agrupadas.
- Nenhum arquivo foi perdido ou apagado.

## 9. Veredito final

**READY WITH ACTIONS**

Há consolidação clara a ser feita, mas ela pode ocorrer por fases sem risco para rastreabilidade. O plano acima é suficiente para iniciar a governança documental controlada.
