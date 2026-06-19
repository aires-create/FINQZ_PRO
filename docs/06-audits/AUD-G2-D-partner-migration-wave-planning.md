# AUD-G2-D - Partner Migration Wave Planning

## 1. Objetivo

Definir a sequencia oficial de migracao do dominio `Partner`, com base nas auditorias `AUD-G1-B`, `AUD-G1-C`, `AUD-G1-D`, `AUD-G1-E`, `AUD-G2-A`, `AUD-G2-B` e `AUD-G2-C`.

## 2. Escopo

Arquivos considerados neste planejamento:

- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts)
- [backend/src/modules](C:/Projects/FINQZ_PRO/backend/src/modules)
- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts)
- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx)
- [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx)
- [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx)
- [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx)
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts)
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts)
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts)

## 3. Premissas

1. O contrato canonico de referencia e `Partner vNext` definido em `AUD-G1-E`.
2. O runtime ativo atual continua sendo o legado em `backend/server/src/index.ts`.
3. O dominio modular em `backend/src/modules/**` ja usa `partnerId` em varias areas e e o melhor ponto de partida do lado servidor.
4. `src/pages/Parceiros.tsx` e o consumidor mais acoplado a `localStorage`, `useAppStore` e reset de senha legado.
5. `LoginParceiro`, `DashboardParceiro`, `Usuarios` e `Oportunidades` sao consumidores dependentes de transicao e nao podem ser migrados antes do contrato e do client estarem estabilizados.
6. `src/types/index.ts` e `src/types/api.ts` ainda misturam formas legadas concorrentes.

## 4. Matriz de risco

| Area | Risco | Severidade | Observacao |
|---|---|---:|---|
| Prisma | `Partner` ja canonico no schema, mas o runtime nao consome esse shape | Media | O schema esta pronto, mas a trilha ainda nao. |
| Runtime legado | `backend/server/src/index.ts` usa envelope e id numerico | Alta | E o principal bloqueio de go-live. |
| Backend modular | `backend/src/modules/**` ja usa `partnerId` e tem menor acoplamento | Media | Melhor base para waves iniciais. |
| API client | `src/api/modules/parceiros.api.ts` ainda depende de contrato legado | Alta | E o ponto de entrada da UI. |
| Parceiros.tsx | CRUD, store e `localStorage` no mesmo fluxo | Alta | Maior superficie de quebra. |
| LoginParceiro | Depende do store e de credenciais locais | Alta | Quebra autenticao do parceiro. |
| DashboardParceiro | Depende de `parceiros` e `oportunidades` do store | Alta | Quebra a area do parceiro. |
| Usuarios | Depende de `partner_id` e `partner_type` legados | Media/Alta | E fortemente acoplado ao relacionamento. |
| Oportunidades | Depende de `parceiros`, `partnerId` e compatibilidade de pipeline | Media/Alta | Tem dependencias indiretas e contexto amplo. |
| Store | Mantem `initialParceiros`, CRUD local e persistencia | Alta | Fonte de verdade paralela. |
| Tipos legados | `Partner`, `Parceiro` e `ParceiroResponse` coexistem | Alta | Amplia o custo de migracao. |

## 5. Sequencia oficial recomendada

### Wave 0

**Pre-condicoes obrigatorias**

- Contrato canônico `Partner vNext` congelado.
- Lista de conversoes e fronteira de adapter formalizadas.
- Inventario de consumidores e riscos concluido.
- Nenhuma mudanca funcional ainda.

**Objetivo**

Preparar o terreno para migracao sem risco de ambiguidade.

**Artefatos**

- `AUD-G1-E`, `AUD-G2-A`, `AUD-G2-B`, `AUD-G2-C`

**Dependencias**

- Nenhuma mudanca de codigo.

**Risco**

- Baixo.

**GO / NO-GO**

- **GO** se e somente se as waves seguintes respeitarem a fronteira oficial.

**NO-GO**

- Nao iniciar nenhuma wave sem contrato canonico e fronteira de adapter definidos.

### Wave 1

**Contratos**

**Objetivo**

Congelar e estabilizar os contratos que serao referencia para toda a migracao.

**Artefatos**

- `backend/prisma/schema.prisma`
- `src/types/index.ts`
- `src/types/api.ts`

**Dependencias**

- Contrato canonico de `Partner vNext`.
- Mapeamento de campos legados e codigos de conversao.

**Risco**

- Medio, porque e onde a ambiguidade de tipos precisa ser eliminada sem alterar runtime.

**GO / NO-GO**

- **GO** se o contrato canonico ficar como referencia unica.

**NO-GO**

- Nao permitir que `Partner` numerico, `Parceiro` e `ParceiroResponse` continuem sendo tratados como equivalentes canonicos.

### Wave 2

**Adapters**

**Objetivo**

Definir e posicionar a fronteira de adaptacao entre legado e canônico.

**Artefatos**

- `src/api/modules/parceiros.api.ts`
- `backend/src/modules/**`
- `backend/server/src/index.ts`

**Dependencias**

- Wave 1 concluida.
- Contrato canonico congelado.
- Fronteira permitida de adapter formalizada.

**Risco**

- Alto, porque qualquer adaptacao mal posicionada pode propagar legado para o dominio.

**GO / NO-GO**

- **GO** apenas para adaptar nas bordas.

**NO-GO**

- Nao criar adapters no dominio canônico.
- Nao transformar `senha/login` em parte do `Partner` canônico.
- Nao deixar `children` virar fonte principal de escrita.

### Wave 3

**API Client**

**Objetivo**

Reconciliar o client de `Parceiros` com a forma canônica de consumo, ainda convivendo com legado onde necessario.

**Artefatos**

- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts)

**Dependencias**

- Wave 1 e Wave 2 concluidas.
- Runtime legado ainda operacional.

**Risco**

- Medio/alto, porque e o primeiro ponto da UI que sentira a nova fronteira.

**GO / NO-GO**

- **GO** se o client puder traduzir sem expor legado para consumidores novos.

**NO-GO**

- Nao permitir que a UI nova passe a depender de `id: number` ou envelope legado.

### Wave 4

**Parceiros.tsx**

**Objetivo**

Migrar a tela mais acoplada, substituindo dependencias locais por consumo do client estabilizado.

**Artefatos**

- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx)

**Dependencias**

- Wave 3 concluida.
- Contrato do client estabilizado.
- Fronteira de adapter ativa.

**Risco**

- Muito alto, por envolver CRUD, import/export, `localStorage` e reset de senha.

**GO / NO-GO**

- **GO** somente apos o client estar estabilizado e os fluxos de credenciais e persistencia estarem mapeados.

**NO-GO**

- Nao migrar `Parceiros.tsx` enquanto o runtime legado ainda for a unica fonte de verdade.

### Wave 5

**Consumers**

Inclui:

- `LoginParceiro`
- `DashboardParceiro`
- `Usuarios`
- `Oportunidades`

**Objetivo**

Migrar os consumidores que dependem direta ou indiretamente de `Partner`, agora apoiados por contrato e client estabilizados.

**Artefatos**

- [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx)
- [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx)
- [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx)
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)

**Dependencias**

- Waves 1 a 4 concluidas.
- Adapter de identidade e de relacionamento pronto.
- Login e dashboard sem dependencia de fonte local paralela.

**Risco**

- Alto, especialmente em `LoginParceiro` e `DashboardParceiro`.

**GO / NO-GO**

- **GO** apenas por consumidor e nunca em bloco unico.

**NO-GO**

- Nao migrar `LoginParceiro` antes do contrato de credenciais estar separado do dominio.
- Nao migrar `DashboardParceiro` sem fonte confiavel de parceiro autenticado.
- Nao migrar `Usuarios` sem resolver `partner_id` e `partner_type`.
- Nao migrar `Oportunidades` antes de estabilizar as relacoes de `partnerId` e as dependencias de pipeline.

### Wave 6

**Store Cleanup**

**Objetivo**

Remover do store tudo que nao for UI/transicao e retirar o papel de fonte operacional do parceiro.

**Artefatos**

- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts)

**Dependencias**

- Waves 1 a 5 concluidas.
- Nenhum consumidor operacional dependente de `initialParceiros` ou CRUD local.

**Risco**

- Alto, mas controlavel se todos os consumidores ja tiverem migrado.

**GO / NO-GO**

- **GO** apenas quando o store deixar de ser fonte de verdade do dominio.

**NO-GO**

- Nao remover antes de Login, Dashboard, Usuarios e Oportunidades estarem fora do store legado.

### Wave 7

**EdgeSpark Retirement**

**Objetivo**

Desligar o runtime legado de `backend/server/src/index.ts` para `Partner` e consolidar a operacao no caminho moderno.

**Artefatos**

- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts)

**Dependencias**

- Waves 1 a 6 concluidas.
- Todos os consumidores em contrato estabilizado.
- Nenhum fluxo critico dependente do envelope legado.

**Risco**

- Muito alto, porque envolve o runtime ativo de producao.

**GO / NO-GO**

- **GO** somente quando o runtime legado estiver sem consumidores residuais.

**NO-GO**

- Nao aposentar EdgeSpark enquanto o client ou as telas ainda exigirem `id: number`, envelope legado ou `reset-senha` acoplado ao runtime antigo.

## 6. Respostas obrigatorias

1. Qual artefato deve migrar primeiro?
   - `backend/prisma/schema.prisma` e `src/types/index.ts`/`src/types/api.ts` na Wave 1, porque contratos precisam estar congelados antes de qualquer runtime.

2. Qual artefato deve migrar por ultimo?
   - `backend/server/src/index.ts`, na Wave 7, porque e o runtime legado ativo e o maior risco operacional.

3. O que pode migrar sem risco?
   - A formalizacao documental da Wave 0 e a estabilizacao de contratos da Wave 1 sao as fases de menor risco.

4. O que possui alto acoplamento?
   - `src/pages/Parceiros.tsx`, `src/pages/LoginParceiro.tsx`, `src/pages/DashboardParceiro.tsx`, `src/store/index.ts` e `backend/server/src/index.ts`.

5. O que depende do store?
   - `Parceiros.tsx`, `LoginParceiro.tsx`, `DashboardParceiro.tsx`, `Usuarios.tsx`, `Oportunidades.tsx` e o proprio `src/store/index.ts` como fonte operacional.

6. O que depende do runtime EdgeSpark?
   - `src/api/modules/parceiros.api.ts`, `src/pages/Parceiros.tsx` via `reset-senha` e o runtime de `backend/server/src/index.ts`.

7. O que depende dos tipos legados?
   - `src/api/modules/parceiros.api.ts`, `src/pages/Parceiros.tsx`, `src/pages/Usuarios.tsx`, `src/types/index.ts` e `src/types/api.ts`.

8. Qual e a ordem segura de waves?
   - Wave 0 -> Wave 1 -> Wave 2 -> Wave 3 -> Wave 4 -> Wave 5 -> Wave 6 -> Wave 7.

9. Quais pre-requisitos cada wave exige?
   - Wave 0: contrato e fronteira definidos.
   - Wave 1: congelamento canonico.
   - Wave 2: fronteira de adapter aprovada.
   - Wave 3: contratos estabilizados e runtime ainda funcional.
   - Wave 4: client reconciliado.
   - Wave 5: adapters e client prontos.
   - Wave 6: consumidores migrados.
   - Wave 7: zero consumidores residuais do runtime legado.

10. O que e NO-GO em cada wave?
   - Wave 0: nao começar sem contrato canonico e fronteira.
   - Wave 1: nao tratar tipos legados como canonicos.
   - Wave 2: nao criar adapter no dominio.
   - Wave 3: nao expor UI nova ao contrato numerico.
   - Wave 4: nao migrar com `localStorage` ainda sendo a verdade operacional.
   - Wave 5: nao migrar Login, Dashboard, Usuarios ou Oportunidades em bloco e sem pre-requisitos.
   - Wave 6: nao limpar o store antes dos consumidores sairem dele.
   - Wave 7: nao aposentar EdgeSpark antes da completa retirada dos consumidores.

11. O que pode quebrar LoginParceiro?
   - Mudanca no fluxo de credenciais, remoção do store como fonte de autenticacao e qualquer mudanca no shape de `parceiros` ou `codigo/senha`.

12. O que pode quebrar DashboardParceiro?
   - Alteracao em `user.parceiroId`, troca no shape de `parceiros`, ou quebra no contexto de `oportunidades`.

13. O que pode quebrar Usuarios?
   - Mudanca em `partner_id`, `partner_type`, `parceiros` e no mapeamento do tipo de parceiro.

14. O que pode quebrar Oportunidades?
   - Alteracao em `partnerId`, `parceiros`, relacoes de CRM e compatibilidade legada de pipeline/etapas.

15. Qual e o caminho de menor risco para go-live?
   - Go-live seguro exige: contrato congelado, adapter de borda, client estabilizado, `Parceiros.tsx` migrado, consumidores migrados, store limpo e EdgeSpark aposentado por ultimo.

## 7. Sequencia oficial recomendada

1. Congelar contratos e fronteira.
2. Formalizar adapters nas bordas.
3. Reconciliar client.
4. Migrar `Parceiros.tsx`.
5. Migrar consumidores.
6. Limpar store.
7. Retirar runtime legado.

## 8. Blockers

1. Identificador ainda divergente entre UUID e numero.
2. Runtime ativo ainda expõe envelope legado.
3. `Parceiros.tsx` ainda usa `localStorage`.
4. `LoginParceiro.tsx` ainda depende de credenciais locais.
5. `DashboardParceiro.tsx` e `Usuarios.tsx` ainda dependem de shapes legados.
6. `Oportunidades.tsx` possui dependencias indiretas e grande superficie de compatibilidade.
7. Tipos legados continuam coexistindo.

## 9. Veredito

**NO-GO**

Motivos:

- a sequencia esta definida, mas as waves ainda nao podem ser executadas sem cumprir Wave 0 e Wave 1;
- o risco concentrado no runtime legado, no store e no client de parceiros continua alto;
- a migracao e segura apenas quando for feita na ordem oficial descrita acima.

## 10. Proxima fase recomendada

1. Validar formalmente a Wave 0 como gate de entrada.
2. Abrir a Wave 1 somente para congelamento contratual.
3. Preparar as waves 2 e 3 como planejamento detalhado, sem implementacao.
4. Somente depois disso, autorizar a migracao funcional por consumidores.

