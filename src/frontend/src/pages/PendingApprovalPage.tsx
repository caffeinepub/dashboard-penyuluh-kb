import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function PendingApprovalPage() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
    queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="mb-6">
          <img
            src="/assets/uploads/logo-bkkbn-1.jpg"
            alt="BKKBN"
            className="h-14 mx-auto object-contain mb-6"
          />
        </div>

        <div className="bg-card rounded-xl border border-border p-8 shadow-card">
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-warning/15 rounded-full">
              <Clock size={36} className="text-warning-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Menunggu Persetujuan
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Pendaftaran Anda telah diterima. Akun Anda sedang menunggu
            persetujuan dari Administrator. Silakan hubungi Admin atau periksa
            kembali nanti.
          </p>

          <div className="mt-6 p-4 bg-muted rounded-lg text-left space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Status Akun
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-warning-foreground" />
              <span className="text-sm font-medium text-foreground">
                Menunggu Persetujuan Admin
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              data-ocid="pending.refresh.button"
              variant="outline"
              onClick={handleRefresh}
              className="w-full"
            >
              <RefreshCw size={16} className="mr-2" />
              Periksa Status
            </Button>
            <Button
              data-ocid="pending.logout.button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-muted-foreground"
            >
              <LogOut size={16} className="mr-2" />
              Keluar
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()}. Dibangun dengan ❤️ menggunakan{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
