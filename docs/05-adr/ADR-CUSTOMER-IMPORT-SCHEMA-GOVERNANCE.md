# ADR-CUSTOMER-IMPORT-SCHEMA-GOVERNANCE

## Status
Accepted

## 1. Contexto

Durante a UAT do módulo Clientes, foi identificado que o schema de importação precisa ser configurável por tenant, com campos obrigatórios e opcionais governados por backend.

O cenário exige:

- RBAC explícito;
- tenant isolation;
- auditoria de alterações;
- uma fonte oficial de verdade;
- consumo consistente pela tela principal de Clientes;
- ausência de hardcode de schema no frontend.

Sem essa governança, o fluxo de importação pode divergir entre interface, permissões e comportamento persistido.

## 2. Decisão

A decisão arquitetural é que o backend passa a ser a fonte oficial do schema de importação de Clientes.

Regras aprovadas:

- o frontend apenas consome o schema ativo;
- a configuração fica em `Configurações -> CRM -> Importação de Clientes`;
- o schema é persistido por tenant;
- existe exatamente um schema ativo por tenant;
- alterações geram nova versão;
- alterações geram `AuditLog`;
- importar exige `customer:import`;
- configurar schema exige `customer:import_config:update` ou `customer:admin`;
- o backend deve fornecer fallback default;
- a tela principal de Clientes consome somente o schema ativo, sem schema próprio hardcoded.

## 3. Modelo Conceitual

Entidades conceituais:

- `CustomerImportSchema`
  - identifica o schema por tenant
  - controla status, versão e publicação
- `CustomerImportSchemaField`
  - define chave, rótulo, ordem, tipo, aliases e obrigatoriedade
- `CustomerImportSchemaVersion`
  - registra o histórico imutável de mudanças

Propriedades centrais:

- um schema ativo por tenant;
- versionamento incremental;
- compatibilidade com CSV e XLSX;
- validação de cabeçalhos pelo backend;
- fallback default sempre disponível.

## 4. Endpoints Propostos

- `GET /api/v1/crm/clientes/import-schema/active`
- `GET /api/v1/crm/clientes/import-schema`
- `PUT /api/v1/crm/clientes/import-schema`
- `POST /api/v1/crm/clientes/import-schema/publish`
- `POST /api/v1/crm/clientes/import-schema/validate`

Leitura:

- o endpoint `active` atende a tela de Clientes;
- os endpoints editáveis atendem a área administrativa.

## 5. RBAC

Permissões propostas:

- `customer:import`
  - permite importar clientes e validar arquivo
- `customer:import_config:update`
  - permite editar schema, campos e publicação
- `customer:admin`
  - permite administrar e publicar schema com privilégio máximo

Regras:

- usuários sem permissão não visualizam nem acessam a configuração;
- o frontend esconde ações sem permissão;
- o backend continua sendo o enforcement definitivo.

## 6. UX

A UX aprovada segue dois níveis:

- `Clientes`
  - mostra apenas o schema ativo;
  - exibe botão de importação somente para quem tem `customer:import`;
  - valida cabeçalhos conforme contrato vindo do backend;
- `Configurações -> CRM -> Importação de Clientes`
  - exibe schema ativo e versões;
  - permite marcar campos obrigatórios/opcionais;
  - permite publicar nova versão;
  - exibe histórico e status do schema.

A experiência deve ser clara, sem expor schema administrativo a usuários sem permissão.

## 7. Fallback

Se não existir schema customizado no tenant, o backend deve retornar um schema default seguro.

Regras do fallback:

- é definido no backend;
- não depende de hardcode da tela de Clientes;
- mantém a importação funcional mesmo sem customização;
- evita bloqueio operacional na ausência de configuração local.

## 8. Auditoria

Toda alteração de schema deve gerar `AuditLog`.

Eventos esperados:

- criação de schema;
- atualização de schema;
- publicação de versão;
- ativação de schema;
- desativação de schema;
- validação de arquivo, quando relevante.

O log deve registrar:

- tenant;
- usuário;
- versão anterior;
- versão nova;
- campos alterados;
- resultado da operação.

## 9. Consequências Positivas

- backend passa a ser SSOT do schema;
- a tela de Clientes deixa de depender de regra hardcoded;
- a importação fica alinhada a RBAC e tenant isolation;
- o histórico de versões melhora governança;
- a auditoria ganha rastreabilidade de configuração;
- o risco de divergência entre frontend e backend diminui.

## 10. Trade-offs

- aumenta a responsabilidade do backend sobre configuração e versionamento;
- exige contrato estável entre administração e consumo;
- adiciona uma camada extra de governança e validação;
- requer cuidado com compatibilidade entre schemas antigos e novos.

## 11. Fora de Escopo

Esta decisão não cobre:

- implementação do backend;
- alteração de banco;
- alteração do frontend;
- migração de dados existentes;
- desenho final de componentes visuais;
- regras de negócio da importação além do contrato de schema.

## 12. Veredito

**ACCEPTED**

Esta decisão deve orientar a implementação futura do schema de importação de Clientes com backend como fonte oficial, RBAC explícito, auditoria e fallback seguro.
