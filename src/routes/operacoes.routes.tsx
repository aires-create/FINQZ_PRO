import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { ProtectedRoute } from "../auth/guards";

const ParceirosPage = lazy(() => import("../pages/Parceiros"));
const EstruturaComercialPage = lazy(() => import("../pages/EstruturaComercial"));
const CommercialCoveragePage = lazy(() => import("../pages/CommercialCoverage"));
const RoteirosOperacionaisPage = lazy(() => import("../pages/RoteirosOperacionais"));
const FinanceiroPage = lazy(() => import("../pages/Financeiro"));
const ContaCorrentePage = lazy(() => import("../pages/ContaCorrente"));
const RelatoriosPage = lazy(() => import("../pages/Relatorios"));
const TabelasComerciaisPage = lazy(() => import("../pages/TabelasComerciais"));
const PartnerAcquisitionLeadsPage = lazy(() => import("../pages/PartnerAcquisitionLeads"));

export const operacoesRoutes = (
  <>
    <Route
      path="parceiros"
      element={
        <ProtectedRoute
          requiredPermission="CUSTOMER_VIEW"
          requiredModule="parceiros"
          requiredAction="view"
        >
          <ParceirosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="estrutura-comercial"
      element={
        <ProtectedRoute
          requiredPermission="SALES_VIEW"
          requiredModule="estrutura_comercial"
          requiredAction="view"
        >
          <EstruturaComercialPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="roteiros-operacionais"
      element={
        <ProtectedRoute requiredModule="roteiros_operacionais" requiredAction="view">
          <RoteirosOperacionaisPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="financeiro"
      element={
        <ProtectedRoute
          requiredPermission="FINANCE_VIEW"
          requiredModule="financeiro"
          requiredAction="view"
        >
          <FinanceiroPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="conta-corrente"
      element={
        <ProtectedRoute requiredModule="conta_corrente" requiredAction="view">
          <ContaCorrentePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="relatorios"
      element={
        <ProtectedRoute
          requiredPermission="REPORT_VIEW"
          requiredModule="relatorios"
          requiredAction="view"
        >
          <RelatoriosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/parceiros"
      element={
        <ProtectedRoute
          requiredPermission="CUSTOMER_VIEW"
          requiredModule="parceiros"
          requiredAction="view"
        >
          <ParceirosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/estrutura-comercial"
      element={
        <ProtectedRoute
          requiredPermission="SALES_VIEW"
          requiredModule="estrutura_comercial"
          requiredAction="view"
        >
          <EstruturaComercialPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/commercial-coverage"
      element={
        <ProtectedRoute
          requiredPermission="SALES_VIEW"
          requiredModule="estrutura_comercial"
          requiredAction="view"
        >
          <CommercialCoveragePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/partner-acquisition/leads"
      element={
        <ProtectedRoute requiredPermission="partner_acquisition:read">
          <PartnerAcquisitionLeadsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/tabelas-comerciais"
      element={
        <ProtectedRoute requiredPermission="sales:view">
          <TabelasComerciaisPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/roteiros"
      element={
        <ProtectedRoute requiredModule="roteiros_operacionais" requiredAction="view">
          <RoteirosOperacionaisPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/financeiro"
      element={
        <ProtectedRoute
          requiredPermission="FINANCE_VIEW"
          requiredModule="financeiro"
          requiredAction="view"
        >
          <FinanceiroPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/conta-corrente"
      element={
        <ProtectedRoute requiredPermission="finance:view">
          <ContaCorrentePage />
        </ProtectedRoute>
      }
    />
    <Route
      path="operacoes/relatorios"
      element={
        <ProtectedRoute
          requiredPermission="REPORT_VIEW"
          requiredModule="relatorios"
          requiredAction="view"
        >
          <RelatoriosPage />
        </ProtectedRoute>
      }
    />
    <Route path="parceiros" element={<Navigate to="/app/operacoes/parceiros" replace />} />
    <Route
      path="estrutura-comercial"
      element={<Navigate to="/app/operacoes/estrutura-comercial" replace />}
    />
    <Route path="roteiros-operacionais" element={<Navigate to="/app/operacoes/roteiros" replace />} />
    <Route path="financeiro" element={<Navigate to="/app/operacoes/financeiro" replace />} />
    <Route
      path="conta-corrente"
      element={<Navigate to="/app/operacoes/conta-corrente" replace />}
    />
    <Route path="relatorios" element={<Navigate to="/app/operacoes/relatorios" replace />} />
  </>
);

