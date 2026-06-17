import React from "react";

import type { CommercialStructureCoverageTreeView } from "../../features/commercial-structure/commercialStructureCoverage.types";

type CommercialCoverageTreeProps = {
  tree: CommercialStructureCoverageTreeView;
};

export const CommercialCoverageTree: React.FC<CommercialCoverageTreeProps> = ({
  tree,
}) => {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Segmentos Comerciais
        </h2>

        <div className="mt-4 space-y-2">
          {tree.segments.map((segment) => (
            <div
              key={segment.id}
              className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-strong)] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {segment.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {segment.code}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-muted)] px-2 py-1 text-xs text-[var(--text-muted)]">
                  {segment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Produtos, Subprodutos e Modalidades
        </h2>

        <div className="mt-4 space-y-4">
          {tree.products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-surface-strong)] p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {product.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {product.code}
                  </p>
                </div>
                <span className="rounded-full border border-[var(--border-muted)] px-2 py-1 text-xs text-[var(--text-muted)]">
                  {product.status}
                </span>
              </div>

              <div className="mt-4 space-y-3 border-l border-[var(--border-muted)] pl-4">
                {product.subproducts.map((subproduct) => (
                  <div key={subproduct.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {subproduct.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {subproduct.code}
                        </p>
                      </div>
                      <span className="rounded-full border border-[var(--border-muted)] px-2 py-1 text-xs text-[var(--text-muted)]">
                        {subproduct.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {subproduct.modalities.map((modality) => (
                        <span
                          key={modality.id}
                          className="rounded-full border border-[var(--border-muted)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                        >
                          {modality.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
