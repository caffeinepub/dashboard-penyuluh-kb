import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export type AdminView = "admin-dashboard" | "admin-users" | "admin-reports";

export type PenyuluhView =
  | "penyuluh-dashboard"
  | "penyuluh-report-form"
  | "penyuluh-report-history";

export type AppView = AdminView | PenyuluhView;

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
}

const adminNavItems: NavItem[] = [
  {
    id: "admin-dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "admin-users",
    label: "Manajemen Pengguna",
    icon: <Users size={18} />,
  },
  {
    id: "admin-reports",
    label: "Semua Laporan",
    icon: <FileText size={18} />,
  },
];

const penyuluhNavItems: NavItem[] = [
  {
    id: "penyuluh-dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "penyuluh-report-form",
    label: "Buat Laporan",
    icon: <PlusCircle size={18} />,
  },
  {
    id: "penyuluh-report-history",
    label: "Riwayat Laporan",
    icon: <History size={18} />,
  },
];

interface AppLayoutProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  isAdmin: boolean;
  profileName: string;
  children: React.ReactNode;
}

export default function AppLayout({
  currentView,
  setCurrentView,
  isAdmin,
  profileName,
  children,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const navItems = isAdmin ? adminNavItems : penyuluhNavItems;
  const roleLabel = isAdmin ? "Administrator" : "Penyuluh KB";

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <img
          src="/assets/generated/bkkbn-logo-transparent.dim_400x120.png"
          alt="BKKBN"
          className="h-10 w-auto object-contain brightness-0 invert"
        />
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm shrink-0">
            {profileName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sidebar-foreground font-semibold text-sm truncate">
              {profileName}
            </p>
            <p className="text-sidebar-foreground/60 text-xs">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Menu utama">
        <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">
          Menu
        </p>
        {navItems.map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`nav.${item.id}.link`}
            onClick={() => {
              setCurrentView(item.id);
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              currentView === item.id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span>{item.label}</span>
            {currentView === item.id && (
              <ChevronRight size={14} className="ml-auto" />
            )}
          </button>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Logout */}
      <div className="px-3 py-4">
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-red-300 transition-colors"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 bg-sidebar z-50 lg:hidden"
            >
              <button
                type="button"
                className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-3 flex items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">
              {navItems.find((n) => n.id === currentView)?.label ?? "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Sistem Laporan Rencana Kerja Harian Penyuluh KB
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">
              {profileName}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// Page wrapper for consistent padding
export function PageContent({ children }: { children: React.ReactNode }) {
  return <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>;
}

// Stats card component
export function StatsCard({
  title,
  value,
  icon,
  color = "primary",
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "primary" | "success" | "warning" | "destructive";
  description?: string;
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="bg-card rounded-lg border border-border p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

// Section header
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
