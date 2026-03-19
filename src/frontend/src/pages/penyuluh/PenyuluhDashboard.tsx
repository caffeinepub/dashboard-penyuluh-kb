import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, FileText, PlusCircle, Send } from "lucide-react";
import {
  PageContent,
  SectionHeader,
  StatsCard,
} from "../../components/AppLayout";
import { useMyReports } from "../../hooks/useQueries";

interface PenyuluhDashboardProps {
  profileName: string;
  onNewReport: () => void;
  onViewHistory: () => void;
}

export default function PenyuluhDashboard({
  profileName,
  onNewReport,
  onViewHistory,
}: PenyuluhDashboardProps) {
  const { data: reports, isLoading } = useMyReports();

  const totalReports = reports?.length ?? 0;
  const submittedReports =
    reports?.filter((r) => (r.status as string) === "submitted").length ?? 0;
  const draftReports =
    reports?.filter((r) => (r.status as string) === "draft").length ?? 0;

  const recentReports = (reports ?? []).slice(0, 5);

  return (
    <PageContent>
      {/* Welcome banner */}
      <div className="bg-sidebar rounded-xl p-6 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sidebar-foreground/60 text-sm">Selamat datang,</p>
          <h2 className="text-sidebar-foreground font-bold text-xl mt-0.5">
            {profileName}
          </h2>
          <p className="text-sidebar-foreground/70 text-sm mt-1">
            Silakan buat atau lihat laporan rencana kerja harian Anda.
          </p>
        </div>
        <Button
          data-ocid="penyuluh.new_report.primary_button"
          onClick={onNewReport}
          className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shrink-0"
        >
          <PlusCircle size={16} className="mr-2" />
          Buat Laporan
        </Button>
      </div>

      <SectionHeader
        title="Statistik Laporan Saya"
        description="Ringkasan laporan rencana kerja harian Anda"
      />

      <div
        data-ocid="penyuluh.stats.panel"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <StatsCard
              title="Total Laporan"
              value={totalReports}
              icon={<FileText size={22} />}
              color="primary"
              description="Semua laporan saya"
            />
            <StatsCard
              title="Laporan Dikirim"
              value={submittedReports}
              icon={<Send size={22} />}
              color="success"
              description="Sudah dikirim ke Admin"
            />
            <StatsCard
              title="Masih Draf"
              value={draftReports}
              icon={<Clock size={22} />}
              color="warning"
              description="Belum dikirim"
            />
          </>
        )}
      </div>

      {/* Recent reports */}
      <div className="bg-card rounded-lg border border-border shadow-xs">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Laporan Terbaru</h3>
          <Button
            variant="ghost"
            size="sm"
            data-ocid="penyuluh.view_history.link"
            onClick={onViewHistory}
            className="text-primary text-xs"
          >
            Lihat Semua
          </Button>
        </div>
        <div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentReports.length === 0 ? (
            <div
              data-ocid="penyuluh.recent.empty_state"
              className="py-12 text-center text-muted-foreground"
            >
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                Belum ada laporan. Mulai buat laporan baru!
              </p>
              <Button
                className="mt-4"
                size="sm"
                data-ocid="penyuluh.start.primary_button"
                onClick={onNewReport}
              >
                Buat Laporan Pertama
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentReports.map((report, idx) => (
                <div
                  key={report.nomorLaporan}
                  data-ocid={`penyuluh.recent.item.${idx + 1}`}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {report.namaKegiatan}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {report.nomorLaporan} &middot; {report.tanggal}
                    </p>
                  </div>
                  <Badge
                    className={
                      (report.status as string) === "submitted"
                        ? "bg-success/15 text-green-700 border-success/30 shrink-0"
                        : "bg-warning/20 text-yellow-700 border-warning/30 shrink-0"
                    }
                  >
                    {(report.status as string) === "submitted"
                      ? "Dikirim"
                      : "Draf"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContent>
  );
}
