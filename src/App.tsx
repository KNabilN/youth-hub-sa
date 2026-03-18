import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "@/components/landing/PublicLayout";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ContentSkeleton } from "@/components/ContentSkeleton";
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
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Ratings = lazy(() => import("./pages/Ratings"));
const MyServices = lazy(() => import("./pages/MyServices"));
const AvailableProjects = lazy(() => import("./pages/AvailableProjects"));
const ProjectBidView = lazy(() => import("./pages/ProjectBidView"));
const MyBids = lazy(() => import("./pages/MyBids"));
const Earnings = lazy(() => import("./pages/Earnings"));

const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const TicketCreate = lazy(() => import("./pages/TicketCreate"));
const TicketDetail = lazy(() => import("./pages/TicketDetail"));
const Associations = lazy(() => import("./pages/Associations"));
const Donations = lazy(() => import("./pages/Donations"));
const ImpactReports = lazy(() => import("./pages/ImpactReports"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Profile = lazy(() => import("./pages/Profile"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const Invoices = lazy(() => import("./pages/Invoices"));
const MyDisputes = lazy(() => import("./pages/MyDisputes"));
const DonorPurchases = lazy(() => import("./pages/DonorPurchases"));
const GrantRequests = lazy(() => import("./pages/GrantRequests"));
const MyGrantRequests = lazy(() => import("./pages/MyGrantRequests"));
const DonorsPage = lazy(() => import("./pages/Donors"));
const MyGrants = lazy(() => import("./pages/MyGrants"));
const ReceivedGrants = lazy(() => import("./pages/ReceivedGrants"));
const AssociationImpactReports = lazy(() => import("./pages/AssociationImpactReports"));

const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCallback = lazy(() => import("./pages/PaymentCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Messages = lazy(() => import("./pages/Messages"));
const Notifications = lazy(() => import("./pages/Notifications"));
const TimeTracking = lazy(() => import("./pages/TimeTracking"));
const TimeLogs = lazy(() => import("./pages/TimeLogs"));
const Trash = lazy(() => import("./pages/Trash"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminServices = lazy(() => import("./pages/admin/AdminServices"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminDisputeDetail = lazy(() => import("./pages/admin/AdminDisputeDetail"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

const AdminTickets = lazy(() => import("./pages/admin/AdminTickets"));
const AdminTicketDetail = lazy(() => import("./pages/admin/AdminTicketDetail"));
const AdminCMS = lazy(() => import("./pages/admin/AdminCMS"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminServiceDetail = lazy(() => import("./pages/admin/AdminServiceDetail"));
const AdminProjectDetail = lazy(() => import("./pages/admin/AdminProjectDetail"));
const AdminHypotheses = lazy(() => import("./pages/admin/AdminHypotheses"));
const AdminContracts = lazy(() => import("./pages/admin/AdminContracts"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const ProjectPublicView = lazy(() => import("./pages/ProjectPublicView"));
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
    <div className="flex items-center justify-center min-h-screen animate-fade-in">
      <div className="space-y-4 w-full max-w-md px-8">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>;
}

const App = () => (
  <ErrorBoundary>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/about" element={<Suspense fallback={<PageLoader />}><About /></Suspense>} />
                  <Route path="/faq" element={<Suspense fallback={<PageLoader />}><FAQ /></Suspense>} />
                  <Route path="/profile/:id" element={<Suspense fallback={<PageLoader />}><PublicProfile /></Suspense>} />
                  <Route path="/services/:id" element={<Suspense fallback={<PageLoader />}><ServiceDetail /></Suspense>} />
                  <Route path="/projects/public/:id" element={<Suspense fallback={<PageLoader />}><ProjectPublicView /></Suspense>} />
                  <Route path="/cart" element={<SuspenseWrap><Cart /></SuspenseWrap>} />
                </Route>
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><SuspenseWrap><Dashboard /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><SuspenseWrap><Projects /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/projects/new" element={<ProtectedRoute><SuspenseWrap><ProjectCreate /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><SuspenseWrap><ProjectDetails /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/projects/:id/edit" element={<ProtectedRoute><SuspenseWrap><ProjectEdit /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/marketplace" element={<ProtectedRoute><SuspenseWrap><Marketplace /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/ratings" element={<ProtectedRoute><SuspenseWrap><Ratings /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/my-services" element={<ProtectedRoute><SuspenseWrap><MyServices /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/available-projects" element={<ProtectedRoute><SuspenseWrap><AvailableProjects /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/available-projects/:id" element={<ProtectedRoute><SuspenseWrap><ProjectBidView /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/my-bids" element={<ProtectedRoute><SuspenseWrap><MyBids /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/earnings" element={<ProtectedRoute><SuspenseWrap><Earnings /></SuspenseWrap></ProtectedRoute>} />
                
                <Route path="/tickets" element={<ProtectedRoute><SuspenseWrap><SupportTickets /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/tickets/new" element={<ProtectedRoute><SuspenseWrap><TicketCreate /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/tickets/:id" element={<ProtectedRoute><SuspenseWrap><TicketDetail /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/associations" element={<ProtectedRoute><SuspenseWrap><Associations /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/associations/:id" element={<ProtectedRoute><SuspenseWrap><PublicProfile /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/donations" element={<ProtectedRoute><SuspenseWrap><Donations /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/impact" element={<ProtectedRoute><SuspenseWrap><ImpactReports /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/contracts" element={<ProtectedRoute><SuspenseWrap><Contracts /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/my-projects" element={<ProtectedRoute><SuspenseWrap><MyProjects /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><SuspenseWrap><Invoices /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/my-disputes" element={<ProtectedRoute><SuspenseWrap><MyDisputes /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/donor-purchases" element={<ProtectedRoute><SuspenseWrap><DonorPurchases /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/grant-requests" element={<ProtectedRoute><SuspenseWrap><GrantRequests /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/my-grant-requests" element={<ProtectedRoute><SuspenseWrap><MyGrantRequests /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/donors" element={<ProtectedRoute><SuspenseWrap><DonorsPage /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/my-grants" element={<ProtectedRoute><SuspenseWrap><MyGrants /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/received-grants" element={<ProtectedRoute><SuspenseWrap><ReceivedGrants /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/association-impact" element={<ProtectedRoute><SuspenseWrap><AssociationImpactReports /></SuspenseWrap></ProtectedRoute>} />
                
                
                <Route path="/checkout" element={<ProtectedRoute><SuspenseWrap><Checkout /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/payment-success" element={<ProtectedRoute><SuspenseWrap><PaymentSuccess /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/payment-callback" element={<ProtectedRoute><SuspenseWrap><PaymentCallback /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><SuspenseWrap><Messages /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><SuspenseWrap><Notifications /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/trash" element={<ProtectedRoute><AdminRoute><SuspenseWrap><Trash /></SuspenseWrap></AdminRoute></ProtectedRoute>} />
                <Route path="/guide" element={<ProtectedRoute><SuspenseWrap><UserGuide /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/time-tracking" element={<ProtectedRoute><SuspenseWrap><TimeTracking /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/time-logs" element={<ProtectedRoute><SuspenseWrap><TimeLogs /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><SuspenseWrap><Profile /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/providers/:id" element={<ProtectedRoute><SuspenseWrap><PublicProfile /></SuspenseWrap></ProtectedRoute>} />
                <Route path="/admin/users" element={<AdminRoute><SuspenseWrap><AdminUsers /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/users/:id" element={<AdminRoute><SuspenseWrap><AdminUserDetail /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/projects" element={<AdminRoute><SuspenseWrap><AdminProjects /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/projects/:id" element={<AdminRoute><SuspenseWrap><AdminProjectDetail /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/services" element={<AdminRoute><SuspenseWrap><AdminServices /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/services/:id" element={<AdminRoute><SuspenseWrap><AdminServiceDetail /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/disputes" element={<AdminRoute><SuspenseWrap><AdminDisputes /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/contracts" element={<AdminRoute><SuspenseWrap><AdminContracts /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/disputes/:id" element={<AdminRoute><SuspenseWrap><AdminDisputeDetail /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/finance" element={<AdminRoute><SuspenseWrap><AdminFinance /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><SuspenseWrap><AdminReports /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/settings" element={<AdminRoute><SuspenseWrap><AdminSettings /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/tickets" element={<AdminRoute><SuspenseWrap><AdminTickets /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/tickets/:id" element={<AdminRoute><SuspenseWrap><AdminTicketDetail /></SuspenseWrap></AdminRoute>} />
                
                <Route path="/admin/hypotheses" element={<AdminRoute><SuspenseWrap><AdminHypotheses /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/cms" element={<AdminRoute><SuspenseWrap><AdminCMS /></SuspenseWrap></AdminRoute>} />
                <Route path="/admin/notifications" element={<AdminRoute><SuspenseWrap><AdminNotifications /></SuspenseWrap></AdminRoute>} />
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
