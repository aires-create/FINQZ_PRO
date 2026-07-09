# Document Lifecycle

## Ciclo de vida oficial

```text
Idea
  ↓
Audit
  ↓
Plan
  ↓
Implementation
  ↓
Validation
  ↓
Operation
  ↓
Historical
```

## Estados documentais

| Estado | Definição | Quando usar |
| --- | --- | --- |
| ACTIVE | Documento em uso corrente | Blueprints, planos ativos, ADRs aceitos, runbooks atuais |
| HISTORICAL | Documento concluído, ainda rastreável | Auditorias anteriores, relatórios de encerramento, execuções finalizadas |
| DEPRECATED | Documento substituído por decisão oficial | Quando existe sucessor canônico e o antigo não deve ser usado como referência principal |
| ARCHIVED | Documento mantido apenas para auditoria e memória | Material encerrado sem uso operacional corrente |

## Critérios de mudança de estado

### De Idea para Audit

- existe problema, hipótese ou iniciativa a validar;
- o tema precisa de evidência antes de virar plano.

### De Audit para Plan

- a análise identificou lacunas, riscos ou oportunidades;
- há um caminho de execução claro.

### De Plan para Implementation

- o plano foi aprovado;
- o escopo está fechado;
- dependências e rollback estão definidos.

### De Implementation para Validation

- a implementação foi concluída;
- build, testes e smoke tests foram executados;
- evidências foram anexadas.

### De Validation para Operation

- a solução entrou em uso;
- operação normal e runbook foram aprovados.

### De Operation para Historical

- o tema foi substituído;
- existe um sucessor canônico;
- o documento passa a servir como trilha histórica.

## Regras de estado

- um documento não deve circular entre estados sem justificativa registrada;
- o estado histórico não apaga a rastreabilidade;
- deprecated significa “não usar como referência principal”, não “apagar”;
- archived significa retenção passiva para governança.

