import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import CRM from "./pages/CRM";
import Clientes from "./pages/Clientes";
import Projetos from "./pages/Projetos";
import ProjectDetail from "./pages/ProjectDetail";
import NewProjectFromDeal from "./pages/NewProjectFromDeal";
import Tarefas from "./pages/Tarefas";
import Financeiro from "./pages/Financeiro";
import WarRoom from "./pages/WarRoom";
import TeamSettings from "./pages/settings/TeamSettings";
import Timesheet from "./pages/Timesheet";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Capacidade from "./pages/Capacidade";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crm"
                element={
                  <ProtectedRoute>
                    <CRM />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos"
                element={
                  <ProtectedRoute>
                    <Projetos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projetos/:id"
                element={
                  <ProtectedRoute>
                    <ProjectDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/new"
                element={
                  <ProtectedRoute>
                    <NewProjectFromDeal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tarefas"
                element={
                  <ProtectedRoute>
                    <Tarefas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financeiro"
                element={
                  <AdminRoute>
                    <Financeiro />
                  </AdminRoute>
                }
              />
              <Route
                path="/war-room"
                element={
                  <AdminRoute>
                    <WarRoom />
                  </AdminRoute>
                }
              />
              <Route
                path="/settings/team"
                element={
                  <AdminRoute>
                    <TeamSettings />
                  </AdminRoute>
                }
              />
              <Route
                path="/timesheet"
                element={
                  <ProtectedRoute>
                    <Timesheet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/capacidade"
                element={
                  <ProtectedRoute>
                    <Capacidade />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <AdminRoute>
                    <Relatorios />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <AdminRoute>
                    <Configuracoes />
                  </AdminRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
