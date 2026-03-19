import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import AppLayout, { type AppView } from "./components/AppLayout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useGetCallerUserProfile,
  useIsCallerAdmin,
  useIsCallerApproved,
} from "./hooks/useQueries";
import LoginPage from "./pages/LoginPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminUsers from "./pages/admin/AdminUsers";
import PenyuluhDashboard from "./pages/penyuluh/PenyuluhDashboard";
import ReportForm from "./pages/penyuluh/ReportForm";
import ReportHistory from "./pages/penyuluh/ReportHistory";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <img
        src="/assets/generated/bkkbn-logo-transparent.dim_400x120.png"
        alt="BKKBN"
        className="h-12 object-contain"
      />
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Memuat sistem...</span>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const { data: isApproved, isLoading: approvalLoading } =
    useIsCallerApproved();
  const { data: isAdmin } = useIsCallerAdmin();

  const [currentView, setCurrentView] = useState<AppView>("penyuluh-dashboard");

  // Initializing Internet Identity
  if (isInitializing) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage showRegister={false} />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Logged in but loading profile
  if (profileLoading || !profileFetched) {
    return <LoadingScreen />;
  }

  // Logged in but no profile -> show register form
  if (!profile) {
    return (
      <>
        <LoginPage showRegister />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Has profile, checking approval
  if (approvalLoading) {
    return <LoadingScreen />;
  }

  // Not yet approved
  if (!isApproved) {
    return (
      <>
        <PendingApprovalPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // Set default view based on role
  const effectiveAdmin = isAdmin ?? false;
  const defaultAdminView: AppView = "admin-dashboard";
  const defaultPenyuluhView: AppView = "penyuluh-dashboard";

  const effectiveView: AppView = (() => {
    if (effectiveAdmin) {
      // Only allow admin views for admin users
      if (
        currentView === "admin-dashboard" ||
        currentView === "admin-users" ||
        currentView === "admin-reports"
      ) {
        return currentView;
      }
      return defaultAdminView;
    }
    if (
      currentView === "penyuluh-dashboard" ||
      currentView === "penyuluh-report-form" ||
      currentView === "penyuluh-report-history"
    ) {
      return currentView;
    }
    return defaultPenyuluhView;
  })();

  const renderContent = () => {
    switch (effectiveView) {
      case "admin-dashboard":
        return <AdminDashboard />;
      case "admin-users":
        return <AdminUsers />;
      case "admin-reports":
        return <AdminReports />;
      case "penyuluh-dashboard":
        return (
          <PenyuluhDashboard
            profileName={profile.name}
            onNewReport={() => setCurrentView("penyuluh-report-form")}
            onViewHistory={() => setCurrentView("penyuluh-report-history")}
          />
        );
      case "penyuluh-report-form":
        return (
          <ReportForm
            onSuccess={() => setCurrentView("penyuluh-report-history")}
          />
        );
      case "penyuluh-report-history":
        return (
          <ReportHistory
            userProfile={{
              name: profile.name,
              nip: profile.nip,
              unitKerja: profile.unitKerja,
              wilayah: profile.wilayah,
            }}
          />
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <>
      <AppLayout
        currentView={effectiveView}
        setCurrentView={setCurrentView}
        isAdmin={effectiveAdmin}
        profileName={profile.name}
      >
        {renderContent()}
      </AppLayout>
      <Toaster richColors position="top-right" />
      <footer className="hidden">
        <p>
          &copy; {new Date().getFullYear()}. Dibangun dengan ❤️ menggunakan{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </>
  );
}
