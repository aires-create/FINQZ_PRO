export type ProposalPdfDocument = {
  headerLines: string[];
  bodyLines: string[];
  footerLines?: string[];
  fileName?: string;
};

type ProposalRow = {
  label: string;
  value: string;
};

type ProposalChecklistGroup = {
  title: string;
  items: string[];
};

type ProposalSection =
  | { kind: "rows"; title: string; rows: ProposalRow[] }
  | { kind: "checklist"; title: string; groups: ProposalChecklistGroup[] }
  | { kind: "paragraphs"; title: string; paragraphs: string[] }
  | { kind: "signatures"; title: string; names: string[] };

type ParsedHeader = {
  brand: string;
  title: string;
  code: string;
  issuedAt: string;
  validUntil: string;
};

type PdfPage = {
  ops: string[];
};

type PdfColor = {
  r: number;
  g: number;
  b: number;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const PAGE_MARGIN_X = 36;
const PAGE_MARGIN_TOP = 36;
const PAGE_MARGIN_BOTTOM = 28;
const HEADER_HEIGHT = 108;
const FOOTER_HEIGHT = 32;
const CARD_GAP = 12;
const CARD_PADDING = 14;
const CARD_WIDTH = PAGE_WIDTH - PAGE_MARGIN_X * 2;
const CONTENT_TOP = PAGE_MARGIN_TOP + HEADER_HEIGHT + 10;
const CONTENT_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - FOOTER_HEIGHT;
const TITLE_STRIP_HEIGHT = 28;
const LINE_HEIGHT = 14;
const FONT_SMALL = 8.5;
const FONT_BODY = 10.2;
const FONT_LABEL = 10.2;
const FONT_TITLE = 15;
const FONT_HEADER = 10.5;
const FONT_HERO = 24;

const COLOR_DARK = { r: 0.07, g: 0.11, b: 0.18 };
const COLOR_BLUE = { r: 0.0, g: 0.05, b: 0.9 };
const COLOR_LIGHT_BLUE = { r: 0.94, g: 0.96, b: 1.0 };
const COLOR_BORDER = { r: 0.82, g: 0.86, b: 0.9 };
const COLOR_SOFT = { r: 0.97, g: 0.98, b: 0.99 };
const COLOR_TEXT = { r: 0.11, g: 0.15, b: 0.2 };
const COLOR_MUTED = { r: 0.39, g: 0.44, b: 0.5 };

const normalizeComparable = (value: string): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const isMissingValue = (value: string): boolean => {
  const normalized = normalizeComparable(value);
  return normalized.length === 0 || normalized === "-" || normalized === "N/A" || normalized === "NA";
};

const isTruthyDisplayValue = (value: string): boolean => {
  const normalized = normalizeComparable(value);
  return normalized === "SIM" || normalized === "S" || normalized === "OK" || normalized === "VERDADEIRO";
};

const sanitizePdfText = (value: string): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapText = (value: string, maxChars: number): string[] => {
  const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length > maxChars) {
      let cursor = 0;
      while (cursor < word.length) {
        const slice = word.slice(cursor, cursor + maxChars);
        if (slice.length === maxChars) {
          lines.push(slice);
        } else {
          current = slice;
        }
        cursor += maxChars;
      }
    } else {
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
};

const estimateTextWidth = (text: string, fontSize: number): number => text.length * fontSize * 0.5;

const drawRect = (
  page: PdfPage,
  x: number,
  top: number,
  width: number,
  height: number,
  options: { fill?: PdfColor; stroke?: PdfColor; lineWidth?: number } = {},
): void => {
  const y = PAGE_HEIGHT - top - height;
  const ops: string[] = ["q"];
  if (options.fill) {
    ops.push(`${options.fill.r} ${options.fill.g} ${options.fill.b} rg`);
  }
  if (options.stroke) {
    ops.push(`${options.stroke.r} ${options.stroke.g} ${options.stroke.b} RG`);
  }
  ops.push(`${options.lineWidth ?? 1} w`);
  ops.push(`${x} ${y} ${width} ${height} re`);
  ops.push(options.fill && options.stroke ? "B" : options.fill ? "f" : "S");
  ops.push("Q");
  page.ops.push(ops.join("\n"));
};

const drawLine = (
  page: PdfPage,
  x1: number,
  top1: number,
  x2: number,
  top2: number,
  color = COLOR_BORDER,
  lineWidth = 1,
): void => {
  const y1 = PAGE_HEIGHT - top1;
  const y2 = PAGE_HEIGHT - top2;
  page.ops.push(
    [
      "q",
      `${color.r} ${color.g} ${color.b} RG`,
      `${lineWidth} w`,
      `${x1} ${y1} m`,
      `${x2} ${y2} l`,
      "S",
      "Q",
    ].join("\n"),
  );
};

const drawText = (
  page: PdfPage,
  x: number,
  top: number,
  text: string,
  options: { font?: "F1" | "F2"; size?: number; color?: { r: number; g: number; b: number }; align?: "left" | "right" | "center" } = {},
): void => {
  const font = options.font ?? "F1";
  const size = options.size ?? FONT_BODY;
  const color = options.color ?? COLOR_TEXT;
  const clean = sanitizePdfText(text);
  const width = estimateTextWidth(clean, size);
  let xPosition = x;
  if (options.align === "right") {
    xPosition = x - width;
  } else if (options.align === "center") {
    xPosition = x - width / 2;
  }

  const y = PAGE_HEIGHT - top - size - 1;
  page.ops.push(
    [
      "q",
      `${color.r} ${color.g} ${color.b} rg`,
      "BT",
      `/${font} ${size} Tf`,
      `1 0 0 1 ${xPosition} ${y} Tm`,
      `(${clean}) Tj`,
      "ET",
      "Q",
    ].join("\n"),
  );
};

const drawWrappedText = (
  page: PdfPage,
  x: number,
  top: number,
  width: number,
  text: string,
  options: { font?: "F1" | "F2"; size?: number; color?: { r: number; g: number; b: number }; lineHeight?: number; maxChars?: number } = {},
): number => {
  const size = options.size ?? FONT_BODY;
  const lineHeight = options.lineHeight ?? LINE_HEIGHT;
  const maxChars = options.maxChars ?? Math.max(20, Math.floor(width / (size * 0.5)));
  const lines = wrapText(text, maxChars);
  lines.forEach((line, index) => {
    drawText(page, x, top + index * lineHeight, line, {
      font: options.font,
      size,
      color: options.color,
    });
  });
  return Math.max(1, lines.length) * lineHeight;
};

const parseHeader = (headerLines: string[]): ParsedHeader => {
  const values = [...headerLines, "", "", "", "", ""];
  return {
    brand: values[0] || "FINQZ PRO",
    title: values[1] || "PROPOSTA COMERCIAL",
    code: values[2]?.replace(/^Código:\s*/i, "").replace(/^Codigo:\s*/i, "") || "-",
    issuedAt: values[3]?.replace(/^Emissão:\s*/i, "").replace(/^Emissao:\s*/i, "") || "-",
    validUntil: values[4]?.replace(/^Validade:\s*/i, "") || "-",
  };
};

const SECTION_DEFINITIONS: Record<string, ProposalSection["kind"]> = {
  IDENTIFICACAO: "rows",
  "RESUMO DA OPERACAO": "rows",
  "RESUMO DA OPERAÇÃO": "rows",
  "DADOS DO BEM": "rows",
  "DOCUMENTOS OBRIGATORIOS": "checklist",
  "DOCUMENTOS OBRIGATÓRIOS": "checklist",
  "CARATER DA PROPOSTA": "paragraphs",
  "CARÁTER DA PROPOSTA": "paragraphs",
  "PRIVACIDADE E PROTECAO DE DADOS": "paragraphs",
  "PRIVACIDADE E PROTEÇÃO DE DADOS": "paragraphs",
  "DECLARACAO DO CLIENTE": "paragraphs",
  "DECLARAÇÃO DO CLIENTE": "paragraphs",
  ASSINATURAS: "signatures",
};

const parseProposalSections = (lines: string[]): ProposalSection[] => {
  const sections: ProposalSection[] = [];
  let current: ProposalSection | null = null;
  let currentGroup: ProposalChecklistGroup | null = null;

  const flushCurrent = () => {
    if (current) {
      sections.push(current);
    }
    current = null;
    currentGroup = null;
  };

  const startSection = (kind: ProposalSection["kind"], title: string) => {
    flushCurrent();
    if (kind === "rows") {
      current = { kind, title, rows: [] };
    } else if (kind === "checklist") {
      current = { kind, title, groups: [] };
    } else if (kind === "paragraphs") {
      current = { kind, title, paragraphs: [] };
    } else {
      current = { kind, title, names: [] };
    }
  };

  for (const rawLine of lines) {
    const line = String(rawLine ?? "").trim();
    const comparable = normalizeComparable(line);
    const sectionKind = SECTION_DEFINITIONS[comparable];

    if (sectionKind) {
      startSection(sectionKind, line);
      continue;
    }

    if (!current) {
      continue;
    }

    if (!line) {
      if (current.kind === "checklist") {
        currentGroup = null;
      }
      continue;
    }

    if (current.kind === "rows") {
      const separatorIndex = line.indexOf(":");
      const label = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : line;
      const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : "-";
      current.rows.push({ label, value: value || "-" });
      continue;
    }

    if (current.kind === "checklist") {
      if (line.endsWith(":")) {
        currentGroup = { title: line.slice(0, -1).trim(), items: [] };
        current.groups.push(currentGroup);
        continue;
      }

      if (!currentGroup) {
        currentGroup = { title: "Itens", items: [] };
        current.groups.push(currentGroup);
      }

      currentGroup.items.push(line.replace(/^☐\s*/, "").trim());
      continue;
    }

    if (current.kind === "paragraphs") {
      current.paragraphs.push(line);
      continue;
    }

    if (current.kind === "signatures") {
      current.names.push(line);
    }
  }

  flushCurrent();
  return sections;
};

const estimateRowsSectionHeight = (section: Extract<ProposalSection, { kind: "rows" }>): number => {
  let height = TITLE_STRIP_HEIGHT + CARD_PADDING * 2;
  for (const row of section.rows) {
    const valueLines = wrapText(row.value, 42).length;
    height += Math.max(1, valueLines) * 16 + 6;
  }
  return height + 4;
};

const estimateChecklistSectionHeight = (section: Extract<ProposalSection, { kind: "checklist" }>): number => {
  const groupHeights = section.groups.map((group) => TITLE_STRIP_HEIGHT + CARD_PADDING * 2 + group.items.length * 16 + 10);
  return TITLE_STRIP_HEIGHT + CARD_PADDING * 2 + (groupHeights.length > 0 ? Math.max(...groupHeights) : 72) + 6;
};

const estimateParagraphSectionHeight = (section: Extract<ProposalSection, { kind: "paragraphs" }>): number => {
  let height = TITLE_STRIP_HEIGHT + CARD_PADDING * 2;
  for (const paragraph of section.paragraphs) {
    if (!paragraph) {
      height += 8;
      continue;
    }
    height += wrapText(paragraph, 88).length * 15 + 8;
  }
  return height + 4;
};

const estimateSignatureSectionHeight = (): number => TITLE_STRIP_HEIGHT + CARD_PADDING * 2 + 110;

const estimateSectionHeight = (section: ProposalSection): number => {
  if (section.kind === "rows") return estimateRowsSectionHeight(section);
  if (section.kind === "checklist") return estimateChecklistSectionHeight(section);
  if (section.kind === "paragraphs") return estimateParagraphSectionHeight(section);
  return estimateSignatureSectionHeight();
};

const layoutSectionsIntoPages = (sections: ProposalSection[]): ProposalSection[][] => {
  const usableHeight = CONTENT_BOTTOM - CONTENT_TOP;
  const pages: ProposalSection[][] = [];
  let currentPage: ProposalSection[] = [];
  let usedHeight = 0;

  for (const section of sections) {
    const sectionHeight = estimateSectionHeight(section);
    const nextHeight = sectionHeight + (currentPage.length > 0 ? CARD_GAP : 0);

    if (currentPage.length > 0 && usedHeight + nextHeight > usableHeight) {
      pages.push(currentPage);
      currentPage = [];
      usedHeight = 0;
    }

    currentPage.push(section);
    usedHeight += sectionHeight + (currentPage.length > 1 ? CARD_GAP : 0);
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages.length > 0 ? pages : [[]];
};

const renderHeader = (page: PdfPage, header: ParsedHeader): number => {
  drawRect(page, PAGE_MARGIN_X, PAGE_MARGIN_TOP, CARD_WIDTH, 6, { fill: COLOR_BLUE, stroke: COLOR_BLUE, lineWidth: 0.1 });

  drawText(page, PAGE_MARGIN_X + 4, PAGE_MARGIN_TOP + 18, header.brand, {
    font: "F2",
    size: FONT_HERO,
    color: COLOR_DARK,
  });
  drawText(page, PAGE_MARGIN_X + 4, PAGE_MARGIN_TOP + 41, header.title, {
    font: "F2",
    size: FONT_TITLE,
    color: COLOR_BLUE,
  });
  drawText(page, PAGE_MARGIN_X + 4, PAGE_MARGIN_TOP + 58, "Documento institucional para envio ao cliente", {
    font: "F1",
    size: FONT_HEADER,
    color: COLOR_MUTED,
  });

  const metaX = PAGE_WIDTH - PAGE_MARGIN_X - 206;
  drawRect(page, metaX, PAGE_MARGIN_TOP + 14, 206, 58, { fill: COLOR_SOFT, stroke: COLOR_BORDER, lineWidth: 0.8 });
  drawText(page, metaX + 12, PAGE_MARGIN_TOP + 26, `Código: ${header.code || "-"}`, {
    font: "F2",
    size: 10,
    color: COLOR_TEXT,
  });
  drawText(page, metaX + 12, PAGE_MARGIN_TOP + 39, `Emissão: ${header.issuedAt || "-"}`, {
    font: "F1",
    size: 9,
    color: COLOR_MUTED,
  });
  drawText(page, metaX + 12, PAGE_MARGIN_TOP + 52, `Validade: ${header.validUntil || "-"}`, {
    font: "F1",
    size: 9,
    color: COLOR_MUTED,
  });

  drawLine(page, PAGE_MARGIN_X, PAGE_MARGIN_TOP + 82, PAGE_WIDTH - PAGE_MARGIN_X, PAGE_MARGIN_TOP + 82, COLOR_BORDER, 0.8);
  return CONTENT_TOP;
};

const renderRowsSection = (page: PdfPage, section: Extract<ProposalSection, { kind: "rows" }>, top: number): number => {
  const rows = section.title === "DADOS DO BEM"
    ? section.rows.filter((row) => {
        if (isMissingValue(row.value)) return false;
        if (normalizeComparable(row.label) === "CLIENTE POSSUI CNH") {
          return isTruthyDisplayValue(row.value);
        }
        return true;
      })
    : section.rows.filter((row) => !isMissingValue(row.value));

  if (rows.length === 0) {
    return top;
  }

  const visibleSection = { ...section, rows };
  const height = estimateRowsSectionHeight(visibleSection);
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, height, { fill: { r: 1, g: 1, b: 1 }, stroke: COLOR_BORDER, lineWidth: 0.8 });
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, TITLE_STRIP_HEIGHT, { fill: COLOR_LIGHT_BLUE, stroke: COLOR_BORDER, lineWidth: 0.4 });
  drawText(page, PAGE_MARGIN_X + CARD_PADDING, top + 9, section.title, {
    font: "F2",
    size: 10,
    color: COLOR_MUTED,
  });

  let cursorTop = top + TITLE_STRIP_HEIGHT + CARD_PADDING;
  const labelWidth = 200;
  const valueX = PAGE_MARGIN_X + labelWidth + 18;
  const valueWidth = CARD_WIDTH - labelWidth - 18 - CARD_PADDING;

  rows.forEach((row, index) => {
    const valueLines = wrapText(row.value, Math.max(18, Math.floor(valueWidth / 5.2)));
    const rowHeight = Math.max(1, valueLines.length) * 16 + 6;
    if (index > 0) {
      drawLine(page, PAGE_MARGIN_X + CARD_PADDING, cursorTop, PAGE_WIDTH - PAGE_MARGIN_X - CARD_PADDING, cursorTop, COLOR_BORDER, 0.5);
    }
    drawText(page, PAGE_MARGIN_X + CARD_PADDING, cursorTop + 10, row.label, {
      font: "F1",
      size: FONT_LABEL,
      color: COLOR_MUTED,
    });
    valueLines.forEach((line, lineIndex) => {
      drawText(page, valueX, cursorTop + 10 + lineIndex * 15, line, {
        font: "F2",
        size: FONT_LABEL,
        color: COLOR_TEXT,
      });
    });
    cursorTop += rowHeight;
  });

  return top + height;
};

const renderChecklistSection = (page: PdfPage, section: Extract<ProposalSection, { kind: "checklist" }>, top: number): number => {
  const height = estimateChecklistSectionHeight(section);
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, height, { fill: { r: 1, g: 1, b: 1 }, stroke: COLOR_BORDER, lineWidth: 0.8 });
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, TITLE_STRIP_HEIGHT, { fill: COLOR_LIGHT_BLUE, stroke: COLOR_BORDER, lineWidth: 0.4 });
  drawText(page, PAGE_MARGIN_X + CARD_PADDING, top + 9, section.title, {
    font: "F2",
    size: 10,
    color: COLOR_MUTED,
  });

  const innerTop = top + TITLE_STRIP_HEIGHT + CARD_PADDING;
  const innerHeight = height - TITLE_STRIP_HEIGHT - CARD_PADDING * 2;
  const innerGap = 12;

  const groups = section.groups.length > 0
    ? section.groups
    : [{ title: "Itens", items: [] }];

  const groupWidth = groups.length > 1
    ? (CARD_WIDTH - CARD_PADDING * 2 - innerGap) / 2
    : CARD_WIDTH - CARD_PADDING * 2;

  const rowHeight = 16;
  const groupHeights = groups.map((group) => 24 + group.items.length * rowHeight + 16);
  const boxHeight = Math.min(innerHeight, Math.max(88, ...groupHeights));

  groups.forEach((group, index) => {
    const x = PAGE_MARGIN_X + CARD_PADDING + index * (groupWidth + innerGap);
    drawRect(page, x, innerTop, groupWidth, boxHeight, { fill: COLOR_SOFT, stroke: COLOR_BORDER, lineWidth: 0.7 });
    drawText(page, x + 10, innerTop + 12, group.title, {
      font: "F2",
      size: 10,
      color: COLOR_TEXT,
    });

    group.items.forEach((item, itemIndex) => {
      drawText(page, x + 10, innerTop + 28 + itemIndex * rowHeight, `[ ] ${item}`, {
        font: "F1",
        size: FONT_BODY,
        color: COLOR_TEXT,
      });
    });
  });

  return top + height;
};

const renderParagraphSection = (page: PdfPage, section: Extract<ProposalSection, { kind: "paragraphs" }>, top: number): number => {
  const height = estimateParagraphSectionHeight(section);
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, height, { fill: { r: 1, g: 1, b: 1 }, stroke: COLOR_BORDER, lineWidth: 0.8 });
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, TITLE_STRIP_HEIGHT, { fill: COLOR_LIGHT_BLUE, stroke: COLOR_BORDER, lineWidth: 0.4 });
  drawText(page, PAGE_MARGIN_X + CARD_PADDING, top + 9, section.title, {
    font: "F2",
    size: 10,
    color: COLOR_MUTED,
  });

  let cursorTop = top + TITLE_STRIP_HEIGHT + CARD_PADDING;
  section.paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      cursorTop += 4;
      return;
    }
    const consumed = drawWrappedText(page, PAGE_MARGIN_X + CARD_PADDING, cursorTop, CARD_WIDTH - CARD_PADDING * 2, paragraph, {
      font: "F1",
      size: FONT_BODY,
      color: COLOR_TEXT,
      lineHeight: 15,
      maxChars: 88,
    });
    cursorTop += consumed + 6;
  });

  return top + height;
};

const renderSignatureSection = (page: PdfPage, section: Extract<ProposalSection, { kind: "signatures" }>, top: number): number => {
  const height = estimateSignatureSectionHeight();
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, height, { fill: { r: 1, g: 1, b: 1 }, stroke: COLOR_BORDER, lineWidth: 0.8 });
  drawRect(page, PAGE_MARGIN_X, top, CARD_WIDTH, TITLE_STRIP_HEIGHT, { fill: COLOR_LIGHT_BLUE, stroke: COLOR_BORDER, lineWidth: 0.4 });
  drawText(page, PAGE_MARGIN_X + CARD_PADDING, top + 9, section.title, {
    font: "F2",
    size: 10,
    color: COLOR_MUTED,
  });

  const names = section.names.length > 0 ? section.names : ["Cliente", "FINQZ PRO"];
  const columns = names.slice(0, 2);
  const innerTop = top + TITLE_STRIP_HEIGHT + 18;
  const boxWidth = (CARD_WIDTH - CARD_PADDING * 2 - 12) / 2;

  columns.forEach((name, index) => {
    const x = PAGE_MARGIN_X + CARD_PADDING + index * (boxWidth + 12);
    drawRect(page, x, innerTop, boxWidth, 82, { fill: COLOR_SOFT, stroke: COLOR_BORDER, lineWidth: 0.7 });
    drawText(page, x + 12, innerTop + 18, name, {
      font: "F2",
      size: 11,
      color: COLOR_TEXT,
    });
    drawLine(page, x + 12, innerTop + 52, x + boxWidth - 12, innerTop + 52, COLOR_BORDER, 0.8);
    drawText(page, x + 12, innerTop + 60, "Assinatura", {
      font: "F1",
      size: 9,
      color: COLOR_MUTED,
    });
  });

  return top + height;
};

const renderFooter = (page: PdfPage, footerLines: string[], pageNumber: number, totalPages: number, code: string): void => {
  const footerTop = PAGE_HEIGHT - (PAGE_MARGIN_BOTTOM + 20);
  drawLine(page, PAGE_MARGIN_X, footerTop, PAGE_WIDTH - PAGE_MARGIN_X, footerTop, COLOR_BORDER, 0.6);

  const leftText = footerLines.length > 0 ? footerLines[0] : "Documento gerado automaticamente pelo FINQZ PRO.";
  const secondText = footerLines.length > 1 ? footerLines[1] : `Código da proposta: ${code || "-"}`;

  drawText(page, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 14, leftText, {
    font: "F1",
    size: FONT_SMALL,
    color: COLOR_MUTED,
  });
  drawText(page, PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 4, secondText, {
    font: "F1",
    size: FONT_SMALL,
    color: COLOR_MUTED,
  });
  drawText(page, PAGE_WIDTH - PAGE_MARGIN_X, PAGE_HEIGHT - PAGE_MARGIN_BOTTOM - 8, `Página ${pageNumber} de ${totalPages}`, {
    font: "F1",
    size: FONT_SMALL,
    color: COLOR_MUTED,
    align: "right",
  });
};

const renderPage = (pageSections: ProposalSection[], header: ParsedHeader, footerLines: string[], pageNumber: number, totalPages: number): string => {
  const page: PdfPage = { ops: [] };
  renderHeader(page, header);

  let cursorTop = CONTENT_TOP;
  pageSections.forEach((section, index) => {
    if (index > 0) {
      cursorTop += CARD_GAP;
    }

    if (section.kind === "rows") {
      cursorTop = renderRowsSection(page, section, cursorTop);
    } else if (section.kind === "checklist") {
      cursorTop = renderChecklistSection(page, section, cursorTop);
    } else if (section.kind === "paragraphs") {
      cursorTop = renderParagraphSection(page, section, cursorTop);
    } else {
      cursorTop = renderSignatureSection(page, section, cursorTop);
    }
  });

  renderFooter(page, footerLines, pageNumber, totalPages, header.code);
  return page.ops.join("\n");
};

const buildPdf = (pageStreams: string[]): string => {
  const fontRegularObjectNumber = 1;
  const fontBoldObjectNumber = 2;
  const pagesObjectNumber = 3;
  const catalogObjectNumber = 4;
  const pageObjectNumbers = pageStreams.map((_, index) => 5 + index * 2);
  const contentObjectNumbers = pageStreams.map((_, index) => 6 + index * 2);

  const objects: Array<{ number: number; content: string }> = [
    { number: fontRegularObjectNumber, content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>` },
    { number: fontBoldObjectNumber, content: `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>` },
    {
      number: pagesObjectNumber,
      content: `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`,
    },
    { number: catalogObjectNumber, content: `<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>` },
  ];

  pageStreams.forEach((stream, index) => {
    const contentObjectNumber = contentObjectNumbers[index];
    const pageObjectNumber = pageObjectNumbers[index];
    objects.push({
      number: contentObjectNumber,
      content: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    });
    objects.push({
      number: pageObjectNumber,
      content: `<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularObjectNumber} 0 R /F2 ${fontBoldObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    });
  });

  objects.sort((left, right) => left.number - right.number);

  let pdf = "%PDF-1.4\n";
  const offsets: string[] = ["0000000000 65535 f \n"];

  objects.forEach((object) => {
    offsets.push(`${pdf.length.toString().padStart(10, "0")} 00000 n \n`);
    pdf += `${object.number} 0 obj\n${object.content}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += offsets.join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectNumber} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return pdf;
};

export const createProposalPdfBlob = (document: ProposalPdfDocument): Blob => {
  const header = parseHeader(document.headerLines);
  const bodySections = parseProposalSections(document.bodyLines);
  const pages = layoutSectionsIntoPages(bodySections);
  const footerLines = document.footerLines ?? [];

  const pageStreams = pages.map((sections, index) => renderPage(sections, header, footerLines, index + 1, pages.length));
  const pdf = buildPdf(pageStreams);
  return new Blob([pdf], { type: "application/pdf" });
};

export const downloadPdfBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
};

export const openPdfBlob = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    return;
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
};
