# Document Change Policy

## Objetivo

Definir regras de criação, edição, substituição, arquivamento e rastreabilidade dos documentos do FINQZ PRO Enterprise.

## Regras de criação

1. Criar somente se o tema não possuir documento canônico.
2. Definir owner antes da criação.
3. Publicar com prefixo e escopo claros.
4. Registrar relações com documentos relacionados.

## Regras de edição

1. Editar documentos ativos apenas com motivo explícito.
2. Toda mudança relevante deve preservar rastreabilidade.
3. Evitar reescrita total quando um adendo ou anexo resolver o tema.

## Regras de substituição

1. Um documento só pode substituir outro quando houver sucessor canônico.
2. O documento antigo deve receber status `DEPRECATED` ou `HISTORICAL`.
3. A referência cruzada de supersession deve ficar clara.

## Regras de arquivamento

1. Arquivar somente quando o tema estiver coberto por um sucessor claro.
2. Não apagar documentação histórica.
3. Arquivo histórico deve permanecer pesquisável.

## Regras de remoção

1. Remoção física de documento é exceção extrema.
2. Só ocorre quando houver risco legal, duplicidade estrutural grave ou erro material.
3. Requer aprovação explícita do owner e do Governance Lead.

## Regras de obsolescência

1. Obsoleto significa “não usar como referência principal”.
2. A obsolescência deve ser indicada no próprio documento ou no índice.
3. Obsolescência sem sucessor é uma falha de governança.

## Referências cruzadas

- todo documento novo deve apontar para documentos relacionados;
- documentos substituídos devem apontar para o sucessor;
- o índice mestre deve ser atualizado quando houver mudança de ownership ou status.

## Rastreabilidade

- manter IDs estáveis;
- registrar data de supersession;
- preservar histórico de decisões;
- nunca perder o vínculo entre auditoria, plano, ADR e execução.
