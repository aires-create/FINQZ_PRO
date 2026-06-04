# 04 - Regras Operacionais

## Propósito

Consolidar regras operacionais que guiam o comportamento do sistema em ambiente SaaS financeiro e CRM enterprise. Estas regras devem ser claras, pragmáticas e aplicáveis em backend e operações.

## Regra 1 - Isolamento Multi-Tenant

- Todos os dados operacionais devem ser sempre filtrados por `tenantId`.
- Nenhuma consulta deve retornar resultados sem contexto de tenant.
- As operações administrativas podem usar escopo global apenas em camadas de sistema.
- A separação de dados é um requisito de compliance.

## Regra 2 - Escopo de Partner

- Usuários de parceiro só devem ver dados do próprio partner e descendentes.
- Parceiros não devem acessar dados de parceiros irmãos ou superiores.
- A visibilidade deve ser aplicada no backend em todas as requisições de CRM, venda e financeiro.

## Regra 3 - Lead como Fonte de Verdade Inicial

- Um Lead representa o primeiro contato.
- Dados básicos de contato e origem devem ser registrados no Lead.
- Leads devem ser qualificados antes de gerar propostas financeiras.
- Leads podem ser convertidos em Customer mantendo a referência histórica.

## Regra 4 - Customer como Estado Qualificado

- Customer representa um cliente ativo ou potencial validado.
- Só deve existir um Customer por CPF/email dentro do mesmo tenant.
- Um Customer pode ser criado diretamente ou por conversão de Lead.
- O histórico de conversão deve ser preservado.

## Regra 5 - Pipeline e Estágios

- O pipeline é configurável por tenant.
- Cada pipeline utiliza stages ordenados com probabilidades de fechamento.
- Uma opportunity deve ter um stage ativo e transições registradas.
- Estágios finais devem ser definidos explicitamente (`won`, `lost`).

## Regra 6 - Atividades como Registro Operacional

- Todas as interações com leads, clientes e oportunidades devem ser registradas como Activities.
- Activities devem incluir tipo, data, status e responsável.
- Atividades abertas podem ser usadas para follow-up e SLA.

## Regra 7 - Propostas Financeiras e Comissões

- Propostas de crédito são geradas a partir de oportunidades qualificadas.
- Cada proposta deve conter produto, valor, prazo e taxa.
- Comissões são calculadas após aprovação da proposta.
- O cálculo deve ser rastreável até a opportunity e ao partner.

## Regra 8 - RBAC Operacional

- A autorização é obrigatória no backend.
- O frontend só deve expor UI condicional, mas nunca confiar nisso como único controle.
- Roles e permissions devem cobrir módulos: CRM, finance, partner management, admin.
- A regra de acesso deve considerar tenant, partner e role.

## Regra 9 - Soft Delete e Retenção

- Dados operacionais devem usar `deletedAt` em vez de exclusão física.
- Registros financeiros podem usar exclusões físicas apenas em casos especiais aprovados.
- A retenção deve ser gerenciável por tenant via políticas de GDPR/LGPD.

## Regra 10 - Auditoria e Traceability

- Eventos sensíveis devem ser registrados em `AuditLog`.
- Auditoria deve incluir usuário, timestamp, entidade e payload.
- Logs de auditoria não podem ser modificados.
- A consulta de auditoria deve permitir histórico por tenant.

## Regra 11 - Integração Incremental

- Novos recursos devem ser implementados como extensões de domínios existentes.
- A arquitetura deve permitir crescimento incremental sem refatoração massiva.
- Cada novo módulo deve ter fronteiras bem definidas e contrato de API claro.

## Regra 12 - Experiência de Usuário Empresarial

- Operações críticas devem ter confirmação explícita.
- Dados de clientes e oportunidades devem ser apresentados com contexto de partner e status.
- Erros devem ser descritivos e acionáveis, não genéricos.

## Observações

- Regra operacional não é implementação de código, mas deve ser traduzida em validações de backend.
- A disciplina nestas regras é o que garante que o FINQZ PRO seja percebido como plataforma enterprise.
