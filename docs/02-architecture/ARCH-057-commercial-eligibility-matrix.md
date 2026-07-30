# ARCH-057 - Commercial Eligibility Matrix

Status: PROPOSED

## 1. Contexto

O Master Catalog foi consolidado como domínio canônico para descrever a oferta comercial oficial do FINQZ PRO.

As decisões já aprovadas e consolidadas indicam que:

- `Segment` é independente de `Product`;
- `Product -> Subproduct -> Modality` é a hierarquia oficial do Master Catalog;
- `Master Catalog` é a fonte oficial para `Segment`, `Product`, `Subproduct` e `Modality`;
- `Eligibility` não deve ser incorporada ao catálogo mestre como se fosse parte estrutural da hierarquia;
- `CommercialTable` e `CommercialCondition` são domínios operacionais, não catálogo mestre;
- `Provider` é domínio adjacente e tradutor operacional, não catálogo;
- `Opportunity` consome catálogo e regras, mas não é owner deles.

Na operação de negócio, existe uma lacuna conceitual:

- ao clicar em um `Segment`, o produto precisa responder o que aquele segmento habilita;
- a resposta esperada pode depender de `Provider`, `CommercialTable`, regras comerciais e vigência;
- o catálogo mestre, por si só, não representa essa semântica de permissão;
- a hierarquia atual não deve ser forçada para representar elegibilidade.

Este documento propõe a direção arquitetural para resolver essa lacuna sem corromper o Master Catalog.

## 2. Problema

O modelo atual do Master Catalog responde à estrutura comercial canônica, mas não responde sozinho às perguntas de elegibilidade comercial por segmento.

Hoje não existe uma modelagem oficial que responda de forma explícita:

- quais `Products` são elegíveis para um `Segment`;
- quais `Subproducts` são elegíveis para um `Segment` e `Product`;
- quais `Modalities` podem operar em determinado contexto;
- se a elegibilidade depende de `Provider`;
- se a elegibilidade depende de `CommercialTable` ou regra vigente;
- qual regra vence quando mais de uma fonte influencia a decisão.

Isso cria um risco arquitetural:

- transformar relacionamento comercial em vínculo estrutural falso;
- misturar catálogo mestre com regra mutável;
- reintroduzir heurísticas de negócio no frontend;
- duplicar lógica em `CommercialTable`, `Provider` ou `Opportunity`.

## 3. Decisão

A direção arquitetural recomendada é criar um domínio adjacente de elegibilidade comercial, representado por uma **Eligibility Matrix** e sustentado por uma **Commercial Rule Layer**.

Essa camada deve:

- preservar o Master Catalog como fonte canônica de catálogo;
- representar permissão e aplicabilidade comercial por contexto;
- permitir variação por `tenant`, `segment`, `product`, `subproduct`, `modality`, `provider` e `commercialTable`;
- ser auditável e versionável;
- evitar que elegibilidade seja tratada como hierarquia do catálogo.

O Master Catalog permanece responsável por:

- descrever a oferta comercial;
- manter a hierarquia `Product -> Subproduct -> Modality`;
- manter `Segment` como dimensão paralela independente.

## 4. Opções Consideradas

### 4.1 Product.segmentId

Adicionar `segmentId` em `Product` criaria uma relação estrutural direta entre `Segment` e `Product`.

### 4.2 SegmentProduct N:N

Criar uma tabela de relacionamento direta entre `Segment` e `Product`.

### 4.3 Eligibility Matrix

Criar uma matriz de elegibilidade que relacione contexto comercial com permissões e restrições.

### 4.4 Commercial Rule Layer

Criar uma camada de regras comerciais que determine elegibilidade com base em condições e contexto.

## 5. Opções Rejeitadas e Motivo

### 5.1 Product.segmentId - Rejeitada

Motivos:

- contradiz os documentos oficiais que definem `Segment` como independente;
- converte `Segment` em pai estrutural indireto de `Product`;
- não resolve elegibilidade por `Provider`, `CommercialTable` ou vigência;
- fixa uma relação 1:N que pode não refletir a realidade comercial;
- mistura taxonomia com regra de negócio.

### 5.2 SegmentProduct N:N - Rejeitada como solução final

Motivos:

- resolve apenas associação estrutural básica;
- não expressa prioridade, vigência, escopo de provider ou restrições comerciais;
- não diferencia elegibilidade simples de regra contextual;
- sem camada adicional, vira uma lista solta de vínculos sem semântica suficiente.

### 5.3 Commercial Rule Layer isolada - Rejeitada como solução única

Motivos:

- regras sozinhas, sem matriz explícita, ficam difíceis de consultar e auditar;
- a camada de regra precisa de um modelo de relacionamento para ser previsível;
- sem matriz, o resultado pode virar lógica distribuída e opaca.

## 6. Modelo Recomendado

O modelo recomendado é composto por duas partes:

1. **Eligibility Matrix**
   - armazena a relação elegível entre contexto e escopo comercial;
   - permite consultas previsíveis;
   - funciona como base consultável para API e UI.

2. **Commercial Rule Layer**
   - interpreta regras mutáveis;
   - resolve prioridades, vigência e exceções;
   - aplica critérios adicionais por `Provider` e `CommercialTable`.

### Grão conceitual recomendado

Uma entrada da matriz pode representar:

- `tenantId`
- `segmentId`
- `productId`
- `subproductId`
- `modalityId`
- `providerId` opcional
- `commercialTableId` opcional
- `status`
- `validFrom`
- `validTo`
- `priority`
- `constraints` ou `rules` em formato estruturado
- metadados de auditoria

### Princípios do modelo

- `Segment` continua independente;
- `Product` continua sendo a raiz da hierarquia operacional;
- elegibilidade não altera a hierarquia oficial do Master Catalog;
- regras mutáveis não devem morar no catálogo mestre;
- o resultado da elegibilidade deve ser auditável e explicável.

## 7. Ownership

### Master Catalog

Owner de:

- `Segment`
- `Product`
- `Subproduct`
- `Modality`

### Commercial Rules / Eligibility

Owner de:

- Eligibility Matrix;
- regras de aplicabilidade;
- prioridade;
- vigência;
- restrições;
- exceções por contexto.

### Provider Engine

Owner de:

- traduções operacionais;
- informações de suporte a oferta;
- contribuições para regra, quando aplicável.

Não é owner do catálogo nem da matriz final de elegibilidade.

### CommercialTable

Owner de:

- parametrização comercial;
- condições operacionais;
- preços, coeficientes, prazos e regras correlatas ao contrato operacional.

Não é owner do Master Catalog nem da elegibilidade canônica.

### Opportunity

Consumer de:

- catálogo;
- elegibilidade;
- condições comerciais;
- contexto operacional.

Não é owner de nenhuma dessas decisões.

## 8. Impacto Futuro em Schema

Uma implementação futura pode exigir:

- nova tabela principal de elegibilidade;
- tabelas auxiliares para regras ou exceções, se JSON não for suficiente;
- índices por `tenantId`, `segmentId`, `productId`, `subproductId`, `modalityId`, `providerId`, `status` e vigência;
- trilha de auditoria para mudanças de regra;
- controle de versionamento de regras.

Não há autorização para alterar o schema nesta fase.

## 9. Impacto Futuro em API

Uma API futura pode expor endpoints como:

- `GET /api/v1/commercial-eligibility/segments/:segmentId`
- `GET /api/v1/commercial-eligibility/segments/:segmentId/products`
- `GET /api/v1/commercial-eligibility/segments/:segmentId/products/:productId/subproducts`
- `GET /api/v1/commercial-eligibility/segments/:segmentId/products/:productId/subproducts/:subproductId/modalities`
- `GET /api/v1/commercial-eligibility/matrix`

Essa API deve ser separada do Master Catalog para evitar confusão entre catálogo e regra.

## 10. Impacto Futuro em Frontend

O frontend futuro pode:

- mostrar o que um segmento habilita;
- exibir produtos elegíveis;
- detalhar subprodutos e modalidades permitidas;
- indicar se há dependência de provider ou condição comercial;
- exibir explicação da regra aplicada.

Isso não deve ser resolvido por vínculo estrutural falso no catálogo.

## 11. Riscos

- duplicar funcionalidade de `CommercialTable`;
- misturar catálogo com regra comercial mutável;
- permitir que `Provider` dite o catálogo;
- hardcode de regras no frontend;
- criar relação `Segment -> Product` como se fosse hierarquia oficial;
- tornar a lógica de elegibilidade opaca e difícil de auditar;
- criar drift entre regras de negócio, catálogo e operação.

## 12. Não Objetivos Desta Fase

Esta fase não:

- cria migration;
- altera schema;
- altera backend;
- altera frontend;
- altera Master Catalog API;
- altera `CommercialTable`;
- altera `CommercialCondition`;
- altera `Provider`;
- altera `Opportunity`;
- implementa matriz de elegibilidade;
- implementa engine de regras;
- implementa consultas ou endpoints.

## 13. Status

PROPOSED
