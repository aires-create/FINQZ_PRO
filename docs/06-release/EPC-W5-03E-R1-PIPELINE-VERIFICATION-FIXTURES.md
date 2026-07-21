# EPC-W5-03E-R1 - Pipeline Verification Fixtures

## Objetivo

Criar uma suíte determinística de fixtures locais para validar o comportamento do EPC-W5-03E sem deploy, sem rollback, sem HML e sem produção.

## Semantic Remediation

A remediação original tinha um desvio semântico: o fixture `pass` era classificado como `PASS_WITH_WARNINGS` porque o builder registrava os stages de bootstrap como `SKIPPED`, e o contract validator transformava falhas funcionais em erro contratual.

Isso foi corrigido com a separação entre:

- integridade contratual;
- falha funcional conclusiva;
- evidência ausente ou inválida;
- warning permitido.

### Causa raiz

- `artifactBuild` e `releasePackage` eram simulados como `SKIPPED`, o que contaminava o baseline com warning estrutural.
- `contract-validator.sh` tratava stage `FAIL` como erro contratual e elevava o contrato para `FAIL`.
- `consolidation-report.sh` promovia qualquer `errors.length > 0` para `BLOCKED`, misturando falha funcional com bloqueio de integridade.

### Correções realizadas

- `fixture-builder.sh` passou a registrar `artifactBuild` e `releasePackage` como `PASS` com evidência sintética válida.
- `contract-validator.sh` passou a validar coerência contratual sem punir falha funcional conclusiva.
- A matriz de fixtures foi alinhada ao contrato arquitetural oficial.
- A documentação e a evidência foram atualizadas com resultados reais.

## Escopo

Arquivos adicionados ou ajustados nesta remediação:

- `tests/pipeline-consolidation/fixture-builder.sh`
- `tests/pipeline-consolidation/run-fixtures.sh`
- `tests/pipeline-consolidation/fixture-assertions.sh`
- `tests/pipeline-consolidation/fixtures/*/fixture.json`
- `scripts/consolidation/contract-validator.sh`
- `scripts/consolidation/consolidation-report.sh`
- este documento
- a evidência JSON associada

Os scripts de consolidação existentes foram reutilizados e validados:

- `scripts/consolidation/evidence-validator.sh`
- `scripts/consolidation/portability-validator.sh`

## Como a suíte funciona

1. O builder cria um run root isolado por fixture.
2. O artefato do fixture é sintético, determinístico e suficiente para os validadores locais.
3. Os validadores reais são executados sobre o run root do fixture.
4. O relatório de consolidação real gera o summary final.
5. O fixture `blocked-invalid-json` usa uma verificação direta de parse inválido, porque reexecutar o validator de evidências pisaria no arquivo corrompido e esconderia o problema.

## Resultado da execução

- status da suite: `PASS`
- total de fixtures: `12`
- distribuição:
  - `PASS`: `1`
  - `PASS_WITH_WARNINGS`: `1`
  - `FAIL`: `4`
  - `BLOCKED`: `6`

### Matriz validada

- `pass`: `PASS`
- `pass-with-warnings`: `PASS_WITH_WARNINGS`
- `fail-checksum`: `FAIL`
- `fail-runtime`: `FAIL`
- `fail-gate`: `FAIL`
- `blocked-missing-evidence`: `BLOCKED`
- `blocked-invalid-contract`: `BLOCKED`
- `blocked-unknown-status`: `BLOCKED`
- `blocked-invalid-json`: `BLOCKED`
- `blocked-correlation-mismatch`: `BLOCKED`
- `skipped-without-reason`: `BLOCKED`
- `strict-warning`: `FAIL`

## Diferença entre FAIL e BLOCKED

`FAIL` indica uma falha funcional conclusiva com evidência válida:

- checksum divergente;
- runtime validation falhou;
- release gate negou a promoção.

`BLOCKED` indica impossibilidade de decidir com segurança:

- evidência ausente;
- JSON inválido;
- correlação divergente;
- status desconhecido;
- SKIPPED sem justificativa;
- contrato incoerente.

## Riscos residuais

- A expectativa dos fixtures depende da semântica atual dos scripts de consolidação. Se a política de warnings ou de summary mudar, os fixtures devem ser atualizados junto.
- O artefato sintético não é um tarball de release real; ele é suficiente para os validadores locais atuais, mas não substitui um pacote operacional.
- O caso `blocked-invalid-json` depende de uma verificação direta de parse, porque o validator real reescreveria o arquivo de saída se fosse executado.

## Fora de escopo

- revogação server-side de access token permanece fora de escopo nesta rodada.
- não houve alteração de banco, Redis, Nginx, contrato público de API ou TTL de JWT.
- não houve deploy, commit, push ou staging.

## Testes de Regressão

Executados com sucesso:

- `tests/pipeline-consolidation/run-fixtures.sh --fixture pass`
- `tests/pipeline-consolidation/run-fixtures.sh --fixture pass-with-warnings`
- `tests/pipeline-consolidation/run-fixtures.sh --fixture fail-checksum`
- `tests/pipeline-consolidation/run-fixtures.sh --fixture fail-runtime`
- `tests/pipeline-consolidation/run-fixtures.sh --fixture fail-gate`
- `tests/pipeline-consolidation/run-fixtures.sh --all`

## Revalidação HML

Antes de promover esta matriz para HML, recomendo:

1. Executar os mesmos fixtures no ambiente de integração.
2. Confirmar que `FAIL` permanece reservado para falha funcional conclusiva.
3. Confirmar que `BLOCKED` continua reservado para integridade insuficiente.
4. Revalidar a geração do report final com artefatos reais de release.
