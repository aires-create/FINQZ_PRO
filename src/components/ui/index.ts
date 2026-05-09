// Design System - Global Wrapper
// PONTO DE ENTRADA OFICIAL: Todo o sistema deve importar daqui
// Isso permite trocar implementações sem afetar os consumidores

// Re-export all components from design-system
export * from "../../design-system/components/Button";
export * from "../../design-system/components/Input";
export * from "../../design-system/components/Select";
export * from "../../design-system/components/Card";
export * from "../../design-system/components/Badge";
export * from "../../design-system/components/StatusBadge";
export * from "../../design-system/components/Modal";
export * from "../../design-system/components/Toggle";
export * from "../../design-system/components/TextArea";
export * from "../../design-system/components/Table";
export * from "../../design-system/components/KpiCard";
export * from "../../design-system/components/EntityAvatar";
export * from "../../design-system/components/EmptyState";
export * from "../../design-system/components/LoadingState";
export * from "../../design-system/components/ErrorState";

// Novos componentes para importação/exportação
export * from "../../design-system/components/Dropzone";
export * from "../../design-system/components/ImportModal";
export * from "../../design-system/components/ExportMenu";

// Layout components
export * from "../layout/PageHeader";
export * from "../layout/FilterDrawer";

// Also export from adapters for compatibility
export * from "../../design-system/adapters";
