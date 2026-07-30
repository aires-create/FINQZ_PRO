# Master Roadmap Synchronization

## Status
Canonical

## Purpose
Este documento define a relacao oficial entre o Documento Mestre e o DCA do EDP.

## Governing Documents

- [Documento Mestre](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [DCA EDP](DCA-ENTERPRISE-DECISION-PLATFORM-v1.md)

## Answers

### Qual documento governa o roadmap macro?

O Documento Mestre governa o roadmap macro da plataforma FINQZ PRO Enterprise.

### Qual documento governa o roadmap do EDP?

O DCA do EDP governa o roadmap especifico do Enterprise Decision Platform.

### Qual a relacao oficial entre ambos?

O roadmap do EDP e um subconjunto estrategico da plataforma, mas possui governanca propria dentro do seu bounded context.

### Existe precedencia?

Sim:

- o Documento Mestre tem precedencia sobre direcao macro da plataforma;
- o DCA do EDP tem precedencia sobre decisao interna do dominio EDP.

### Existe dependencia?

Sim:

- o EDP depende dos principios e restricoes macro do Documento Mestre;
- o Documento Mestre depende do EDP para consolidar a camada de decisao estrategica.

### Existe sincronizacao obrigatoria?

Sim:

- toda mudanca de roadmap do EDP deve ser refletida no panorama macro;
- toda mudanca macro que afete EDP deve ser refletida no DCA do EDP;
- divergencias precisam de revisao arquitetural.

### Como futuras fases devem atualizar ambos?

- fases macro devem atualizar o Documento Mestre;
- fases especificas do EDP devem atualizar o DCA do EDP;
- mudancas de governanca compartilhada devem ser espelhadas nos dois documentos;
- nenhum roadmap pode evoluir isoladamente quando houver impacto interdominio.

## Roadmap Relation

### Documento Mestre

Foca na continuidade da plataforma, priorizando a visao macro de dominios oficiais e ondas de produto.

### DCA do EDP

Foca na evolucao do dominio de decisao, contratos, policy, strategy, proposal, provider operations e observabilidade.

### Rule

O Documento Mestre nao pode contradizer o DCA do EDP em fronteiras do dominio EDP.
O DCA do EDP nao pode contradizer o Documento Mestre em principios macro da plataforma.
