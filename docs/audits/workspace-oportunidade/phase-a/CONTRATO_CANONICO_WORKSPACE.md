# Contrato Canônico da Workspace

## Nome escolhido

`OpportunityWorkspaceViewModel`

## Estrutura

### Identidade

- `id`
- `displayId`
- `leadId`
- `opportunityId`
- `customerId`
- `pipelineId`
- `stageId`

### Dados persistidos

- `clienteNome`
- `produto`
- `responsavelNome`
- `valor`
- `origem`
- `status`
- `observacoes`
- `telefone`
- `email`
- `tags`
- `createdAt`
- `updatedAt`

### Dados derivados

- `stageLabel`
- `pipelineLabel`
- `formattedValue`
- `displayName`
- `initials`

### Dados locais temporários

- Estado de abertura do modal
- Aba ativa
- Loading
- Erro de sincronização
- Rascunhos não persistidos

## Regras do contrato

- `id` nunca deve ser substituído por `displayId`.
- `displayId` nunca deve expor UUID cru.
- `stageId` é o identificador operacional.
- `stageLabel` é apenas apresentação.
- Dados derivados não entram em payload de escrita.
- `api.updateOportunidade` recebe ID numérico validado.
- Falha remota não confirma commit local.
- UUID ou `displayId` inválido não devem ser tratados como ID remoto.

## Normalização

- O contrato é preenchido por `normalizeOpportunityWorkspace`.
- Stage é resolvido por ordem determinística.
- Pipeline usa label contextual quando disponível.
- Fallback local permanece explícito.
