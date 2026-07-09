# IWP-EPC-W2-04 - Simulator Containment

## 1. Objetivo

Conter o Simulador como fronteira de consolidacao, reduzindo dependencia de estado em memoria, repositories locais e enriquecimento direto fora do contrato oficial.

## 2. Escopo permitido

- `Simulador.tsx`.
- `simulatorRepository.ts`.
- `commercialRepository.ts`.
- `catalogRepository.ts`.
- Ajustes de UX ligados a simulacao.
- Reducao de fallback local quando houver alternativa oficial.

## 3. Escopo proibido

- Backend.
- APIs.
- Contratos.
- RBAC.
- Banco.
- Prisma.
- Servicos.
- Regras de negocio.
- Testes.
- Nova fonte canonica.

## 4. Arquivos candidatos

- [src/pages/Simulador.tsx](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)
- [src/data/simulatorRepository.ts](/C:/Projects/FINQZ_PRO/src/data/simulatorRepository.ts)
- [src/data/commercialRepository.ts](/C:/Projects/FINQZ_PRO/src/data/commercialRepository.ts)
- [src/data/catalogRepository.ts](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)
- [src/config/pipelines.ts](/C:/Projects/FINQZ_PRO/src/config/pipelines.ts)
- [src/api/modules/opportunities.api.ts](/C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts)

## 5. Ordem de execucao

1. Identificar pontos de dependencia de runtime local.
2. Reduzir uso de fallback apenas onde houver caminho oficial.
3. Preservar a capacidade funcional existente.
4. Validar que o simulador nao vira owner de negocio.

## 6. Checklist de implementacao

- [ ] Estado em memoria e reduzido ao minimo necessario.
- [ ] Fallback local nao substitui contrato oficial.
- [ ] Oportunidade criada pelo simulador segue fluxo canonico.
- [ ] Dependencias de catalogo/comercial ficam explicitas.
- [ ] Nenhum contrato publica ou backend e alterado.

## 7. Checklist de validacao

- [ ] Simulador continua operante.
- [ ] Build passa.
- [ ] Testes passam.
- [ ] Fluxo de criacao de oportunidade nao quebra.
- [ ] Nao ha regressao em UX basica.

## 8. Critérios de rollback

- Reverter ajustes apenas no simulador e repositories de apoio.
- Restaurar comportamento anterior se houver perda de funcionalidade.
- Preservar outras frentes do EPC-W2.

## 9. Riscos

- Divergencia entre estado local e runtime canonico.
- Remocao excessiva de fallback quebrar jornadas ainda consumidas.
- Complexidade tecnica alta por concentrar muita composicao.

## 10. Veredito

**PARTIAL**

