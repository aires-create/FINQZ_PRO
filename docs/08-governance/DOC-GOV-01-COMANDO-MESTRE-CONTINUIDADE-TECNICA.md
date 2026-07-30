# FINQZ PRO Enterprise
## Comando Mestre de Continuidade Técnica

**Title:** Comando Mestre de Continuidade Técnica
**Document ID:** DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA
**Version:** 1.0
**Status:** ACTIVE
**Owner:** Documentation Governance Lead
**Classification:** Operational Governance Guide
**Approval Status:** PENDING
**Approved By:** PENDING
**Created Date:** 2026-07-11
**Last Updated Date:** 2026-07-11
**Supersedes:** None
**Authority Level:** Subordinate Operational Guide

---

## Metadados de Atualizacao

| Campo | Valor |
| --- | --- |
| Data de criacao | 2026-07-11 |
| Ultima atualizacao | 2026-07-11 |
| Responsavel pela atualizacao | Codex (sessao atual) |
| Motivo da atualizacao | Criacao inicial do documento oficial de continuidade tecnica |
| Documentos relacionados | [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md), [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md), [Portal de governanca documental](../08-governance/EPC-DOC-03-DOCUMENTATION-GOVERNANCE-HUB.md), [Mapa documental](../08-governance/DOCUMENT-MAP.md), [Lifecycle documental](../08-governance/DOCUMENT-LIFECYCLE.md), [Ownership documental](../08-governance/DOCUMENT-OWNERSHIP.md), [Padrao de nomes](../08-governance/DOCUMENT-NAMING-STANDARD.md), [Politica de mudanca](../08-governance/DOCUMENT-CHANGE-POLICY.md), [Runtime governance](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md), [SSOT de simulacao](../01-architecture/SDC-FASE-2-SSOT-01-SINGLE-SOURCE-OF-TRUTH.md) |
| Decisao ou ADR relacionada | [ADR-003](../05-adr/ADR-003-simulation-engine-source-of-truth.md), [ADR-004](../05-adr/ADR-004-commercial-master-catalog.md), [ADR-005](../05-adr/ADR-005-legacy-youware-backend-classification.md), [ADR-009](../05-adr/ADR-009-operation-persistence.md) |

---

> Este documento e um guia operacional subordinado.
>
> Ele nao substitui, modifica ou prevalece sobre o DCA, o PCCD, as ADRs, os documentos de arquitetura, as politicas de governanca, os runbooks oficiais ou qualquer outro artefato normativo do FINQZ PRO Enterprise.
>
> Em caso de divergencia, prevalece sempre o documento oficial de maior autoridade definido pela governanca documental.
>
> `Approval Status: PENDING` indica apenas que a validacao humana formal deste guia ainda nao foi concluida; o documento permanece `ACTIVE` para uso operacional subordinado, sem adquirir autoridade normativa.

## 1. Objetivo

Este documento orienta a retomada segura de trabalho em novos chats, novas sessoes do Codex e novos agentes de IA.

Ele funciona como complemento operacional para continuidade tecnica, com foco em:

- preservar contexto;
- evitar retrabalho e duplicidade;
- impedir alteracoes sem diagnostico;
- manter alinhamento basico entre local, Git, Docker, banco e VPS;
- indicar a proxima acao segura.

Referencias normativas: [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md), [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md), [Politica de mudanca](../08-governance/DOCUMENT-CHANGE-POLICY.md).

---

## 2. Perfil do Usuario

O usuario e iniciante em desenvolvimento e infraestrutura.

Portanto, todo agente deve:

1. informar exatamente qual terminal usar em cada comando;
2. usar as classificacoes oficiais de terminal;
3. fornecer comandos completos e prontos para copiar;
4. apresentar uma etapa segura por vez;
5. explicar o objetivo do comando em linguagem simples;
6. informar o resultado esperado;
7. aguardar resultados dependentes antes de avancar;
8. nao transferir decisoes arquiteturais complexas sem recomendacao tecnica;
9. nao presumir conhecimento avancado;
10. alertar sobre riscos antes de qualquer acao destrutiva.

### Classificacoes oficiais de terminal

- `TERMINAL — RAIZ DO PROJETO`
- `TERMINAL — BACKEND`
- `TERMINAL — FRONTEND`
- `TERMINAL — SSH DA VPS`

---

## 3. Princípios Operacionais Mínimos

Este guia apenas operacionaliza as regras já definidas no DCA, no PCCD e nas políticas de governança.

- preservar o estado antes de agir;
- trabalhar por evidência, nao por suposicao;
- diagnosticar a causa antes de corrigir;
- alterar o minimo necessario;
- reutilizar componentes oficiais antes de criar novos;
- registrar rastreabilidade das mudancas;
- manter Git, runtime, banco e VPS como camadas distintas;
- tratar divergencias como nao comprovadas ate validacao.

Referências: [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md), [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md), [Lifecycle documental](../08-governance/DOCUMENT-LIFECYCLE.md).

---

## 4. Proibições Operacionais

As proibições detalhadas continuam em [DOCUMENT-CHANGE-POLICY.md](../08-governance/DOCUMENT-CHANGE-POLICY.md) e no [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md).

O agente nao deve:

- recriar componentes sem pesquisa prévia;
- criar duplicidades de regra, contrato ou fluxo;
- alterar código antes do diagnóstico;
- tratar local, Git e VPS como se estivessem alinhados sem prova;
- executar migrations, deploy ou Git de escrita sem autorização;
- apagar artefatos por suspeita;
- inventar caminhos, branches, serviços ou aprovadores;
- revelar segredos ou credenciais;
- misturar correcao pontual com refatoracao ampla;
- enfraquecer tipagem ou esconder excecoes para contornar erro.

Referência complementar: [DOCUMENT-LIFECYCLE.md](../08-governance/DOCUMENT-LIFECYCLE.md).

---

## 5. Hierarquia de Autoridade

### 5.1 Ordem de prevalência

1. DCA mestre e PCCD.
2. ADRs e documentos de arquitetura.
3. Políticas de governança documental.
4. Este guia operacional subordinado.

### 5.2 Regra de execução

Git, runtime, banco e VPS podem divergir. Essa divergencia deve ser comprovada antes de qualquer decisao operacional.

### 5.3 Regra de producao

Producao executa release identificavel originado de commit oficial, conforme o [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md) e o [Runtime Governance](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md).

---

## 6. Ordem Obrigatória de Trabalho

Sequência operacional mínima:

> Preservar -> Ler -> Inventariar -> Comparar -> Classificar -> Diagnosticar -> Planejar -> Implementar -> Validar -> Versionar -> Homologar -> Publicar -> Monitorar -> Documentar

Os detalhes normativos de cada fase continuam nos documentos oficiais de governança, especialmente [DOCUMENT-CHANGE-POLICY.md](../08-governance/DOCUMENT-CHANGE-POLICY.md), [DOCUMENT-LIFECYCLE.md](../08-governance/DOCUMENT-LIFECYCLE.md) e [RUN-001-RUNTIME_GOVERNANCE.md](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md).

### 6.1 Etapa 0 - Preservacao do estado

- nao modificar arquivos;
- nao formatar o projeto;
- nao instalar dependencias;
- nao atualizar pacotes;
- nao executar migrations;
- nao reiniciar containers;
- nao alterar Nginx;
- nao alterar variaveis;
- nao fazer deploy;
- nao executar Git destrutivo.

### 6.2 Etapa 1 - Leitura dos documentos

Ler, quando existirem:

- SSOT;
- ultimo relatorio consolidado;
- auditorias;
- documentos de arquitetura;
- inventario de ambientes;
- auditoria de banco;
- auditoria de runtime;
- documentacao de deploy;
- ADRs;
- runbooks;
- catalogo de componentes;
- registro de legado;
- resultados forenses;
- ultimos comandos executados.

Extrair:

- fatos comprovados;
- decisoes oficiais;
- itens concluidos;
- pendencias;
- proibicoes;
- divergencias;
- riscos;
- ultimo ponto concluido;
- proxima etapa segura.

### 6.3 Etapa 2 - Estado local

Verificar:

- diretorio;
- branch;
- commit;
- status;
- arquivos modificados;
- arquivos nao rastreados;
- remotes;
- historico;
- tags;
- estrutura;
- dependencias;
- Dockerfiles;
- Compose;
- scripts;
- backend;
- frontend;
- migrations;
- documentacao.

### 6.4 Etapa 3 - Estado remoto

Verificar:

- branch oficial;
- commit remoto;
- divergencia local/remoto;
- branches antigas;
- tags;
- workflows;
- commits nao publicados;
- commits remotos ausentes localmente.

### 6.5 Etapa 4 - Estado da VPS

Inspecao forense inicial:

- diretorio do projeto;
- repositorio existente;
- branch e commit;
- alteracoes manuais;
- containers;
- imagens;
- digests;
- labels;
- volumes;
- redes;
- Compose;
- servicos systemd;
- processos;
- Nginx;
- certificados;
- portas;
- logs;
- health checks;
- cron jobs;
- PostgreSQL;
- Redis;
- filas;
- workers;
- arquivos persistentes.

Nao executar inicialmente:

- `git pull`
- `git reset`
- `git clean`
- `docker compose down`
- `docker rm`
- `docker rmi`
- `docker system prune`

### 6.6 Etapa 5 - Reconciliacao

Criar matriz comparativa entre:

- local;
- Git remoto;
- Docker;
- VPS;
- banco;
- documentacao.

### 6.7 Etapa 6 - Inventario de componentes

Antes de criar qualquer componente, pesquisar:

1. nome exato;
2. nomes semelhantes;
3. responsabilidade;
4. textos da interface;
5. imports;
6. exports;
7. consumidores;
8. rotas;
9. componentes compartilhados;
10. implementacoes legadas;
11. implementacoes parciais;
12. versoes duplicadas.

### 6.8 Etapa 7 - Classificacao do legado

Categorias:

- `OFICIAL`
- `COMPATIBILIDADE`
- `DEPRECIADO`
- `DUPLICADO`
- `ORFAO`
- `EXPERIMENTAL`
- `PROIBIDO`
- `REMOCAO CANDIDATA`

### 6.9 Etapa 8 - Diagnostico

Para qualquer problema registrar:

1. sintoma;
2. reproducao;
3. evidencia;
4. camada de origem;
5. causa provavel;
6. causa confirmada;
7. arquivos envolvidos;
8. impacto;
9. solucao minima;
10. testes;
11. risco;
12. rollback.

### 6.10 Etapa 9 - Plano de alteracao

Antes de modificar arquivos apresentar:

- Objetivo;
- Causa raiz;
- Arquivos permitidos;
- Arquivos protegidos;
- Componentes reutilizados;
- Legado afetado;
- Impacto no banco;
- Necessidade de migration;
- Testes;
- Riscos;
- Rollback.

Se nao houver migration, declarar:

> Esta intervencao nao requer migration.

### 6.11 Etapa 10 - Implementacao controlada

- alterar o minimo necessario;
- preservar contratos;
- reutilizar componentes oficiais;
- evitar refatoracao paralela;
- evitar renomeacao desnecessaria;
- nao mover arquivos por preferencia pessoal;
- nao formatar o projeto inteiro;
- nao alterar lockfile sem motivo;
- nao atualizar dependencias sem necessidade;
- nao criar abstracoes prematuras;
- nao duplicar regra de negocio;
- nao corrigir frontend com mudanca indevida no banco;
- nao corrigir aplicacao com mudanca indevida na infraestrutura;
- nao esconder erros.

### 6.12 Etapa 11 - Validacao

Executar, conforme aplicavel:

1. revisao dos arquivos;
2. lint;
3. typecheck;
4. testes unitarios;
5. testes de integracao;
6. testes de contrato;
7. build;
8. inicializacao local;
9. smoke tests;
10. teste funcional;
11. analise de logs;
12. revisao do diff.

### 6.13 Etapa 12 - Revisao do diff

Antes de versionar:

- listar arquivos alterados;
- revisar cada alteracao;
- verificar mudancas fora do escopo;
- verificar arquivos gerados;
- verificar secrets;
- verificar lockfiles;
- verificar migrations;
- verificar permissoes;
- verificar finais de linha;
- verificar formatacao massiva;
- verificar arquivos nao rastreados.

### 6.14 Etapa 13 - Banco e migrations

Antes de qualquer alteracao de banco:

- identificar banco ativo;
- identificar ORM;
- localizar migrations;
- verificar migrations aplicadas;
- comparar banco com Git;
- verificar drift;
- verificar migrations exclusivas da VPS;
- verificar alteracoes manuais do Supabase;
- verificar functions;
- verificar triggers;
- verificar policies;
- verificar views;
- verificar extensoes;
- preparar backup;
- planejar rollback;
- validar fora da producao.

Proibicoes:

- editar migration aplicada sem estrategia;
- marcar migration como aplicada sem comprovacao;
- forcar schema indiscriminadamente;
- executar reset;
- executar push destrutivo;
- alterar producao antes de homologacao.

### 6.15 Etapa 14 - Versionamento

- nao executar Git de escrita sem autorizacao;
- selecionar somente arquivos do escopo;
- evitar `git add .` quando houver arquivos nao analisados;
- criar commit pequeno e coerente;
- usar mensagem objetiva;
- nao misturar assuntos;
- validar status depois do commit;
- nao fazer push automatico sem autorizacao.

### 6.16 Etapa 15 - Homologacao

Registrar:

- branch;
- commit;
- tag ou versao;
- imagem;
- digest;
- data;
- migrations;
- ambiente;
- testes;
- responsavel;
- rollback.

### 6.17 Etapa 16 - Producao

Antes de producao confirmar:

- aprovacao;
- commit;
- imagem;
- digest;
- backup;
- migration;
- rollback;
- homologacao;
- variaveis;
- ausencia de alteracao manual;
- janela de deploy.

Depois do deploy verificar:

- container;
- imagem;
- digest;
- health;
- versao;
- logs;
- banco;
- autenticacao;
- operacao critica;
- release registrado.

---

## 7. Regra Contra Duplicidade Documental

Antes de criar qualquer novo documento com finalidade semelhante:

1. pesquisar por documentos existentes com responsabilidade parecida;
2. ler os documentos relevantes;
3. identificar se ja existe comando mestre ou protocolo de continuidade;
4. comparar o conteudo existente com a necessidade atual;
5. escolher uma acao:

### A - Documento nao existe

Criar o documento oficial no caminho recomendado:

`docs/08-governance/DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA.md`

### B - Documento equivalente ja existe

Nao criar um segundo documento.

Atualizar o documento oficial existente apenas se:

- o escopo for equivalente;
- a atualizacao preservar decisoes validas;
- o documento atual estiver incompleto;
- nao houver risco de apagar contexto historico.

### C - Documentos parciais existem

Criar o documento consolidado oficial e incluir referencias claras aos documentos complementares existentes.

---

## 8. Marco de Continuidade

Todo novo chat deve produzir primeiro um Marco de Continuidade com os pontos abaixo.

- Ultima etapa concluida;
- Data e referencia do ultimo estado conhecido;
- Documentos oficiais analisados;
- Evidencias disponiveis;
- Estado do Git local;
- Estado do Git remoto;
- Estado da VPS;
- Estado do Docker;
- Estado do banco;
- Estado das migrations;
- Estado do Supabase;
- Estado do backend;
- Estado do frontend;
- Divergencias conhecidas;
- Componentes oficiais envolvidos;
- Legados envolvidos;
- Itens congelados;
- Comandos ja executados;
- Comandos proibidos;
- Riscos atuais;
- Proxima etapa segura;
- Terminal correto.

O novo agente nao pode iniciar alteracao antes de produzir esse marco. Quando houver lacuna, registrar como nao comprovada e consultar o [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md) antes de avançar.

---

## 9. Modelo Obrigatorio de Resposta

O agente deve responder, inicialmente, no formato:

## ESTADO ATUAL

## EVIDENCIAS

## RISCO IDENTIFICADO

## PROXIMA ETAPA SEGURA

## TERMINAL CORRETO

## COMANDO

## OBJETIVO DO COMANDO

## RESULTADO ESPERADO

## NAO EXECUTAR

Quando houver dependencia entre etapas, fornecer apenas o proximo comando seguro.

---

## 10. Catalogo de Componentes

Antes de criar qualquer item novo, o agente deve confirmar se ja existe algo equivalente. A regra detalhada de reutilização continua nos documentos de arquitetura e no [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md).

- nome exato;
- nome semelhante;
- mesma responsabilidade;
- mesmos consumidores;
- mesma rota;
- mesma tela;
- mesma regra;
- mesmo contrato.

Catalogo recomendado:

| Item | Caminho oficial | Responsabilidade | Consumidores | Status | Pode ser recriado? |
| --- | --- | --- | --- | --- | --- |

Se o item ja existir, estender ou reutilizar. Se nao existir, justificar a criacao.

---

## 11. Classificacao do Legado

Antes de remover qualquer item, verificar os vínculos estáticos e dinâmicos, a configuração e os consumidores. A classificação formal do legado continua nas ADRs e nos documentos de arquitetura relacionados.

- imports estaticos;
- imports dinamicos;
- lazy loading;
- rotas;
- configuracoes;
- reflexao;
- scripts;
- jobs;
- migrations;
- banco;
- Docker;
- Nginx;
- pipelines;
- documentacao;
- integracoes externas.

Nenhum item deve ser apagado apenas por suspeita.

---

## 12. Matriz de Reconciliacao

O agente deve comparar o estado local, o Git remoto, o Docker, a VPS, o banco e a documentação. A matriz abaixo é apenas operacional.

| Elemento | Local | Git remoto | VPS | Situacao |
| --- | --- | --- | --- | --- |
| Branch |  |  |  |  |
| Commit |  |  |  |  |
| Backend |  |  |  |  |
| Frontend |  |  |  |  |
| Dockerfile |  |  |  |  |
| Compose |  |  |  |  |
| Dependencias |  |  |  |  |
| Migrations |  |  |  |  |
| Banco |  |  |  |  |
| Imagem |  |  |  |  |
| Digest |  |  |  |  |
| Container |  |  |  |  |
| Nginx |  |  |  |  |
| Variaveis |  |  |  |  |
| Documentacao |  |  |  |  |

Classificacoes permitidas:

- alinhado;
- divergente;
- ausente;
- desconhecido;
- nao versionado;
- alterado manualmente;
- legado;
- risco critico.

---

## 13. Bloco Pronto para Novos Chats

```text
COMANDO TECNICO PARA INICIO DE NOVO CHAT

Atue como Engenheiro Sênior, Arquiteto de Sistemas e Engenheiro de Plataforma responsavel pela governanca tecnica do FINQZ PRO Enterprise.

Respeite o SSOT e os documentos oficiais ja existentes. Nao recrie componentes, nao duplique responsabilidade, nao altere antes de diagnosticar e nao trate local, Git e VPS como se estivessem automaticamente alinhados.

Antes de qualquer alteracao, produza o Marco de Continuidade com:
- ultima etapa concluida;
- data e referencia do ultimo estado conhecido;
- documentos oficiais analisados;
- evidencias disponiveis;
- estado do Git local;
- estado do Git remoto;
- estado da VPS;
- estado do Docker;
- estado do banco;
- estado das migrations;
- estado do backend;
- estado do frontend;
- divergencias conhecidas;
- componentes oficiais envolvidos;
- legados envolvidos;
- itens congelados;
- comandos ja executados;
- comandos proibidos;
- riscos atuais;
- proxima etapa segura;
- terminal correto.

Use as classificacoes oficiais de terminal:
- TERMINAL — RAIZ DO PROJETO
- TERMINAL — BACKEND
- TERMINAL — FRONTEND
- TERMINAL — SSH DA VPS

Avance uma etapa segura por vez. Forneca comandos completos e prontos para copiar. Explique o objetivo do comando em linguagem simples e informe o resultado esperado antes de prosseguir.

Nao execute Git de escrita, migration, deploy, reinicio de container ou alteracao em producao sem autorizacao explicita.

Trabalhe sempre por evidencia. Registre lacunas como nao comprovadas. Separe fatos de hipoteses. Nao repita auditoria validada sem justificativa tecnica. Nao altere arquivos neste momento.

Continue exatamente do ultimo ponto comprovadamente concluido. Nao repita etapas ja validadas sem justificativa tecnica, nao altere arquivos neste momento e nao forneca multiplos comandos dependentes de uma so vez. Primeiro produza o Marco de Continuidade e indique somente a proxima acao segura.
```

---

## 14. Checklist de Transferencia

```text
CHECKLIST DE ARQUIVOS E EVIDENCIAS PARA O NOVO CHAT

- Documento oficial de continuidade tecnica
- SSOT consolidado
- Ultimo relatorio tecnico
- Ultimo Marco de Continuidade
- Ultimas auditorias
- Saidas dos ultimos comandos
- git status
- commit local
- commit remoto
- estado da VPS
- inventario Docker
- inventario do banco
- migrations
- divergencias abertas
- objetivo da proxima etapa
- lista de itens congelados
```

Nem todos os documentos precisam ser reenviados se ja estiverem acessiveis no novo contexto, mas o novo agente deve confirmar que conseguiu acessa-los.

---

## 15. Referencias Internas

- [DCA mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [Portal de governanca documental](../08-governance/EPC-DOC-03-DOCUMENTATION-GOVERNANCE-HUB.md)
- [Mapa documental](../08-governance/DOCUMENT-MAP.md)
- [Lifecycle documental](../08-governance/DOCUMENT-LIFECYCLE.md)
- [Ownership documental](../08-governance/DOCUMENT-OWNERSHIP.md)
- [Padrao de nomes](../08-governance/DOCUMENT-NAMING-STANDARD.md)
- [Politica de mudanca](../08-governance/DOCUMENT-CHANGE-POLICY.md)
- [Runbook de release](../06-release/README.md)
- [Runtime governance](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [SSOT de simulacao](../01-architecture/SDC-FASE-2-SSOT-01-SINGLE-SOURCE-OF-TRUTH.md)
- [Documento de padrao de auditoria](../00-governance/AUDIT_DOCUMENT_STANDARD.md)
- [Centro de controle documental](../00-governance/PROJECT_CONTROL_CENTER.md)
- [Auditoria de consistencia documental](../08-governance/EPC-DOC-01-DOCUMENTATION-CONSISTENCY-AUDIT.md)
- [Plano de consolidacao documental](../08-governance/EPC-DOC-02-DOCUMENTATION-CONSOLIDATION-PLAN.md)
- [Readiness de infraestrutura](../07-infrastructure/EPC-INFRA-01-INFRASTRUCTURE-READINESS-AUDIT.md)

---

## 16. Integração com README ou Índice

Se existir índice oficial adequado, referenciar este guia em [DOCUMENT-MAP.md](../08-governance/DOCUMENT-MAP.md) e em [README.md](../08-governance/README.md) em uma mudança separada, após validação.

Não atualizar índices automaticamente sem revisão humana e sem manter a subordinação explícita ao DCA e ao PCCD.

---

## 17. Criterios de Aceite

Este documento so pode ser considerado util quando:

- existir um comando mestre pronto para novo chat;
- existir o Marco de Continuidade;
- existir checklist de transferencia;
- existir classificacao de terminais;
- existir protocolo contra duplicidade;
- existir matriz de reconciliacao;
- existir regra de banco e migrations;
- existir regra de versionamento e deploy;
- existir lista de proibicoes;
- nao houver duplicidade de responsabilidade com outro documento oficial;
- nenhum codigo de aplicacao, banco, migrations, Docker ou VPS tiver sido alterado nesta intervencao.

---

## 18. Validacao Final de Uso

O primeiro comportamento esperado de um novo agente e:

1. identificar o terminal correto;
2. produzir o Marco de Continuidade;
3. ler os documentos oficiais relevantes;
4. confirmar evidencias disponiveis;
5. indicar somente a proxima acao segura;
6. manter tudo o que for destrutivo congelado ate autorizacao explicita.
