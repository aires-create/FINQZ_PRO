# AUD-G1-C — CRM Canonical Ownership Audit

## 1. Objetivo

Consolidar a auditoria G1-C para registrar a ownership canônica do CRM com base nas decisões arquiteturais já aprovadas e no estado real observado no código.

## 2. Escopo

Esta auditoria cobre, de forma factual:

- Customer
- Partner
- Opportunity
- Pipeline
- Coverage
- Commercial Tables
- Simulator
- telas e contratos relacionados em frontend e backend

## 3. Evidências documentais

As decisões relevantes já estão estabelecidas nos seguintes documentos:

- [ARCH-004](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-004-ENTITIES_MODEL_REVIEW_REQUIRED.md)
- [ARCH-005](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-005-RELATIONSHIPS_REVIEW_REQUIRED.md)
- [ARCH-015](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-015-FRONTEND_DOMAIN_MAP_REVIEW_REQUIRED.md)
- [ARCH-037](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-037-COMMERCIAL-STRUCTURE-OWNERSHIP-BLUEPRINT.md)
- [ARCH-039](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-039-COMMERCIAL-CATALOG-CONTRACT.md)

Pontos documentais consolidados:

- `Customer` é a fonte oficial de verdade da pessoa atendida.
- `Partner` é entidade oficial de domínio e define escopo de visibilidade para `Customer`, `Opportunity` e `Operation`.
- `Opportunity` é a entidade central do negócio.
- `Opportunity` conecta `Customer`, `Partner`, `Estrutura Comercial`, `CommercialTable`, `Provider`, `Pipeline`, `Simulation` e `Operation`.
- `Pipeline` é domínio separado e organiza o fluxo, sem substituir `Opportunity`.
- `Coverage` responde a pergunta operacional de viabilidade comercial: "posso vender?".
- `Commercial Tables` respondem às condições comerciais: "em quais condições vendo?".
- `Simulator` consome `Coverage`, `CommercialTables` e `Provider` para calcular viabilidade, retorno e melhor oferta.
- O frontend está em fase transitória e deve migrar para APIs e stores por domínio.

## 4. Matriz de ownership

| Domínio / Entidade | Owner canônico | Função canônica | Evidência documental |
|---|---|---|---|
| Customer | CRM | Identidade do cliente | ARCH-004, ARCH-005 |
| Partner | CRM | Identidade comercial/parceiro dentro do CRM | ARCH-004, ARCH-005, ARCH-015 |
| Opportunity | CRM / Commercial Operations | Entidade central que conecta cliente, parceiro e oferta | ARCH-004, ARCH-005 |
| Pipeline | Pipeline | Fluxo operacional separado | ARCH-004, ARCH-005, ARCH-039 |
| Coverage | Commercial Structure / Commercial Coverage | Responder se a venda é possível | ARCH-037, ARCH-039 |
| Commercial Tables | Commercial Structure | Definir condições comerciais | ARCH-037, ARCH-039 |
| Provider | Commercial / Offer Engine | Fornecer condições e serviços | ARCH-004, ARCH-005 |
| Simulator | Simulação | Consumir cobertura e condições para cálculo | ARCH-005, ARCH-037 |

## 5. Fronteiras de domínio

As fronteiras documentais consolidadas são estas:

- CRM é composto por `Customer` e `Partner`.
- `Customer` representa a identidade do cliente.
- `Partner` representa a identidade comercial/parceiro no contexto do CRM.
- `Opportunity` faz a ponte entre `Customer`, `Partner`, `Product/Subproduct/Modality` e `Pipeline/Stage`.
- `Pipeline` pertence ao seu próprio domínio e não é dono de `Opportunity`.
- `Coverage` e `Commercial Tables` pertencem ao domínio de Estrutura Comercial / condições comerciais.
- `Simulator` é consumidor desses domínios, não sua fonte de verdade.

## 6. NO-GO arquiteturais

Com base nas evidências auditadas, os seguintes pontos permanecem como NO-GO:

- tratar `Partner` como bounded context paralelo e isolado fora do CRM nesta fase;
- reposicionar `Opportunity` fora do centro do fluxo de negócio;
- fundir `Pipeline` com `Opportunity`;
- tratar `Coverage` como equivalente a `Commercial Tables`;
- tratar `Simulator` como fonte de verdade de cobertura ou condição;
- considerar o runtime legado de `Partner/Parceiros` como arquitetura final;
- ignorar a dependência atual do frontend em store/localStorage para o domínio Partner.

## 7. Veredito

**NO-GO para afirmar conformidade total do runtime atual com a arquitetura canônica.**

Motivo factual:

- a decisão arquitetural já existe;
- a fronteira de ownership do CRM também já existe;
- o gap atual está no runtime legado de `Partner/Parceiros`, não na ausência de decisão arquitetural;
- a implementação ainda não está consolidada em todos os pontos de frontend e backend observados.

## 8. Próxima fase recomendada

Próxima fase recomendada, de forma estritamente factual:

- reconciliar o runtime legado de `Partner/Parceiros` com o contrato arquitetural já aprovado;
- manter `Customer`, `Partner` e `Opportunity` como eixos centrais do CRM;
- preservar `Pipeline` como domínio separado;
- manter `Coverage`, `Commercial Tables` e `Simulator` como camadas/comportamentos próprios do domínio comercial;
- evitar novas teses arquiteturais enquanto a implementação ainda está em gap com o que já foi decidido.
