import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Image,
  Loader2,
  Paperclip,
  Save,
  Send,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageContent, SectionHeader } from "../../components/AppLayout";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useCreateReport } from "../../hooks/useQueries";
import { useFileUpload } from "../../hooks/useStorageClient";

interface ReportFormProps {
  onSuccess: () => void;
}

const emptyForm = {
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
};

const MAX_FILES = 5;
const ACCEPTED_TYPES = "*";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/"))
    return <Image size={16} className="text-primary" />;
  if (file.type === "application/pdf")
    return <FileText size={16} className="text-red-500" />;
  if (
    file.type.includes("word") ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx")
  )
    return <FileText size={16} className="text-blue-500" />;
  if (
    file.type.includes("excel") ||
    file.type.includes("spreadsheet") ||
    file.name.endsWith(".xlsx") ||
    file.name.endsWith(".xls")
  )
    return <FileText size={16} className="text-green-500" />;
  return <Paperclip size={16} className="text-primary" />;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const { identity } = useInternetIdentity();
  const createReport = useCreateReport();
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    files,
    addFiles,
    removeFile,
    reset: resetFiles,
    uploadedHashes,
    isUploading,
  } = useFileUpload();

  const set =
    (field: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const required: (keyof typeof emptyForm)[] = [
      "nomorLaporan",
      "tanggal",
      "namaKegiatan",
      "sasaran",
      "indikatorKeberhasilan",
      "volume",
      "metodeKegiatan",
      "lokasiKegiatan",
      "waktuPelaksanaan",
      "sumberDana",
    ];
    return required.every((f) => form[f].trim() !== "");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) {
      toast.error(`Maksimal ${MAX_FILES} berkas per laporan.`);
      return;
    }

    const toProcess = selected.slice(0, remaining);
    const oversized = await addFiles(toProcess);
    if (oversized.length > 0) {
      toast.error(
        `${oversized.length} berkas melebihi batas 10 MB dan tidak ditambahkan.`,
      );
    }

    // Reset input so the same file can be added again after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (status: "draft" | "submitted") => {
    if (!validate()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi (*)");
      return;
    }
    if (!identity) {
      toast.error("Sesi tidak valid. Silakan login ulang.");
      return;
    }
    if (isUploading) {
      toast.error("Tunggu hingga semua berkas selesai diunggah.");
      return;
    }

    const failedUploads = files.filter((f) => f.status === "error");
    if (failedUploads.length > 0) {
      toast.error(
        "Beberapa berkas gagal diunggah. Hapus atau coba lagi sebelum mengirim.",
      );
      return;
    }

    try {
      const report = {
        ...form,
        status,
        author: identity.getPrincipal(),
        lampiranIds: uploadedHashes,
      };
      await createReport.mutateAsync(report);
      toast.success(
        status === "submitted"
          ? "Laporan berhasil dikirim!"
          : "Laporan berhasil disimpan sebagai draf.",
      );
      setForm(emptyForm);
      resetFiles();
      onSuccess();
    } catch {
      toast.error("Gagal menyimpan laporan. Silakan coba lagi.");
    }
  };

  const isPending = createReport.isPending;

  return (
    <PageContent>
      <SectionHeader
        title="Buat Laporan Rencana Kerja Harian"
        description="Isi formulir laporan sesuai Peraturan Menteri No. 10"
      />

      <form
        data-ocid="report.form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit("submitted");
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nomorLaporan">
                    Nomor Laporan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nomorLaporan"
                    data-ocid="report.nomorLaporan.input"
                    placeholder="Contoh: RKH/001/2026"
                    value={form.nomorLaporan}
                    onChange={set("nomorLaporan")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tanggal">
                    Tanggal <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tanggal"
                    type="date"
                    data-ocid="report.tanggal.input"
                    value={form.tanggal}
                    onChange={set("tanggal")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="namaKegiatan">
                    Nama Kegiatan yang Direncanakan{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="namaKegiatan"
                    data-ocid="report.namaKegiatan.input"
                    placeholder="Nama kegiatan yang akan dilaksanakan"
                    value={form.namaKegiatan}
                    onChange={set("namaKegiatan")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sasaran">
                    Sasaran <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sasaran"
                    data-ocid="report.sasaran.input"
                    placeholder="Target populasi / penerima manfaat"
                    value={form.sasaran}
                    onChange={set("sasaran")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="indikatorKeberhasilan">
                    Indikator Keberhasilan{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="indikatorKeberhasilan"
                    data-ocid="report.indikatorKeberhasilan.textarea"
                    placeholder="Indikator pencapaian keberhasilan kegiatan"
                    value={form.indikatorKeberhasilan}
                    onChange={set("indikatorKeberhasilan")}
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wide">
                  Detail Pelaksanaan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="volume">
                    Volume / Jumlah <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="volume"
                    data-ocid="report.volume.input"
                    placeholder="Contoh: 30 orang, 5 keluarga"
                    value={form.volume}
                    onChange={set("volume")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="metodeKegiatan">
                    Metode Kegiatan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="metodeKegiatan"
                    data-ocid="report.metodeKegiatan.input"
                    placeholder="Contoh: Penyuluhan tatap muka, kunjungan rumah"
                    value={form.metodeKegiatan}
                    onChange={set("metodeKegiatan")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lokasiKegiatan">
                    Lokasi Kegiatan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lokasiKegiatan"
                    data-ocid="report.lokasiKegiatan.input"
                    placeholder="Alamat / lokasi pelaksanaan"
                    value={form.lokasiKegiatan}
                    onChange={set("lokasiKegiatan")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="waktuPelaksanaan">
                    Waktu Pelaksanaan{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="waktuPelaksanaan"
                    data-ocid="report.waktuPelaksanaan.input"
                    placeholder="Contoh: 08.00 - 11.00 WIB"
                    value={form.waktuPelaksanaan}
                    onChange={set("waktuPelaksanaan")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sumberDana">
                    Sumber Dana <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sumberDana"
                    data-ocid="report.sumberDana.input"
                    placeholder="Contoh: APBN, APBD, Swadaya"
                    value={form.sumberDana}
                    onChange={set("sumberDana")}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Textarea
                    id="keterangan"
                    data-ocid="report.keterangan.textarea"
                    placeholder="Catatan tambahan (opsional)"
                    value={form.keterangan}
                    onChange={set("keterangan")}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attachment section */}
        <div className="mt-6">
          <Card className="shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
                  <Paperclip size={14} />
                  Lampiran Berkas
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {files.length}/{MAX_FILES} berkas
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Semua jenis berkas didukung: PDF, Word, Excel, gambar (JPG, PNG,
                WebP, HEIC), dan format lainnya. Ukuran maks. 10 MB per berkas.
              </p>

              {/* File list */}
              {files.length > 0 && (
                <ul className="space-y-2" data-ocid="report.lampiran.list">
                  {files.map((item, idx) => (
                    <li
                      key={`${item.file.name}-${idx}`}
                      data-ocid={`report.lampiran.item.${idx + 1}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                    >
                      <span className="flex-shrink-0">
                        {getFileIcon(item.file)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(item.file.size)}
                          </span>
                          {item.status === "uploading" && (
                            <span className="text-xs text-primary">
                              Mengunggah… {item.progress}%
                            </span>
                          )}
                          {item.status === "done" && (
                            <span className="text-xs text-green-600 font-medium">
                              ✓ Selesai
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="text-xs text-destructive">
                              ✗ Gagal: {item.error}
                            </span>
                          )}
                          {item.status === "pending" && (
                            <span className="text-xs text-muted-foreground">
                              Menunggu…
                            </span>
                          )}
                        </div>
                        {item.status === "uploading" && (
                          <Progress
                            value={item.progress}
                            className="h-1 mt-1"
                          />
                        )}
                      </div>
                      <button
                        type="button"
                        data-ocid={`report.lampiran.delete_button.${idx + 1}`}
                        className="flex-shrink-0 rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => removeFile(item.file)}
                        title="Hapus berkas"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={handleFileChange}
                data-ocid="report.lampiran.upload_button"
              />
              <Button
                type="button"
                variant="outline"
                data-ocid="report.lampiran.upload_button"
                disabled={files.length >= MAX_FILES || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload size={15} />
                Tambah Berkas
              </Button>

              {files.length >= MAX_FILES && (
                <p className="text-xs text-muted-foreground">
                  Batas maksimal {MAX_FILES} berkas tercapai.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            data-ocid="report.save_draft.secondary_button"
            disabled={isPending || isUploading}
            onClick={() => handleSubmit("draft")}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Simpan Draf
          </Button>
          <Button
            type="submit"
            data-ocid="report.submit_button"
            disabled={isPending || isUploading}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send size={16} className="mr-2" />
            )}
            {isUploading ? "Mengunggah berkas…" : "Kirim Laporan"}
          </Button>
        </div>
      </form>
    </PageContent>
  );
}
