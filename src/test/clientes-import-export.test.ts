import { describe, expect, it } from "vitest";

import {
  buildCsvExportContent,
} from "../design-system/components/ExportMenu";
import {
  evaluateImportRows,
  normalizeColumnKey,
  parseDelimitedRows,
} from "../design-system/components/ImportModal";

describe("Clientes import/export helpers", () => {
  it("builds CSV export content compatible with Excel PT-BR", () => {
    const csv = buildCsvExportContent(
      [
        {
          nome: "Ana",
          email: "ana@example.com",
          status: "Ativo",
          observacao: "Linha com; separador e aspas \"ok\"",
        },
      ],
      [
        { key: "nome", label: "Nome" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" },
        { key: "observacao", label: "Observacao" },
      ],
    );

    expect(csv.startsWith("\ufeff")).toBe(true);
    expect(csv).toContain("Nome;Email;Status;Observacao");
    expect(csv).toContain("Ana;ana@example.com;Ativo;\"Linha com; separador e aspas \"\"ok\"\"\"");
  });

  it("parses semicolon CSV rows and keeps quoted delimiters intact", () => {
    const rows = parseDelimitedRows(
      'Nome;Email;Observacao\r\n"Ana Silva";ana@example.com;"Valor com; separador"\r\n',
    );

    expect(rows).toEqual([
      ["Nome", "Email", "Observacao"],
      ["Ana Silva", "ana@example.com", "Valor com; separador"],
    ]);
  });

  it("accepts mapped headers and validates required columns", () => {
    const evaluation = evaluateImportRows(
      [
        ["Nome", "Email", "CPF/CNPJ"],
        ["Ana", "ana@example.com", "123"],
      ],
      [
        { key: "nome", label: "Nome", required: true },
        { key: "email", label: "Email" },
        { key: "cpf_cnpj", label: "CPF/CNPJ" },
      ],
    );

    expect(evaluation.headerError).toBeNull();
    expect(evaluation.data).toHaveLength(1);
    expect(evaluation.data[0]).toEqual({
      nome: "Ana",
      email: "ana@example.com",
      cpf_cnpj: "123",
    });
  });

  it("rejects files with missing required headers", () => {
    const evaluation = evaluateImportRows(
      [
        ["Email", "CPF/CNPJ"],
        ["ana@example.com", "123"],
      ],
      [
        { key: "nome", label: "Nome", required: true },
        { key: "email", label: "Email" },
        { key: "cpf_cnpj", label: "CPF/CNPJ" },
      ],
    );

    expect(evaluation.data).toHaveLength(0);
    expect(evaluation.headerError).toContain("Campo(s) obrigatório(s) ausente(s): Nome");
  });

  it("normalizes labels and keys consistently", () => {
    expect(normalizeColumnKey("CPF/CNPJ")).toBe("cpfcnpj");
    expect(normalizeColumnKey("Estado Civil")).toBe("estadocivil");
  });
});
