# 09 - Padrões Frontend

## Propósito

Definir padrões do frontend do FINQZ PRO para entregar experiência enterprise sem substituir as garantias de segurança do backend.

## Princípios Fundamentais

- **UI como orquestrador**: interface apresenta dados e direciona ações, mas não valida regras de negócio.
- **Defesa em profundidade**: o frontend deve proteger a experiência, mas o backend valida a autorização.
- **Performance escalável**: priorizar lazy loading, roteamento e quebra de bundle.
- **Consistência visual**: componentes reutilizáveis e padrão de design unificado.

## Estrutura Recomendada

### Organização de Módulos
- Pages e rotas por domínio: CRM, Financeiro, Parceiros, Configuração.
- Componentes compartilhados para formulários, tabelas, modais e alertas.
- Serviços de dados centralizados para chamada de APIs e cache local.

### Gerenciamento de Estado
- Uso de store leve e específica para sessão, permissões e contexto de tenant.
- Evitar estado global excessivo.
- Preferir hooks por domínio para encapsular lógica de UI.

### Autorização na Interface
- O frontend deve usar permissões apenas para exibir/ocultar ações.
- A lógica de habilitação deve ser auxiliar, não definitiva.
- Exemplo: esconder botão `Excluir` e também verificar backend no endpoint.

### UX para SaaS Financeiro
- Dashboard com indicadores operacionais claros.
- Forms com validação inline e feedback rápido.
- Navegação com filtros de tenant, partner e pipeline.
- Exibição de dados sensíveis com nível de acesso controlado.

## Boas Práticas de Consumo de API

- Sempre tratar erros de API de forma centralizada.
- Não assumir respostas perfeitas: validar payloads antes de usar.
- Usar loading states e mensagens consistentes para operações de long running.
- Evitar requests desnecessários; implementar cache local quando adequado.

## Comunicação com Backend

- O frontend consome APIs REST com contratos claros.
- Requests devem incluir contexto de tenant e usuário no token.
- O frontend não deve expor detalhes internos de autorização.

## Padrões de Desenvolvimento

### Componentes Reutilizáveis
- Cards, tabelas, formulários e modais devem ser reutilizáveis.
- Separar componentes de apresentação de componentes com lógica.

### Testes
- Testes unitários para componentes complexos.
- Testes de integração para fluxos críticos.
- Testes de smoke para páginas de CRM e financeiro.

### Acessibilidade
- Priorizar acessibilidade básica: labels, focus, contraste.
- Mesmo em ambiente interno, interfaces enterprise devem ser acessíveis.

## Observação

O frontend do FINQZ PRO deve ser robusto e produtivo, mas não deve tentar substituir o backend. O valor real está em experiência e visibilidade, enquanto a segurança e a governança permanecem no servidor.
