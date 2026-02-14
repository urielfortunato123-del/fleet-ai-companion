import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import OptimizationStudy from "@/pages/OptimizationStudy";
import VehicleDetail from "@/pages/VehicleDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/daily-ops" element={<AppLayout><DailyOps /></AppLayout>} />
          <Route path="/vehicles" element={<AppLayout><Vehicles /></AppLayout>} />
          <Route path="/vehicles/:id" element={<AppLayout><VehicleDetail /></AppLayout>} />
          <Route path="/maintenance" element={<AppLayout><Maintenance /></AppLayout>} />
          <Route path="/fuel" element={<AppLayout><FuelPage /></AppLayout>} />
          <Route path="/tires" element={<AppLayout><TiresPage /></AppLayout>} />
          <Route path="/fines" element={<AppLayout><PlaceholderPage title="Multas & Documentos" description="Gestão de multas, vencimentos de documentos, upload e histórico." /></AppLayout>} />
          <Route path="/incidents" element={<AppLayout><PlaceholderPage title="Ocorrências" description="Registro de acidentes, panes e reboques com anexos." /></AppLayout>} />
          <Route path="/drivers" element={<AppLayout><PlaceholderPage title="Motoristas" description="Perfil, CNH, histórico de atribuições e multas." /></AppLayout>} />
          <Route path="/optimization" element={<AppLayout><OptimizationStudy /></AppLayout>} />
          <Route path="/assistant" element={<AppLayout><AIAssistant /></AppLayout>} />
          <Route path="/admin" element={<AppLayout><PlaceholderPage title="Administração" description="Gestão de usuários, permissões, unidades, centros de custo e templates." /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
