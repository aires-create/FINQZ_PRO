# 05 - Métricas Oficiais

## Propósito

Definir métricas oficiais que o FINQZ PRO deve acompanhar para avaliar saúde do negócio, desempenho da plataforma e qualidade do CRM/financeiro.

## Categorias de Métricas

### 1. Métricas de Negócio

- **Lead Conversion Rate**: percentual de leads convertidos em customers.
- **Opportunity Win Rate**: percentual de oportunidades ganhas versus perdidas.
- **Average Deal Size**: valor médio por oportunidade ganha.
- **Time to Close**: tempo médio entre criação de opportunity e fechamento.
- **Customer Acquisition Cost (CAC)**: custo de aquisição por novo customer.
- **Annual Recurring Revenue (ARR)**: receita anual recorrente projetada.

### 2. Métricas Operacionais de CRM

- **Leads Ativos**: número de leads com status aberto.
- **Opportunities Ativas**: quantidade de oportunidades em pipeline.
- **Active Pipeline Velocity**: movimentação média de oportunidades entre stages por período.
- **Follow-up Compliance**: percentual de atividades de follow-up concluídas no prazo.
- **Activity Coverage**: porcentagem de leads/opportunities com ao menos uma activity registrada.

### 3. Métricas de Parceiros

- **Partner Revenue Share**: receita atribuída por partner.
- **Partner Conversion Rate**: taxa de conversão de leads/opportunities por partner.
- **Partner Pipeline Health**: quantidade de oportunidades em cada stage por partner.
- **Partner Access Latency**: performance específica para usuários de partner.

### 4. Métricas Financeiras

- **Proposals Submitted**: número de bank proposals criadas.
- **Proposal Approval Rate**: percentual de propostas aprovadas.
- **Commission Payouts**: total de comissões geradas e pagas.
- **Average Funding Amount**: valor médio de proposta aprovada.
- **Disbursal Time**: tempo médio entre proposta aprovada e liberação.

### 5. Métricas de Plataforma

- **Active Tenants**: número de tenants ativos no sistema.
- **Active Users**: usuários únicos ativos por período.
- **API Error Rate**: taxa de falhas em endpoints críticos.
- **Average Response Time**: latência média das APIs principais.
- **Audit Coverage Rate**: proporção de ações sensíveis auditadas.
- **Data Isolation Score**: validação automática de consultas filtradas por tenant.

## Definições e Fórmulas

### Lead Conversion Rate
- Fórmula: `Número de Customers criados a partir de Leads / Total de Leads qualificados`.
- Uso: medir eficiência do processo de prospecção.

### Opportunity Win Rate
- Fórmula: `Oportunidades com status WON / Total de oportunidades finalizadas`.
- Uso: avaliar qualidade do funil e capacidade de fechar negócios.

### Average Deal Size
- Fórmula: `Soma do valor de oportunidades ganhas / Número de oportunidades ganhas`.
- Uso: entender ticket médio e segmentação de clientes.

### Time to Close
- Fórmula: `Data de fechamento - Data de criação da oportunidade`.
- Uso: medir agilidade comercial.

### Audit Coverage Rate
- Fórmula: `Ações auditadas / Ações sensíveis registradas`.
- Uso: garantir conformidade e detectar gaps de rastreio.

## Objetivos de Nível Enterprise

- **Lead Conversion Rate**: > 25% para segmentos maduros.
- **Opportunity Win Rate**: > 20% como baseline inicial.
- **Follow-up Compliance**: > 90% para operações críticas.
- **Audit Coverage Rate**: 100% para ações de segurança e financeiras.
- **Data Isolation Score**: 100% para todas as consultas multi-tenant.

## Uso dos Dados

- Métricas devem alimentar dashboards operacionais e de gestão.
- Relatórios periódicos devem diferenciar resultados por tenant, partner e time.
- Métricas financeiras devem ser integradas a relatórios de comissões e performance comercial.

## Observação

A métrica mais crítica para o FINQZ PRO é a combinação entre **integridade de dados** e **visibilidade do pipeline**. Uma plataforma enterprise não deve apenas medir volume, mas também qualidade e conformidade.
