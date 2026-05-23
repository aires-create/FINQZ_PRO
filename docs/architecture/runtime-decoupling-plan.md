# FINQZ PRO — Runtime Decoupling Plan

## Objetivo

Documento oficial da estratégia de desacoplamento do runtime frontend híbrido do FINQZ PRO.

---

## Diagnóstico atual

O frontend atualmente opera em modo híbrido:

```txt
API modular
+
REST legado
+
Zustand persist
+
localStorage
+
mocks
+
fallback adapters
```
