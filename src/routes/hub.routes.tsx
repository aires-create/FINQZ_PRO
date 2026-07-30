import React, { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import { ProtectedRoute } from "../auth/guards";

const CampanhasPage = lazy(() => import("../pages/Campanhas"));
const ConversasPage = lazy(() => import("../pages/Conversas"));
const AudienciasPage = lazy(() => import("../pages/Audiencias"));
const SdrIaHubPage = lazy(() => import("../pages/SdrIaHub"));
const HubDisparosPage = lazy(() =>
  import("../pages/Placeholders").then((module) => ({ default: module.HubDisparos })),
);
const HubHigienizacaoPage = lazy(() =>
  import("../pages/Placeholders").then((module) => ({ default: module.HubHigienizacao })),
);
const HubEmailMarketingPage = lazy(() =>
  import("../pages/Placeholders").then((module) => ({ default: module.HubEmailMarketing })),
);

export const hubRoutes = (
  <>
    <Route path="campanhas" element={<Navigate to="/app/hub/campanhas" replace />} />
    <Route path="conversas" element={<Navigate to="/app/hub/whatsapp" replace />} />
    <Route path="audiencias" element={<Navigate to="/app/hub/audiencias" replace />} />
    <Route
      path="hub/audiencias"
      element={
        <ProtectedRoute requiredModule="audiencias" requiredAction="view">
          <AudienciasPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="hub/campanhas"
      element={
        <ProtectedRoute requiredModule="campanhas" requiredAction="view">
          <CampanhasPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="hub/disparos"
      element={
        <ProtectedRoute requiredModule="hub" requiredAction="view">
          <HubDisparosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="hub/whatsapp"
      element={
        <ProtectedRoute requiredModule="conversas" requiredAction="view">
          <ConversasPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="hub/sdr-ia"
      element={
        <ProtectedRoute requiredModule="hub" requiredAction="view">
          <SdrIaHubPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="hub/higienizacao"
      element={
        <ProtectedRoute requiredModule="hub" requiredAction="view">
          <HubHigienizacaoPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="hub/mailing"
      element={
        <ProtectedRoute requiredModule="hub" requiredAction="view">
          <HubEmailMarketingPage />
        </ProtectedRoute>
      }
    />
    <Route path="hub/conversas" element={<Navigate to="/app/hub/whatsapp" replace />} />
  </>
);
