import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { ProtectedRoute } from "../auth/guards";

const UsuariosPage = lazy(() => import("../pages/Usuarios"));
const AuditoriaPage = lazy(() => import("../pages/Auditoria"));
const PermissoesPage = lazy(() => import("../pages/admin/Permissoes"));
const EventosPage = lazy(() => import("../pages/Eventos"));
const GeralPage = lazy(() => import("../pages/admin/Geral"));
const TagsPage = lazy(() => import("../pages/admin/Tags"));
const PipelinesPage = lazy(() => import("../pages/admin/Pipelines"));
const IntegracoesPage = lazy(() => import("../pages/admin/Integracoes"));
const AdminAutomacoesPage = lazy(() => import("../pages/admin/Automacoes"));
const NotificacoesPage = lazy(() => import("../pages/admin/Notificacoes"));
const SegurancaPage = lazy(() => import("../pages/admin/Seguranca"));
const BancosPage = lazy(() => import("../pages/admin/Bancos"));

export const adminRoutes = (
  <>
    <Route
      path="auditoria"
      element={
        <ProtectedRoute
          requiredPermission="AUDIT_VIEW"
          requiredModule="auditoria"
          requiredAction="view"
        >
          <AuditoriaPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="usuarios"
      element={
        <ProtectedRoute requiredModule="usuarios" requiredAction="view">
          <UsuariosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/usuarios"
      element={
        <ProtectedRoute requiredModule="usuarios" requiredAction="view">
          <UsuariosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/auditoria"
      element={
        <ProtectedRoute
          requiredPermission="AUDIT_VIEW"
          requiredModule="auditoria"
          requiredAction="view"
        >
          <AuditoriaPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/permissoes"
      element={
        <ProtectedRoute requiredModule="admin" requiredAction="view">
          <PermissoesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/eventos"
      element={
        <ProtectedRoute requiredModule="admin" requiredAction="view">
          <EventosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/geral"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <GeralPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/tags"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <TagsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/pipelines"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <PipelinesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/integracoes"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <IntegracoesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/automacoes"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <AdminAutomacoesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/notificacoes"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <NotificacoesPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/seguranca"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <SegurancaPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="admin/bancos"
      element={
        <ProtectedRoute requiredModule="configuracoes" requiredAction="view">
          <BancosPage />
        </ProtectedRoute>
      }
    />
    <Route path="admin/configuracoes" element={<Navigate to="/app/admin/geral" replace />} />
    <Route path="auditoria" element={<Navigate to="/app/admin/auditoria" replace />} />
    <Route path="usuarios" element={<Navigate to="/app/admin/usuarios" replace />} />
  </>
);
