# 10 - Roadmap Técnico

## Propósito

Apresentar um roadmap técnico pragmático para transformar o FINQZ PRO em uma plataforma enterprise escalável e confiável.

## Visão Geral do Roadmap

O roadmap foca em maturidade incremental, entregando primeiro a segurança e a governança, depois a consolidação de domínio e por fim a escalabilidade de plataforma.

## Fase 1 - Base de Segurança e Isolamento (2 semanas)

### Objetivo
Garantir que o sistema possa operar como plataforma SaaS sem risco de vazamento de dados e com controle de autorização sólido.

### Entregáveis
- Prisma middleware de tenant isolation.
- Backend authorization middleware com RBAC.
- Audit logging automático para ações críticas.
- Política de soft delete aplicada aos principais modelos.
- Testes de segurança de isolamento e autorização.

### Atividades
- Mapear todas as queries críticas e validar tenantId.
- Implementar middleware de autorização global.
- Definir catálogo mínimo de roles e permissions.
- Criar testes que simulam acesso cross-tenant.
- Ajustar logs para incluir contexto de tenant e usuário.

## Fase 2 - Consolidação de Domínio (2 semanas)

### Objetivo
Organizar e consolidar o modelo de CRM e financeiro, eliminando duplicidades e garantindo rastreabilidade.

### Entregáveis
- Modelo de Lead/Customer consolidado.
- Fluxo de conversão de Lead para Customer documentado e implementado.
- Pipeline e stages com transições auditáveis.
- Parâmetros de partner scope aplicados nos dados.
- Modo incremental para migração de dados existentes.

### Atividades
- Revisar schema de entidade e ajustar relacionamentos.
- Implementar conversão de Lead para Customer com histórico.
- Atualizar APIs de CRM para refletir o modelo consolidado.
- Garantir que partnerId seja usado em consultas de escopo.
- Criar testes de integração para fluxo completo.

## Fase 3 - Estrutura Enterprise (3 semanas)

### Objetivo
Reorganizar o backend em camadas, introduzir padrões de domínio e facilitar manutenção futura.

### Entregáveis
- Backend estruturado em domains/application/infrastructure/presentation.
- Repositórios com abstração por interface.
- Use cases claros e testáveis.
- Documentação de arquitetura atualizada.
- Setup de monitoramento básico de plataforma.

### Atividades
- Refatorar backend para Clean Architecture.
- Definir interfaces de repositório e implementações Prisma.
- Criar camada de aplicação para orquestrar casos de uso.
- Implementar monitoramento de métricas de API.
- Documentar padrões e convenções internas.

## Fase 4 - Escalabilidade e Observabilidade (3 semanas)

### Objetivo
Preparar a plataforma para crescimento e operar com métricas e automações robustas.

### Entregáveis
- Módulos de eventos operacionais e orquestração assíncrona.
- Dashboards de métricas de performance e saúde.
- Testes de carga básicos para endpoints críticos.
- Plano de deploy com rollback e auditoria.

### Atividades
- Implementar catálogo de eventos operacionais.
- Criar listeners para eventos financeiros e CRM.
- Configurar monitoramento de latência, erros e isolamentos.
- Executar testes de carga em rotas críticas.
- Definir plano de deploy e rollback.

## Prioridades Técnicas

1. **Segurança primeiro**: tenant isolation e auth no backend.
2. **Consolidação segundo**: eliminar duplicação de modelos e regras conflitantes.
3. **Estrutura terceiro**: organizar em camadas e interfaces.
4. **Escala último**: adicionar observabilidade e automação.

## Critérios de Sucesso

- **Zero vulnerabilidades de tenant isolation**.
- **RBAC aplicado em todas as APIs sensíveis**.
- **Lead/Customer com fluxo de conversão claro**.
- **Pipeline com stages auditáveis**.
- **Métricas de plataforma ativas**.

## Comentários Finais

Este roadmap é projetado para ser pragmático e progressivo. Ele evita overengineering no início e garante que cada fase entregue valor operacional e técnico antes de avançar para a próxima.
