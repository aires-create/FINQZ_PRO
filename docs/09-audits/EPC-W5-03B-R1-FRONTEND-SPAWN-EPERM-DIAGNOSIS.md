# EPC-W5-03B-R1 - Frontend Spawn EPERM Diagnosis

## Veredito

FRONTEND_RUNTIME_VALIDATION_BLOCKED

## Baseline

- Branch: `homologation/bootstrap-vps`
- HEAD: `cce88408a42c7816b5f5aefbfe91b22a91182f91`
- Pending push commit: `cce8840` (`docs(audit): add W5-03C-R3 live runtime validation`)
- Upstream: `origin/homologation/bootstrap-vps`
- Workspace already contained pre-existing changes and untracked audit/runbook files; they were preserved.

## Reproduction

Command executed:

```powershell
npm run dev
```

Observed result:

```text
> finqz-pro@0.0.0 dev
> vite

failed to load config from C:\Projects\FINQZ_PRO\vite.config.ts
error when starting dev server:
Error: spawn EPERM
    at ChildProcess.spawn (node:internal/child_process:441:11)
    at Object.spawn (node:child_process:796:9)
    at ensureServiceIsRunning (C:\Projects\FINQZ_PRO\node_modules\esbuild\lib\main.js:1978:29)
    at build (C:\Projects\FINQZ_PRO\node_modules\esbuild\lib\main.js:1876:26)
    at bundleConfigFile (file:///C:/Projects/FINQZ_PRO/node_modules/vite/dist/node/chunks/config.js:35806:23)
    at bundleAndLoadConfigFile (file:///C:/Projects/FINQZ_PRO/node_modules/vite/dist/node/chunks/config.js:35793:24)
    at loadConfigFromFile (file:///C:/Projects/FINQZ_PRO/node_modules/vite/dist/node/chunks/config.js:35762:179)
    at resolveConfig (file:///C:/Projects/FINQZ_PRO/node_modules/vite/dist/node/chunks/config.js:35411:28)
    at _createServer (file:///C:/Projects/FINQZ_PRO/node_modules/vite/dist/node/chunks/config.js:25361:73)
    at createServer$2 (file:///C:/Projects/FINQZ_PRO/node_modules/vite/dist/node/chunks/config.js:25358:9)
```

Execution metadata:

- PID: `20564`
- Exit code: `1`
- Duration: `~2s`
- Port opened: `no`
- Residual Vite listener: `none`

## Process and Port Check

- `Get-Process node,esbuild` showed multiple `node.exe` processes already present in the machine.
- No `esbuild.exe` process was active.
- No listener was present on ports `5173`, `5174`, or `4173`.
- The failed `npm run dev` process exited before opening a port.

## esbuild Diagnostics

- Binary found at `C:\Projects\FINQZ_PRO\node_modules\@esbuild\win32-x64\esbuild.exe`
- Size: `11365376`
- Last write: `14/06/2026 19:43:21`
- ACL: readable/executable by the current user context
- Zone.Identifier stream: not present in the inspection output
- Direct execution:

```text
0.27.2
```

Conclusion: the `esbuild` binary is present and runnable.

## Vite Diagnostics

- `package.json` script `dev` is `vite`
- Vite version: `7.3.0`
- esbuild package version: `0.27.2`
- `vite.config.ts` is simple and does not contain custom subprocess spawning
- `npx vite --host 127.0.0.1` fails with the same `spawn EPERM`

The failure occurs while Vite is loading/bundling `vite.config.ts`, inside the `esbuild` service startup path.

## Build Versus Dev

- `npm run build` passes
- `npm run dev` fails before listening on a port

Interpretation:

- build path is healthy enough to compile the app
- dev path is blocked during Vite config loading / esbuild service startup
- the problem is not a functional Opportunities defect

## Hypotheses

- F-H1 Porta ocupada: `REJECTED`
- F-H2 Processo residual bloqueando startup: `UNLIKELY`
- F-H3 esbuild.exe ausente: `REJECTED`
- F-H4 esbuild.exe bloqueado pelo Windows: `LIKELY`
- F-H5 ACL impede execução do esbuild: `POSSIBLE`
- F-H6 Zone.Identifier / MOTW bloqueia o executável: `REJECTED`
- F-H7 antivírus/Defender bloqueia child process: `LIKELY`
- F-H8 node_modules parcialmente corrompido: `POSSIBLE`
- F-H9 Node incompatível com Vite/esbuild: `REJECTED`
- F-H10 vite.config.ts contém erro funcional: `REJECTED`
- F-H11 plugin Vite dispara subprocesso proibido: `REJECTED`
- F-H12 ambiente do Codex impede spawn: `REJECTED`
- F-H13 watch mode é o diferencial: `REJECTED`
- F-H14 path com espaços ou caracteres especiais: `REJECTED`
- F-H15 build e dev usam caminhos/binários diferentes: `REJECTED`
- F-H16 reinicialização do processo resolve sem alteração: `POSSIBLE`
- F-H17 problema exige reinstalação seletiva do esbuild: `POSSIBLE`
- F-H18 problema exige npm ci completo: `INSUFFICIENT_EVIDENCE`

## Causa Mais Provável

Bloqueio local de runtime do Windows sobre o processo filho que o Vite tenta iniciar para o `esbuild` durante o carregamento da configuração.

## Menor Próximo Passo

`G. REVIEW_WINDOWS_SECURITY_POLICY`

## Conclusão Diferenciada

- `FRONTEND_RUNTIME_VALIDATION_BLOCKED`: confirmado
- `OPPORTUNITIES_FUNCTIONAL_FAILURE`: não comprovado por browser
- `PROJECT_CONFIGURATION_DEFECT`: não comprovado
- `LOCAL_MACHINE_OPERATIONAL_DEFECT`: provável
- `CODEX_EXECUTION_ENVIRONMENT_LIMITATION`: rejeitado

## Validações

- JSON parse: OK
- Mermaid: OK
- `git diff --check`: OK, com aviso preexistente de LF/CRLF em `.env.example`
- `git status`: preserva os artefatos e arquivos preexistentes sem alteração funcional

## Arquivos Criados

- `docs/09-audits/EPC-W5-03B-R1-FRONTEND-SPAWN-EPERM-DIAGNOSIS.md`
- `docs/09-audits/evidence/EPC-W5-03B-R1-FRONTEND-SPAWN-EPERM-DIAGNOSIS.json`
- `docs/09-audits/evidence/EPC-W5-03B-R1-VITE-STARTUP-FLOW.mmd`
