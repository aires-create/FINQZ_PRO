import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { ProtectedRoute } from "../auth/guards";

const ClientesPage = lazy(() => import("../pages/Clientes"));
const OportunidadesPage = lazy(() => import("../pages/Oportunidades"));
const SimuladorPage = lazy(() => import("../pages/Simulador"));

export const crmRoutes = (
  <>
    <Route
      path="crm/clientes"
      element={
        <ProtectedRoute
          requiredPermission="CUSTOMER_VIEW"
          requiredModule="clientes"
          requiredAction="view"
        >
          <ClientesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="crm/pipeline"
      element={
        <ProtectedRoute
          requiredPermission="SALES_VIEW"
          requiredModule="oportunidades"
          requiredAction="view"
        >
          <OportunidadesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="crm/simulador"
      element={
        <ProtectedRoute requiredPermission="simulador:view">
          <SimuladorPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="crm/clientes"
      element={
        <ProtectedRoute
          requiredPermission="CUSTOMER_VIEW"
          requiredModule="clientes"
          requiredAction="view"
        >
          <ClientesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="crm/oportunidades"
      element={
        <ProtectedRoute
          requiredPermission="SALES_VIEW"
          requiredModule="oportunidades"
          requiredAction="view"
        >
          <OportunidadesPage />
        </ProtectedRoute>
      }
    />
    <Route path="oportunidades" element={<Navigate to="/app/crm/pipeline" replace />} />
    <Route path="crm/oportunidades" element={<Navigate to="/app/crm/pipeline" replace />} />
    <Route path="crm/pipelines" element={<Navigate to="/app/admin/pipelines" replace />} />
    <Route path="clientes" element={<Navigate to="/app/crm/clientes" replace />} />
  </>
);
