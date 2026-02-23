import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectCreate from "./pages/ProjectCreate";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectEdit from "./pages/ProjectEdit";
import TimeLogs from "./pages/TimeLogs";
import Marketplace from "./pages/Marketplace";
import Ratings from "./pages/Ratings";
import MyServices from "./pages/MyServices";
import AvailableProjects from "./pages/AvailableProjects";
import ProjectBidView from "./pages/ProjectBidView";
import MyBids from "./pages/MyBids";
import TimeTracking from "./pages/TimeTracking";
import Earnings from "./pages/Earnings";
import Notifications from "./pages/Notifications";
import SupportTickets from "./pages/SupportTickets";
import TicketCreate from "./pages/TicketCreate";
import Associations from "./pages/Associations";
import Donations from "./pages/Donations";
import ImpactReports from "./pages/ImpactReports";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminServices from "./pages/admin/AdminServices";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminTickets from "./pages/admin/AdminTickets";
import Contracts from "./pages/Contracts";
import Profile from "./pages/Profile";
import ProviderProfile from "./pages/ProviderProfile";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/projects/new" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
              <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
              <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectEdit /></ProtectedRoute>} />
              <Route path="/time-logs" element={<ProtectedRoute><TimeLogs /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/ratings" element={<ProtectedRoute><Ratings /></ProtectedRoute>} />
              <Route path="/my-services" element={<ProtectedRoute><MyServices /></ProtectedRoute>} />
              <Route path="/available-projects" element={<ProtectedRoute><AvailableProjects /></ProtectedRoute>} />
              <Route path="/available-projects/:id" element={<ProtectedRoute><ProjectBidView /></ProtectedRoute>} />
              <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />
              <Route path="/time-tracking" element={<ProtectedRoute><TimeTracking /></ProtectedRoute>} />
              <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
              <Route path="/tickets/new" element={<ProtectedRoute><TicketCreate /></ProtectedRoute>} />
              <Route path="/associations" element={<ProtectedRoute><Associations /></ProtectedRoute>} />
              <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
              <Route path="/impact" element={<ProtectedRoute><ImpactReports /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/providers/:id" element={<ProtectedRoute><ProviderProfile /></ProtectedRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
              <Route path="/admin/projects" element={<AdminRoute><AdminProjects /></AdminRoute>} />
              <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
              <Route path="/admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
              <Route path="/admin/finance" element={<AdminRoute><AdminFinance /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
              <Route path="/admin/audit-log" element={<AdminRoute><AdminAuditLog /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AccessibilityWidget />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
