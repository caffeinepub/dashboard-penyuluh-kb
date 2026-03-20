import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Eye, FileText, Paperclip, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContent, SectionHeader } from "../../components/AppLayout";
import { useMyReports, useSubmitReport } from "../../hooks/useQueries";
import { getDirectURLForHash } from "../../hooks/useStorageClient";
import { downloadReportPDF } from "../../utils/pdfGenerator";

interface ReportHistoryProps {
  userProfile: {
    name: string;
    nip: string;
    unitKerja: string;
    wilayah: string;
    tandaTangan?: string;
  };
}

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

interface AttachmentResolved {
  hash: string;
  url: string;
  mimeType: string;
  isImage: boolean;
  isPdf: boolean;
}

function AttachmentViewer({ lampiranIds }: { lampiranIds: string[] }) {
  const [items, setItems] = useState<AttachmentResolved[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lampiranIds.length) return;
    setLoading(true);
    Promise.all(
      lampiranIds.map(async (hash) => {
        const url = await getDirectURLForHash(hash);
        // Probe mime type via HEAD
        let mimeType = "";
        try {
          const resp = await fetch(url, { method: "HEAD" });
          mimeType = resp.headers.get("content-type") || "";
        } catch {
          mimeType = "";
        }
        const isImage = mimeType.startsWith("image/");
        const isPdf = mimeType === "application/pdf";
        return { hash, url, mimeType, isImage, isPdf };
      }),
    )
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [lampiranIds]);

  if (!lampiranIds.length) return null;

  return (
    <div className="space-y-3" data-ocid="history.lampiran.panel">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <Paperclip size={12} />
        Lampiran ({lampiranIds.length})
      </p>
      {loading ? (
        <div className="space-y-2">
          {lampiranIds.map((h) => (
            <Skeleton key={h} className="h-20 w-full rounded" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li
              key={item.hash}
              className="border border-border rounded-lg overflow-hidden"
              data-ocid={`history.lampiran.item.${idx + 1}`}
            >
              <div className="bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border">
                Lampiran {idx + 1}
              </div>
              {item.isImage ? (
                <div className="p-2">
                  <img
                    src={item.url}
                    alt={`Lampiran ${idx + 1}`}
                    className="w-full max-h-80 object-contain rounded"
                  />
                </div>
              ) : item.isPdf ? (
                <iframe
                  src={item.url}
                  title={`Lampiran ${idx + 1}`}
                  className="w-full"
                  style={{ height: "480px", border: "none" }}
                />
              ) : (
                <div className="flex items-center gap-3 px-3 py-3">
                  <FileText size={22} className="text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Lampiran {idx + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.mimeType || "Dokumen"}
                    </p>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline"
                  >
                    Buka
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ReportHistory({ userProfile }: ReportHistoryProps) {
  const { data: reports, isLoading } = useMyReports();
  const submitReport = useSubmitReport();
  const [detailReport, setDetailReport] = useState<
    NonNullable<typeof reports>[number] | null
  >(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Penyuluh downloads do NOT show status
  const handleDownload = async (report: NonNullable<typeof reports>[0]) => {
    try {
      setDownloadingId(report.nomorLaporan);
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
          lampiranIds: report.lampiranIds,
        },
        userProfile,
        { showStatus: false },
      );
    } catch {
      toast.error("Gagal mengunduh PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = async (nomorLaporan: string) => {
    try {
      await submitReport.mutateAsync(nomorLaporan);
      toast.success("Laporan berhasil dikirim!");
    } catch {
      toast.error("Gagal mengirim laporan. Silakan coba lagi.");
    }
  };

  return (
    <PageContent>
      <SectionHeader
        title="Riwayat Laporan"
        description="Daftar laporan rencana kerja harian yang pernah dibuat"
      />

      <div
        data-ocid="history.table"
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
            ) : !reports || reports.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="history.empty_state"
                >
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Belum ada laporan. Buat laporan pertama Anda!</p>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report, idx) => (
                <TableRow
                  key={report.nomorLaporan}
                  data-ocid={`history.item.${idx + 1}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell className="font-mono text-xs font-medium">
                    {report.nomorLaporan}
                  </TableCell>
                  <TableCell className="font-medium max-w-[180px] truncate">
                    {report.namaKegiatan}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {report.tanggal}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {report.lokasiKegiatan}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={report.status as string} />
                      {report.lampiranIds.length > 0 && (
                        <span
                          title={`${report.lampiranIds.length} lampiran`}
                          className="text-xs text-muted-foreground flex items-center gap-0.5"
                        >
                          <Paperclip size={11} />
                          {report.lampiranIds.length}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        data-ocid={`history.detail.button.${idx + 1}`}
                        className="h-8 w-8 p-0"
                        onClick={() => setDetailReport(report)}
                        title="Detail"
                      >
                        <Eye size={14} />
                      </Button>
                      {(report.status as string) === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`history.submit.button.${idx + 1}`}
                          className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleSubmit(report.nomorLaporan)}
                          disabled={submitReport.isPending}
                          title="Kirim"
                        >
                          <Send size={14} className="mr-1" />
                          Kirim
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`history.download.button.${idx + 1}`}
                        className="h-8"
                        onClick={() => handleDownload(report)}
                        disabled={downloadingId === report.nomorLaporan}
                        title="Unduh PDF"
                      >
                        <Download size={14} className="mr-1" />
                        {downloadingId === report.nomorLaporan
                          ? "Memuat..."
                          : "PDF"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <Dialog
        open={!!detailReport}
        onOpenChange={(open) => !open && setDetailReport(null)}
      >
        <DialogContent
          data-ocid="history.dialog"
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>Detail Laporan</DialogTitle>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Nomor Laporan", detailReport.nomorLaporan],
                  ["Tanggal", detailReport.tanggal],
                  ["Nama Kegiatan", detailReport.namaKegiatan],
                  ["Sasaran", detailReport.sasaran],
                  [
                    "Indikator Keberhasilan",
                    detailReport.indikatorKeberhasilan,
                  ],
                  ["Volume / Jumlah", detailReport.volume],
                  ["Metode Kegiatan", detailReport.metodeKegiatan],
                  ["Lokasi Kegiatan", detailReport.lokasiKegiatan],
                  ["Waktu Pelaksanaan", detailReport.waktuPelaksanaan],
                  ["Sumber Dana", detailReport.sumberDana],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="text-foreground">{value || "—"}</p>
                  </div>
                ))}
              </div>
              {detailReport.keterangan && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Keterangan
                  </p>
                  <p className="text-foreground">{detailReport.keterangan}</p>
                </div>
              )}

              {/* Attachments -- rendered inline */}
              {detailReport.lampiranIds.length > 0 && (
                <div className="border-t border-border pt-4">
                  <AttachmentViewer lampiranIds={detailReport.lampiranIds} />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  data-ocid="history.detail.download.button"
                  disabled={downloadingId === detailReport.nomorLaporan}
                  onClick={() => handleDownload(detailReport)}
                >
                  <Download size={14} className="mr-2" />
                  {downloadingId === detailReport.nomorLaporan
                    ? "Memuat lampiran..."
                    : "Unduh PDF"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContent>
  );
}
