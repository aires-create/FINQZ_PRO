import React from "react";
import { Building2, Layers, Package } from "lucide-react";

import type { CommercialStructureCoverageTreeView } from "../../features/commercial-structure/commercialStructureCoverage.types";

type CommercialCoverageTreeProps = {
  tree: CommercialStructureCoverageTreeView | null;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className="rounded-full border border-[var(--border-muted)] px-2 py-1 text-xs font-medium text-[var(--text-muted)]">
    {status}
  </span>
);

export const CommercialCoverageTree: React.FC<CommercialCoverageTreeProps> = ({
  tree,
}) => {
  if (!tree) {
    return (
      <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6">
        <p className="text-sm text-[var(--text-muted)]">
          Nenhuma cobertura comercial disponível para exibição.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Segmentos Comerciais
          </h2>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tree.segments.map((segment) => (
            <div
              key={segment.id}
              className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-strong)] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {segment.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Código: {segment.code}
                  </p>
                </div>
                <StatusBadge status={segment.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-[var(--text-muted)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Produtos, Subprodutos e Modalidades
          </h2>
        </div>

        <div className="mt-4 space-y-4">
          {tree.products.map((product) => (
            <article
              key={product.id}
              className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface-strong)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Código: {product.code}
                  </p>
                </div>
                <StatusBadge status={product.status} />
              </div>

              <div className="mt-4 space-y-3 border-l border-[var(--border-muted)] pl-4">
                {product.subproducts.map((subproduct) => (
                  <div
                    key={subproduct.id}
                    className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface)] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <Layers className="mt-0.5 h-4 w-4 text-[var(--text-muted)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {subproduct.name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Código: {subproduct.code}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={subproduct.status} />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {subproduct.modalities.map((modality) => (
                        <span
                          key={modality.id}
                          className="rounded-full border border-[var(--border-muted)] bg-[var(--bg-surface-strong)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                          title={modality.code}
                        >
                          {modality.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
