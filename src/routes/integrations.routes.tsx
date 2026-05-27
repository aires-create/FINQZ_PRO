import React from "react";
import { Navigate, Route } from "react-router-dom";

export const integrationsRoutes = (
  <>
    <Route path="hub/automacao" element={<Navigate to="/app/admin/automacoes" replace />} />
    <Route path="automacao" element={<Navigate to="/app/admin/automacoes" replace />} />
    <Route path="configuracoes" element={<Navigate to="/app/admin/geral" replace />} />
    <Route path="configuracoes/geral" element={<Navigate to="/app/admin/geral" replace />} />
    <Route path="configuracoes/tags" element={<Navigate to="/app/admin/tags" replace />} />
    <Route
      path="configuracoes/pipelines"
      element={<Navigate to="/app/admin/pipelines" replace />}
    />
    <Route
      path="configuracoes/integracoes"
      element={<Navigate to="/app/admin/integracoes" replace />}
    />
    <Route
      path="configuracoes/integrations"
      element={<Navigate to="/app/admin/integracoes" replace />}
    />
    <Route
      path="configuracoes/automacao"
      element={<Navigate to="/app/admin/automacoes" replace />}
    />
    <Route
      path="configuracoes/automacoes"
      element={<Navigate to="/app/admin/automacoes" replace />}
    />
    <Route
      path="configuracoes/notificacoes"
      element={<Navigate to="/app/admin/notificacoes" replace />}
    />
    <Route
      path="configuracoes/notifications"
      element={<Navigate to="/app/admin/notificacoes" replace />}
    />
    <Route
      path="configuracoes/seguranca"
      element={<Navigate to="/app/admin/seguranca" replace />}
    />
    <Route
      path="configuracoes/security"
      element={<Navigate to="/app/admin/seguranca" replace />}
    />
    <Route
      path="configuracoes/permissoes"
      element={<Navigate to="/app/admin/permissoes" replace />}
    />
  </>
);
