import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { LaporanRencanaKerja } from "../../backend.d";
import { PageContent, SectionHeader } from "../../components/AppLayout";
import { useActor } from "../../hooks/useActor";
import {
  useAdminDeleteReport,
  useAdminEditReport,
  useAllReports,
} from "../../hooks/useQueries";
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

type EditReportForm = {
  nomorLaporan: string;
  tanggal: string;
  namaKegiatan: string;
  sasaran: string;
  indikatorKeberhasilan: string;
  volume: string;
  metodeKegiatan: string;
  lokasiKegiatan: string;
  waktuPelaksanaan: string;
  sumberDana: string;
  keterangan: string;
  status: string;
};

export default function AdminReports() {
  const { data: reports, isLoading } = useAllReports();
  const editReport = useAdminEditReport();
  const deleteReport = useAdminDeleteReport();
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<LaporanRencanaKerja | null>(
    null,
  );
  const [editForm, setEditForm] = useState<EditReportForm>({
    nomorLaporan: "",
    tanggal: "",
    namaKegiatan: "",
    sasaran: "",
    indikatorKeberhasilan: "",
    volume: "",
    metodeKegiatan: "",
    lokasiKegiatan: "",
    waktuPelaksanaan: "",
    sumberDana: "",
    keterangan: "",
    status: "draft",
  });
  const { actor } = useActor();
  const [deleteTarget, setDeleteTarget] = useState<LaporanRencanaKerja | null>(
    null,
  );

  const filtered = (reports ?? []).filter(
    (r) =>
      r.namaKegiatan.toLowerCase().includes(search.toLowerCase()) ||
      r.nomorLaporan.toLowerCase().includes(search.toLowerCase()) ||
      r.lokasiKegiatan.toLowerCase().includes(search.toLowerCase()),
  );

  // Admin downloads include the status field
  const handleDownload = async (report: LaporanRencanaKerja) => {
    try {
      let authorProfile = {
        name: "(Penyuluh KB)",
        nip: "-",
        unitKerja: "-",
        wilayah: "-",
        tandaTangan: "",
      };
      if (actor && report.author) {
        try {
          const fetched = await actor.getUserProfile(report.author as any);
          if (fetched) {
            authorProfile = {
              name: (fetched as any).name ?? authorProfile.name,
              nip: (fetched as any).nip ?? authorProfile.nip,
              unitKerja: (fetched as any).unitKerja ?? authorProfile.unitKerja,
              wilayah: (fetched as any).wilayah ?? authorProfile.wilayah,
              tandaTangan: (fetched as any).tandaTangan ?? "",
            };
          }
        } catch {
          // fall back to defaults
        }
      }
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
        authorProfile,
        { showStatus: true },
      );
    } catch {
      toast.error("Gagal mengunduh PDF.");
    }
  };

  const openEditDialog = (report: LaporanRencanaKerja) => {
    setEditForm({
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
    });
    setEditTarget(report);
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    try {
      await editReport.mutateAsync({
        author: editTarget.author,
        nomorLaporan: editTarget.nomorLaporan,
        updatedReport: {
          nomorLaporan: editForm.nomorLaporan,
          tanggal: editForm.tanggal,
          namaKegiatan: editForm.namaKegiatan,
          sasaran: editForm.sasaran,
          indikatorKeberhasilan: editForm.indikatorKeberhasilan,
          volume: editForm.volume,
          metodeKegiatan: editForm.metodeKegiatan,
          lokasiKegiatan: editForm.lokasiKegiatan,
          waktuPelaksanaan: editForm.waktuPelaksanaan,
          sumberDana: editForm.sumberDana,
          keterangan: editForm.keterangan,
          status: editForm.status as any,
          lampiranIds: editTarget.lampiranIds,
        },
      });
      toast.success("Laporan berhasil diperbarui");
      setEditTarget(null);
    } catch {
      toast.error("Gagal memperbarui laporan. Silakan coba lagi.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReport.mutateAsync({
        author: deleteTarget.author,
        nomorLaporan: deleteTarget.nomorLaporan,
      });
      toast.success(`Laporan ${deleteTarget.nomorLaporan} berhasil dihapus`);
      setDeleteTarget(null);
    } catch {
      toast.error("Gagal menghapus laporan. Silakan coba lagi.");
    }
  };

  const setField = (field: keyof EditReportForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
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
                    <div className="flex items-center justify-end gap-1.5">
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
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`reports.edit_button.${idx + 1}`}
                        className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => openEditDialog(report)}
                      >
                        <Pencil size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid={`reports.delete_button.${idx + 1}`}
                        className="h-8 border-destructive/30 text-red-600 hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(report)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Hapus
                      </Button>
                    </div>
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

      {/* Edit Report Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent data-ocid="reports.edit.dialog" className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Laporan</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="r-nomor">Nomor Laporan</Label>
                  <Input
                    id="r-nomor"
                    data-ocid="reports.edit.nomorLaporan.input"
                    value={editForm.nomorLaporan}
                    onChange={(e) => setField("nomorLaporan", e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="r-tanggal">Tanggal</Label>
                  <Input
                    id="r-tanggal"
                    data-ocid="reports.edit.tanggal.input"
                    value={editForm.tanggal}
                    onChange={(e) => setField("tanggal", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-nama">Nama Kegiatan</Label>
                <Input
                  id="r-nama"
                  data-ocid="reports.edit.namaKegiatan.input"
                  value={editForm.namaKegiatan}
                  onChange={(e) => setField("namaKegiatan", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-sasaran">Sasaran</Label>
                <Input
                  id="r-sasaran"
                  data-ocid="reports.edit.sasaran.input"
                  value={editForm.sasaran}
                  onChange={(e) => setField("sasaran", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-indikator">Indikator Keberhasilan</Label>
                <Input
                  id="r-indikator"
                  data-ocid="reports.edit.indikator.input"
                  value={editForm.indikatorKeberhasilan}
                  onChange={(e) =>
                    setField("indikatorKeberhasilan", e.target.value)
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="r-volume">Volume</Label>
                  <Input
                    id="r-volume"
                    data-ocid="reports.edit.volume.input"
                    value={editForm.volume}
                    onChange={(e) => setField("volume", e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="r-metode">Metode Kegiatan</Label>
                  <Input
                    id="r-metode"
                    data-ocid="reports.edit.metode.input"
                    value={editForm.metodeKegiatan}
                    onChange={(e) => setField("metodeKegiatan", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="r-lokasi">Lokasi Kegiatan</Label>
                  <Input
                    id="r-lokasi"
                    data-ocid="reports.edit.lokasi.input"
                    value={editForm.lokasiKegiatan}
                    onChange={(e) => setField("lokasiKegiatan", e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="r-waktu">Waktu Pelaksanaan</Label>
                  <Input
                    id="r-waktu"
                    data-ocid="reports.edit.waktu.input"
                    value={editForm.waktuPelaksanaan}
                    onChange={(e) =>
                      setField("waktuPelaksanaan", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-sumber">Sumber Dana</Label>
                <Input
                  id="r-sumber"
                  data-ocid="reports.edit.sumberDana.input"
                  value={editForm.sumberDana}
                  onChange={(e) => setField("sumberDana", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-keterangan">Keterangan</Label>
                <Textarea
                  id="r-keterangan"
                  data-ocid="reports.edit.keterangan.textarea"
                  value={editForm.keterangan}
                  onChange={(e) => setField("keterangan", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="r-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setField("status", val)}
                >
                  <SelectTrigger
                    id="r-status"
                    data-ocid="reports.edit.status.select"
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draf</SelectItem>
                    <SelectItem value="submitted">Dikirim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="reports.edit.cancel_button"
              onClick={() => setEditTarget(null)}
            >
              Batal
            </Button>
            <Button
              data-ocid="reports.edit.save_button"
              onClick={handleEditSubmit}
              disabled={editReport.isPending}
            >
              {editReport.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Report AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="reports.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Laporan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus laporan{" "}
              <strong>{deleteTarget?.nomorLaporan}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="reports.delete.cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="reports.delete.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContent>
  );
}
