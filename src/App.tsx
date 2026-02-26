import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

// Eager-load critical routes
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy-load all other routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectCreate = lazy(() => import("./pages/ProjectCreate"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const ProjectEdit = lazy(() => import("./pages/ProjectEdit"));
const TimeLogs = lazy(() => import("./pages/TimeLogs"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Ratings = lazy(() => import("./pages/Ratings"));
const MyServices = lazy(() => import("./pages/MyServices"));
const AvailableProjects = lazy(() => import("./pages/AvailableProjects"));
const ProjectBidView = lazy(() => import("./pages/ProjectBidView"));
const MyBids = lazy(() => import("./pages/MyBids"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const Earnings = lazy(() => import("./pages/Earnings"));

const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const TicketCreate = lazy(() => import("./pages/TicketCreate"));
const Associations = lazy(() => import("./pages/Associations"));
const AssociationProfile = lazy(() => import("./pages/AssociationProfile"));
const Donations = lazy(() => import("./pages/Donations"));
const ImpactReports = lazy(() => import("./pages/ImpactReports"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Profile = lazy(() => import("./pages/Profile"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const Invoices = lazy(() => import("./pages/Invoices"));
const MyDisputes = lazy(() => import("./pages/MyDisputes"));
const EditRequests = lazy(() => import("./pages/EditRequests"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Messages = lazy(() => import("./pages/Messages"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminCMS = lazy(() => import("./pages/admin/AdminCMS"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-md px-8">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
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
                
                <Route path="/tickets" element={<ProtectedRoute><SupportTickets /></ProtectedRoute>} />
                <Route path="/tickets/new" element={<ProtectedRoute><TicketCreate /></ProtectedRoute>} />
                <Route path="/associations" element={<ProtectedRoute><Associations /></ProtectedRoute>} />
                <Route path="/associations/:id" element={<ProtectedRoute><AssociationProfile /></ProtectedRoute>} />
                <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
                <Route path="/impact" element={<ProtectedRoute><ImpactReports /></ProtectedRoute>} />
                <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
                <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="/my-disputes" element={<ProtectedRoute><MyDisputes /></ProtectedRoute>} />
                <Route path="/edit-requests" element={<ProtectedRoute><EditRequests /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
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
                
                <Route path="/admin/cms" element={<AdminRoute><AdminCMS /></AdminRoute>} />
                <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <AccessibilityWidget />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
