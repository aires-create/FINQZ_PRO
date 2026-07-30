# Pipeline Consolidation Fixtures

This suite validates the EPC-W5-03E consolidation layer with deterministic local fixtures.

## What it exercises

- `scripts/consolidation/evidence-validator.sh`
- `scripts/consolidation/portability-validator.sh`
- `scripts/consolidation/contract-validator.sh`
- `scripts/consolidation/consolidation-report.sh`

## What it does not do

- no deploy;
- no rollback;
- no HML access;
- no production access;
- no backend or frontend rebuild for every fixture.

## Usage

```bash
tests/pipeline-consolidation/run-fixtures.sh --all
tests/pipeline-consolidation/run-fixtures.sh --fixture pass
tests/pipeline-consolidation/run-fixtures.sh --list
```

## Output

The runner writes a temporary run directory containing:

- `fixture-run-summary.json`
- `fixture-run-report.md`
- `fixture-results.json`
- `fixture-run.log`

These files are not meant to be versioned.
