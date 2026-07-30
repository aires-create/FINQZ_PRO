# SDC FASE 3.4G - Runtime Equivalence Assessment

## Contexto
O objetivo desta fase é validar a arquitetura de coleta de evidências de equivalência de runtime para o fluxo de `Simulation Runtime`, mantendo o resultado legado como referência oficial.

## Escopo
- Shadow Runtime habilitado apenas para avaliação.
- `PRIMARY_MODE` permanece desativado em `getSimulationRuntimeFlags`.
- Resultado legado continua sendo o único output oficial.
- Evidências operacionais reais ainda não estão disponíveis em volume representativo.

## Garantias de comportamento
- A coleta de evidência é não bloqueante: falha de `EvidenceStore` não impacta a experiência do usuário.
- A execução do hook gera no máximo uma evidência por ciclo de shadow runtime.
- O armazenamento em memória é um meio de suporte, não homologação oficial.
- Fixtures de teste e dados sintéticos não devem ser tratados como evidência operacional.
- Não armazenamos dados pessoais ou resultados financeiros brutos no `EvidenceStore`.

## Separação de subprodutos
- `Auto Equity` e `Home Equity` devem ser tratados como agregações independentes.
- Para esta fase, o foco é documentar ambas as trilhas sem mesclar o tratamento de evidências.

## Veredito
INSUFFICIENT_EVIDENCE

### Motivo
A infraestrutura de coleta e avaliação está aprovada, mas ainda não há volume operacional real e representativo de homologação para aprovar Canary Mode.
