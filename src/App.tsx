import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Simulador from "./pages/Simulador";
import Indicacoes from "./pages/Indicacoes";
import NotFound from "./pages/NotFound";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Funil from "./pages/admin/Funil";
import Leads from "./pages/admin/Leads";
import Metas from "./pages/admin/Metas";
import Carteira from "./pages/admin/Carteira";
import Inadimplentes from "./pages/admin/Inadimplentes";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import SimuladorAdmin from "./pages/admin/SimuladorAdmin";
import Agendamentos from "./pages/admin/Agendamentos";
import Jarvis from "./pages/admin/Jarvis";
import Settings from "./pages/admin/Settings";
import Register from "./pages/admin/Register";
import ResetPassword from "./pages/admin/ResetPassword";
import Chat from "./pages/admin/Chat";
import CartaAnalise from "./pages/admin/CartaAnalise";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route path="/parceiro" element={<Simulador />} />
          <Route path="/indicacoes" element={<Indicacoes />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/register" element={<Register />} />
          <Route path="/admin/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="funil" element={<Funil />} />
            <Route path="simulador" element={<SimuladorAdmin />} />
            <Route path="agendamentos" element={<Agendamentos />} />
            <Route path="leads" element={<Leads />} />
            <Route path="metas" element={<Metas />} />
            <Route path="jarvis" element={<Jarvis />} />
            <Route path="carteira" element={<Carteira />} />
            <Route path="inadimplentes" element={<Inadimplentes />} />
            <Route path="configuracoes" element={<Settings />} />
            <Route path="chat" element={<Chat />} />
            <Route path="carta-analise" element={<CartaAnalise />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
