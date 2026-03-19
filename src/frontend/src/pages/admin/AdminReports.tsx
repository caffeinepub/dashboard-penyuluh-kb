import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContent, SectionHeader } from "../../components/AppLayout";
import { useAllReports } from "../../hooks/useQueries";
import { downloadReportPDF } from "../../utils/pdfGenerator";

function StatusBadge({ status }: { status: string }) {
  if (status === "submitted")
    return (
      <Badge className="bg-success/15 text-green-700 border-success/30">
        Dikirim
      </Badge>
    );
  return (
    <Badge className="bg-warning/20 text-yellow-700 border-warning/30">
      Draf
    </Badge>
  );
}

export default function AdminReports() {
  const { data: reports, isLoading } = useAllReports();
  const [search, setSearch] = useState("");

  const filtered = (reports ?? []).filter(
    (r) =>
      r.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
      r.nomorLaporan.toLowerCase().includes(search.toLowerCase()) ||
      r.lokasiKegiatan.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDownload = async (report: (typeof filtered)[0]) => {
    try {
      await downloadReportPDF(
        {
          nomorLaporan: report.nomorLaporan,
          tanggal: report.tanggal,
          namaKegiatan: report.namaKegiatan,
          sasaran: report.sasaran,
          indikatorKeberhasilan: report.indikatorKeberhasilan,
          volume: report.volume,
          metodeKegiatan: report.metodeKegiatan,
          lokasiKegiatan: report.lokasiKegiatan,
          waktuPelaksanaan: report.waktuPelaksanaan,
          sumberDana: report.sumberDana,
          keterangan: report.keterangan,
          status: report.status as string,
        },
        {
          name: "(Penyuluh KB)",
          nip: "-",
          unitKerja: "-",
          wilayah: "-",
        },
      );
    } catch {
      toast.error("Gagal mengunduh PDF.");
    }
  };

  return (
    <PageContent>
      <SectionHeader
        title="Semua Laporan"
        description="Daftar seluruh laporan dari semua Penyuluh KB"
      />

      <div className="mb-4 relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          data-ocid="reports.search_input"
          placeholder="Cari laporan berdasarkan nama kegiatan, nomor, atau lokasi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div
        data-ocid="reports.table"
        className="bg-card rounded-lg border border-border shadow-xs overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="font-semibold">No. Laporan</TableHead>
              <TableHead className="font-semibold">Nama Kegiatan</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">
                Tanggal
              </TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">
                Lokasi
              </TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="reports.empty_state"
                >
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p>
                    {search
                      ? "Tidak ditemukan laporan yang sesuai"
                      : "Belum ada laporan yang dikirim"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((report, idx) => (
                <TableRow
                  key={report.nomorLaporan}
                  data-ocid={`reports.item.${idx + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-mono text-xs font-medium">
                    {report.nomorLaporan}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {report.namaKegiatan}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {report.tanggal}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {report.lokasiKegiatan}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={report.status as string} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      data-ocid={`reports.download.button.${idx + 1}`}
                      onClick={() => handleDownload(report)}
                      className="h-8"
                    >
                      <Download size={14} className="mr-1" />
                      PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          Menampilkan {filtered.length} laporan
          {search ? ` dari pencarian "${search}"` : ""}
        </p>
      )}
    </PageContent>
  );
}
