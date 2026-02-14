import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DailyOps from "@/pages/DailyOps";
import Vehicles from "@/pages/Vehicles";
import AIAssistant from "@/pages/AIAssistant";
import Maintenance from "@/pages/Maintenance";
import FuelPage from "@/pages/FuelPage";
import TiresPage from "@/pages/TiresPage";
import PlaceholderPage from "@/components/PlaceholderPage";
import FinesDocsPage from "@/pages/FinesDocsPage";
import IncidentsPage from "@/pages/IncidentsPage";
import OptimizationStudy from "@/pages/OptimizationStudy";
import FleetUtilization from "@/pages/FleetUtilization";
import VehicleDetail from "@/pages/VehicleDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/daily-ops" element={<ProtectedRoute><AppLayout><DailyOps /></AppLayout></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><AppLayout><Vehicles /></AppLayout></ProtectedRoute>} />
            <Route path="/vehicles/:id" element={<ProtectedRoute><AppLayout><VehicleDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute><AppLayout><Maintenance /></AppLayout></ProtectedRoute>} />
            <Route path="/fuel" element={<ProtectedRoute><AppLayout><FuelPage /></AppLayout></ProtectedRoute>} />
            <Route path="/tires" element={<ProtectedRoute><AppLayout><TiresPage /></AppLayout></ProtectedRoute>} />
            <Route path="/fines" element={<ProtectedRoute><AppLayout><FinesDocsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute><AppLayout><IncidentsPage /></AppLayout></ProtectedRoute>} />
            <Route path="/drivers" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Motoristas" description="Perfil, CNH, histórico de atribuições e multas." /></AppLayout></ProtectedRoute>} />
            <Route path="/optimization" element={<ProtectedRoute><AppLayout><OptimizationStudy /></AppLayout></ProtectedRoute>} />
            <Route path="/utilization" element={<ProtectedRoute><AppLayout><FleetUtilization /></AppLayout></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AppLayout><AIAssistant /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AppLayout><PlaceholderPage title="Administração" description="Gestão de usuários, permissões, unidades, centros de custo e templates." /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
