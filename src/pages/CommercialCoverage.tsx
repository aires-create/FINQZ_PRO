import React, { useEffect, useState } from "react";
import { Building2, Layers, Package } from "lucide-react";

import { PageHeader } from "../components/layout/PageHeader";
import { CommercialCoverageTree } from "../components/commercial-coverage/CommercialCoverageTree";
import { loadCommercialStructureCoverageTree } from "../features/commercial-structure/loadCommercialStructureCoverageTree";
import type { CommercialStructureCoverageTreeView } from "../features/commercial-structure/commercialStructureCoverage.types";

const CommercialCoveragePage: React.FC = () => {
  const [coverageTree, setCoverageTree] =
    useState<CommercialStructureCoverageTreeView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCoverageTree = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const tree = await loadCommercialStructureCoverageTree();
      setCoverageTree(tree);
    } catch (error) {
      console.error("[CommercialCoverage] Failed to load coverage tree:", error);
      setErrorMessage("Não foi possível carregar a cobertura comercial.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCoverageTree();
  }, []);

  const totalSegments = coverageTree?.segments.length ?? 0;
  const totalProducts = coverageTree?.products.length ?? 0;
  const totalSubproducts =
    coverageTree?.products.reduce(
      (total, product) => total + product.subproducts.length,
      0,
    ) ?? 0;
  const totalModalities =
    coverageTree?.products.reduce(
      (total, product) =>
        total +
        product.subproducts.reduce(
          (subtotal, subproduct) => subtotal + subproduct.modalities.length,
          0,
        ),
      0,
    ) ?? 0;

  return (
    <div className="app-page">
      <PageHeader
        title="Commercial Coverage"
        subtitle="Visualização somente leitura da cobertura comercial canônica"
        icon={Building2}
        showSearch={false}
        showFilter={false}
        onRefresh={loadCoverageTree}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm text-[var(--text-muted)]">Segmentos</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {totalSegments}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm text-[var(--text-muted)]">Produtos</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {totalProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm text-[var(--text-muted)]">Subprodutos</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {totalSubproducts}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm text-[var(--text-muted)]">Modalidades</p>
              <p className="text-2xl font-semibold text-[var(--text-primary)]">
                {totalModalities}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border-muted)] bg-[var(--bg-surface)] p-6">
        {isLoading ? (
          <p className="text-sm text-[var(--text-muted)]">
            Carregando cobertura comercial...
          </p>
        ) : errorMessage ? (
          <p className="text-sm text-red-500">{errorMessage}</p>
        ) : (
          <CommercialCoverageTree tree={coverageTree} />
        )}
      </div>
    </div>
  );
};

export default CommercialCoveragePage;
