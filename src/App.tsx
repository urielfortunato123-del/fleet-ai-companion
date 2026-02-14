import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
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
import DataImport from "@/pages/DataImport";
import VehicleDetail from "@/pages/VehicleDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<P><Dashboard /></P>} />
            <Route path="/daily-ops" element={<P><DailyOps /></P>} />
            <Route path="/vehicles" element={<P><Vehicles /></P>} />
            <Route path="/vehicles/:id" element={<P><VehicleDetail /></P>} />
            <Route path="/maintenance" element={<P><Maintenance /></P>} />
            <Route path="/fuel" element={<P><FuelPage /></P>} />
            <Route path="/tires" element={<P><TiresPage /></P>} />
            <Route path="/fines" element={<P><FinesDocsPage /></P>} />
            <Route path="/incidents" element={<P><IncidentsPage /></P>} />
            <Route path="/drivers" element={<P><PlaceholderPage title="Motoristas" description="Perfil, CNH, histórico de atribuições e multas." /></P>} />
            <Route path="/optimization" element={<P><OptimizationStudy /></P>} />
            <Route path="/utilization" element={<P><FleetUtilization /></P>} />
            <Route path="/import" element={<P><DataImport /></P>} />
            <Route path="/assistant" element={<P><AIAssistant /></P>} />
            <Route path="/admin" element={<P><PlaceholderPage title="Administração" description="Gestão de usuários, permissões, unidades, centros de custo e templates." /></P>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
