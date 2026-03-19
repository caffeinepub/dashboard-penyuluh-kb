import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, FileText, Send, Users } from "lucide-react";
import {
  PageContent,
  SectionHeader,
  StatsCard,
} from "../../components/AppLayout";
import { useAdminStats } from "../../hooks/useQueries";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <PageContent>
      <SectionHeader
        title="Dashboard Administrator"
        description="Ringkasan statistik sistem laporan rencana kerja harian"
      />

      <div
        data-ocid="admin.stats.panel"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <StatsCard
              title="Total Pengguna"
              value={stats ? Number(stats.totalUsers) : 0}
              icon={<Users size={22} />}
              color="primary"
              description="Semua pengguna terdaftar"
            />
            <StatsCard
              title="Pengguna Disetujui"
              value={stats ? Number(stats.approvedUsers) : 0}
              icon={<CheckCircle size={22} />}
              color="success"
              description="Akun aktif & terverifikasi"
            />
            <StatsCard
              title="Total Laporan"
              value={stats ? Number(stats.totalReports) : 0}
              icon={<FileText size={22} />}
              color="primary"
              description="Semua laporan tersimpan"
            />
            <StatsCard
              title="Laporan Dikirim"
              value={stats ? Number(stats.submittedReports) : 0}
              icon={<Send size={22} />}
              color="warning"
              description="Laporan status terkirim"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-lg border border-border p-5 shadow-xs">
          <h3 className="font-semibold text-foreground mb-4">
            Panduan Administrator
          </h3>
          <div className="space-y-3">
            {[
              {
                step: "1",
                title: "Kelola Pengguna",
                desc: "Tinjau dan setujui pendaftaran pengguna baru di menu Manajemen Pengguna.",
              },
              {
                step: "2",
                title: "Monitor Laporan",
                desc: "Lihat semua laporan yang telah dikirim oleh Penyuluh KB di menu Semua Laporan.",
              },
              {
                step: "3",
                title: "Unduh Laporan",
                desc: "Setiap laporan dapat diunduh dalam format PDF untuk keperluan dokumentasi.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 shadow-xs">
          <h3 className="font-semibold text-foreground mb-4">Tentang Sistem</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Sistem ini digunakan untuk mencatat dan mengelola Laporan Rencana
              Kerja Harian (RKH) Penyuluh KB sesuai dengan Peraturan Menteri
              Nomor 10.
            </p>
            <p>
              Setiap Penyuluh KB wajib mengisi laporan harian yang mencakup
              kegiatan terencana, sasaran, indikator keberhasilan, dan informasi
              pelaksanaan kegiatan.
            </p>
          </div>
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs font-semibold text-primary">Dasar Hukum</p>
            <p className="text-xs text-muted-foreground mt-1">
              Peraturan Menteri (Permen) No. 10 tentang Penyuluh Keluarga
              Berencana
            </p>
          </div>
        </div>
      </div>
    </PageContent>
  );
}
