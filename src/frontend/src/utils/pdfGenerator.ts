import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getDirectURLForHash } from "../hooks/useStorageClient";

export interface ReportData {
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
  lampiranIds?: string[];
}

export interface UserProfileData {
  name: string;
  nip: string;
  unitKerja: string;
  wilayah: string;
}

async function fetchLogoBytes(): Promise<Uint8Array | null> {
  try {
    const response = await fetch("/assets/uploads/logo-bkkbn-1.jpg");
    const buf = await response.arrayBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

/**
 * Detect MIME type from magic bytes in file content.
 * This is more reliable than trusting HTTP headers or URL extensions.
 */
function detectMimeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 4) return "application/octet-stream";

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // GIF: 47 49 46 38
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  // BMP: 42 4D
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }
  // PDF: %PDF
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  // DOCX/ZIP: PK (50 4B 03 04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  // DOC: D0 CF 11 E0
  if (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  ) {
    return "application/msword";
  }
  // HEIC/HEIF: check ftyp box at offset 4
  if (bytes.length >= 12) {
    const ftyp = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (ftyp === "ftyp") {
      return "image/heic";
    }
  }
  return "application/octet-stream";
}

/**
 * Convert image bytes to JPEG via canvas using a blob object URL.
 * This avoids CORS issues since the object URL is same-origin.
 */
async function imageBytesToJpeg(
  bytes: Uint8Array,
  mimeType: string,
): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: mimeType || "image/jpeg",
    });
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (jpegBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (!jpegBlob) {
              resolve(null);
              return;
            }
            jpegBlob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
          },
          "image/jpeg",
          0.88,
        );
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

interface AttachmentData {
  bytes: Uint8Array;
  jpegBytes: Uint8Array | null;
  mimeType: string;
  isImage: boolean;
  isPdf: boolean;
  index: number;
  fileName: string;
}

async function resolveAttachments(
  lampiranIds: string[],
): Promise<AttachmentData[]> {
  const items: AttachmentData[] = [];
  for (let i = 0; i < lampiranIds.length; i++) {
    const hash = lampiranIds[i];
    try {
      const url = await getDirectURLForHash(hash);
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const arrayBuffer = await resp.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Step 1: Try magic bytes detection first (most reliable)
      let mimeType = detectMimeFromBytes(bytes);

      // Step 2: If still generic, try HTTP Content-Type header
      if (mimeType === "application/octet-stream") {
        const headerType = resp.headers.get("content-type") || "";
        if (headerType && headerType !== "application/octet-stream") {
          mimeType = headerType.split(";")[0].trim();
        }
      }

      // Step 3: If still generic, try URL extension
      if (mimeType === "application/octet-stream") {
        const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
        const extMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          heic: "image/heic",
          heif: "image/heif",
          bmp: "image/bmp",
          tiff: "image/tiff",
          tif: "image/tiff",
          svg: "image/svg+xml",
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          xls: "application/vnd.ms-excel",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ppt: "application/vnd.ms-powerpoint",
          txt: "text/plain",
          csv: "text/csv",
          mp4: "video/mp4",
          mov: "video/quicktime",
          mp3: "audio/mpeg",
          zip: "application/zip",
          rar: "application/x-rar-compressed",
        };
        if (extMap[ext]) mimeType = extMap[ext];
      }

      const isImage = mimeType.startsWith("image/");
      const isPdf = mimeType === "application/pdf";

      // Convert image to JPEG using blob object URL (no CORS issues)
      let jpegBytes: Uint8Array | null = null;
      if (isImage) {
        jpegBytes = await imageBytesToJpeg(bytes, mimeType);
      }

      items.push({
        bytes,
        jpegBytes,
        mimeType,
        isImage,
        isPdf,
        index: i + 1,
        fileName: `Lampiran ${i + 1}`,
      });
    } catch {
      // skip failed attachment
    }
  }
  return items;
}

function getAttachmentTypeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "FOTO/GAMBAR";
  if (mimeType === "application/pdf") return "DOKUMEN PDF";
  if (mimeType.includes("word") || mimeType === "application/msword")
    return "DOKUMEN WORD";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "DOKUMEN EXCEL";
  if (mimeType.includes("powerpoint") || mimeType.includes("presentation"))
    return "DOKUMEN PRESENTASI";
  if (mimeType === "text/plain" || mimeType === "text/csv")
    return "DOKUMEN TEKS";
  if (mimeType.startsWith("video/")) return "FILE VIDEO";
  if (mimeType.startsWith("audio/")) return "FILE AUDIO";
  if (mimeType.includes("zip") || mimeType.includes("rar")) return "FILE ARSIP";
  return "BERKAS LAINNYA";
}

export async function downloadReportPDF(
  report: ReportData,
  userProfile: UserProfileData,
  options?: { showStatus?: boolean },
) {
  const showStatus = options?.showStatus ?? false;

  const [logoBytes, attachments] = await Promise.all([
    fetchLogoBytes(),
    resolveAttachments(report.lampiranIds || []),
  ]);

  const mainDoc = await PDFDocument.create();
  const helveticaBold = await mainDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await mainDoc.embedFont(StandardFonts.Helvetica);

  const PAGE_WIDTH = 595;
  const PAGE_HEIGHT = 842;
  const MARGIN = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  function lastPage() {
    return mainDoc.getPage(mainDoc.getPageCount() - 1);
  }

  function addNewPage() {
    mainDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return PAGE_HEIGHT - MARGIN;
  }

  function drawWrappedText(
    page: ReturnType<typeof mainDoc.getPage>,
    text: string,
    x: number,
    startY: number,
    opts: {
      font?: typeof helvetica;
      size?: number;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
    },
  ): number {
    const font = opts.font ?? helvetica;
    const size = opts.size ?? 10;
    const color = opts.color ?? rgb(0.1, 0.1, 0.1);
    const maxWidth = opts.maxWidth ?? CONTENT_WIDTH;

    const words = String(text ?? "").split(" ");
    let line = "";
    let currentY = startY;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const w = font.widthOfTextAtSize(testLine, size);
      if (w > maxWidth && line) {
        page.drawText(line, { x, y: currentY, size, font, color });
        currentY -= size + 4;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x, y: currentY, size, font, color });
      currentY -= size + 4;
    }
    return currentY;
  }

  // -- Page 1 --
  mainDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  // --- Header with logo ---
  const HEADER_H = 70;
  const p1 = lastPage();
  p1.drawRectangle({
    x: MARGIN,
    y: y - HEADER_H,
    width: CONTENT_WIDTH,
    height: HEADER_H,
    color: rgb(0.1, 0.22, 0.42),
  });

  if (logoBytes) {
    try {
      const logoImg = await mainDoc.embedJpg(logoBytes);
      const logoScale = Math.min(60 / logoImg.height, 80 / logoImg.width);
      const lw = logoImg.width * logoScale;
      const lh = logoImg.height * logoScale;
      p1.drawImage(logoImg, {
        x: MARGIN + 10,
        y: y - HEADER_H + (HEADER_H - lh) / 2,
        width: lw,
        height: lh,
      });
    } catch {
      // no logo
    }
  }

  const txtX = MARGIN + 100;
  p1.drawText("LAPORAN RENCANA KERJA HARIAN PENYULUH KB", {
    x: txtX,
    y: y - 28,
    size: 11,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });
  p1.drawText("Berdasarkan Peraturan Menteri (Permen) Nomor 10", {
    x: txtX,
    y: y - 46,
    size: 9,
    font: helvetica,
    color: rgb(0.85, 0.85, 0.85),
  });
  p1.drawText("BKKBN Kemendukbangga", {
    x: txtX,
    y: y - 60,
    size: 8,
    font: helvetica,
    color: rgb(0.75, 0.75, 0.75),
  });

  y -= HEADER_H + 20;

  // --- Identitas Penyuluh ---
  p1.drawRectangle({
    x: MARGIN,
    y: y - 14,
    width: 4,
    height: 14,
    color: rgb(0.1, 0.22, 0.42),
  });
  p1.drawText("IDENTITAS PENYULUH", {
    x: MARGIN + 10,
    y: y - 12,
    size: 10,
    font: helveticaBold,
    color: rgb(0.1, 0.22, 0.42),
  });
  y -= 24;

  const identRows: [string, string][] = [
    ["Nama", userProfile.name],
    ["NIP", userProfile.nip],
    ["Unit Kerja", userProfile.unitKerja],
    ["Wilayah", userProfile.wilayah],
  ];
  for (const [label, val] of identRows) {
    p1.drawText(label, {
      x: MARGIN,
      y,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    p1.drawText(":", {
      x: MARGIN + 110,
      y,
      size: 9.5,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    p1.drawText(String(val ?? "-"), {
      x: MARGIN + 120,
      y,
      size: 9.5,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 16;
  }

  y -= 10;

  // --- Detail Laporan ---
  p1.drawRectangle({
    x: MARGIN,
    y: y - 14,
    width: 4,
    height: 14,
    color: rgb(0.1, 0.22, 0.42),
  });
  p1.drawText("DETAIL LAPORAN", {
    x: MARGIN + 10,
    y: y - 12,
    size: 10,
    font: helveticaBold,
    color: rgb(0.1, 0.22, 0.42),
  });
  y -= 24;

  const reportRows: [string, string][] = [
    ["Nomor Laporan", report.nomorLaporan],
    ["Tanggal", report.tanggal],
    ["Nama Kegiatan", report.namaKegiatan],
    ["Sasaran", report.sasaran],
    ["Indikator Keberhasilan", report.indikatorKeberhasilan],
    ["Volume / Jumlah", report.volume],
    ["Metode Kegiatan", report.metodeKegiatan],
    ["Lokasi Kegiatan", report.lokasiKegiatan],
    ["Waktu Pelaksanaan", report.waktuPelaksanaan],
    ["Sumber Dana", report.sumberDana],
    ["Keterangan", report.keterangan || "-"],
  ];

  if (showStatus) {
    reportRows.push([
      "Status",
      report.status === "submitted" ? "Dikirim" : "Draf",
    ]);
  }

  let rowIsEven = false;
  for (const [label, val] of reportRows) {
    const rowH = 22;
    const valStr = String(val ?? "-");
    const estimatedLines = Math.ceil(valStr.length / 55);
    const dynH = Math.max(rowH, estimatedLines * 14 + 8);

    if (y - dynH < MARGIN + 80) {
      y = addNewPage();
      const np = lastPage();
      np.drawRectangle({
        x: MARGIN,
        y: y - 16,
        width: CONTENT_WIDTH,
        height: 16,
        color: rgb(0.1, 0.22, 0.42),
      });
      np.drawText("DETAIL LAPORAN (lanjutan)", {
        x: MARGIN + 4,
        y: y - 12,
        size: 9,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
      y -= 26;
    }

    const currentPage = lastPage();

    if (rowIsEven) {
      currentPage.drawRectangle({
        x: MARGIN,
        y: y - dynH,
        width: CONTENT_WIDTH,
        height: dynH,
        color: rgb(0.96, 0.97, 1),
      });
    }
    currentPage.drawText(label, {
      x: MARGIN + 6,
      y: y - 14,
      size: 9.5,
      font: helveticaBold,
      color: rgb(0.1, 0.22, 0.42),
    });

    const labelColW = 160;
    const valueX = MARGIN + labelColW + 10;
    const valueMaxW = CONTENT_WIDTH - labelColW - 16;
    const valWords = valStr.split(" ");
    let line2 = "";
    let lineY = y - 14;
    for (const w of valWords) {
      const testLine = line2 ? `${line2} ${w}` : w;
      const tw = helvetica.widthOfTextAtSize(testLine, 9.5);
      if (tw > valueMaxW && line2) {
        currentPage.drawText(line2, {
          x: valueX,
          y: lineY,
          size: 9.5,
          font: helvetica,
          color: rgb(0.1, 0.1, 0.1),
        });
        lineY -= 13;
        line2 = w;
      } else {
        line2 = testLine;
      }
    }
    if (line2) {
      currentPage.drawText(line2, {
        x: valueX,
        y: lineY,
        size: 9.5,
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    currentPage.drawLine({
      start: { x: MARGIN, y: y - dynH },
      end: { x: MARGIN + CONTENT_WIDTH, y: y - dynH },
      thickness: 0.5,
      color: rgb(0.85, 0.87, 0.95),
    });
    y -= dynH;
    rowIsEven = !rowIsEven;
  }

  // --- Lampiran summary section ---
  if (attachments.length > 0) {
    y -= 10;
    if (y < MARGIN + 60) {
      y = addNewPage();
    }
    const sumPage = lastPage();
    sumPage.drawRectangle({
      x: MARGIN,
      y: y - 14,
      width: 4,
      height: 14,
      color: rgb(0.1, 0.22, 0.42),
    });
    sumPage.drawText("LAMPIRAN", {
      x: MARGIN + 10,
      y: y - 12,
      size: 10,
      font: helveticaBold,
      color: rgb(0.1, 0.22, 0.42),
    });
    y -= 24;
    sumPage.drawText(
      `Terdapat ${attachments.length} file lampiran yang terlampir pada halaman berikutnya.`,
      {
        x: MARGIN,
        y,
        size: 9.5,
        font: helvetica,
        color: rgb(0.3, 0.3, 0.3),
      },
    );
    y -= 16;
    for (const att of attachments) {
      if (y < MARGIN + 20) break;
      const typeLabel = att.isImage
        ? "Foto/Gambar"
        : att.isPdf
          ? "Dokumen PDF"
          : "Dokumen";
      sumPage.drawText(`Lampiran ${att.index}: ${typeLabel}`, {
        x: MARGIN + 10,
        y,
        size: 9,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 14;
    }
  }

  // --- Signature ---
  y -= 30;
  if (y < MARGIN + 80) {
    y = addNewPage() - 30;
  }
  const sigPage = lastPage();
  sigPage.drawText("Yang Membuat Laporan,", {
    x: PAGE_WIDTH - MARGIN - 160,
    y,
    size: 9.5,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 60;
  sigPage.drawLine({
    start: { x: PAGE_WIDTH - MARGIN - 170, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.8,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= 16;
  sigPage.drawText(userProfile.name, {
    x: PAGE_WIDTH - MARGIN - 165,
    y,
    size: 9.5,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 14;
  sigPage.drawText(`NIP. ${userProfile.nip}`, {
    x: PAGE_WIDTH - MARGIN - 165,
    y,
    size: 9,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // --- Footer on all main pages ---
  for (let pi = 0; pi < mainDoc.getPageCount(); pi++) {
    const fp = mainDoc.getPage(pi);
    fp.drawLine({
      start: { x: MARGIN, y: MARGIN - 5 },
      end: { x: PAGE_WIDTH - MARGIN, y: MARGIN - 5 },
      thickness: 0.5,
      color: rgb(0.8, 0.83, 0.9),
    });
    fp.drawText(
      "Dicetak melalui Sistem Dashboard Penyuluh KB - BKKBN Kemendukbangga",
      {
        x: MARGIN,
        y: MARGIN - 18,
        size: 7.5,
        font: helvetica,
        color: rgb(0.6, 0.6, 0.6),
      },
    );
    fp.drawText(`Halaman ${pi + 1}`, {
      x: PAGE_WIDTH - MARGIN - 50,
      y: MARGIN - 18,
      size: 7.5,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  // --- Attachment pages (images) ---
  for (const att of attachments) {
    if (att.isImage) {
      mainDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const attPage = lastPage();

      // Header bar
      attPage.drawRectangle({
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 30,
        width: CONTENT_WIDTH,
        height: 30,
        color: rgb(0.1, 0.22, 0.42),
      });
      attPage.drawText(`LAMPIRAN ${att.index} - FOTO/GAMBAR`, {
        x: MARGIN + 10,
        y: PAGE_HEIGHT - MARGIN - 20,
        size: 11,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      // Footer
      attPage.drawLine({
        start: { x: MARGIN, y: MARGIN - 5 },
        end: { x: PAGE_WIDTH - MARGIN, y: MARGIN - 5 },
        thickness: 0.5,
        color: rgb(0.8, 0.83, 0.9),
      });
      attPage.drawText(
        "Dicetak melalui Sistem Dashboard Penyuluh KB - BKKBN Kemendukbangga",
        {
          x: MARGIN,
          y: MARGIN - 18,
          size: 7.5,
          font: helvetica,
          color: rgb(0.6, 0.6, 0.6),
        },
      );

      // Image area
      const imgAreaTop = PAGE_HEIGHT - MARGIN - 40;
      const imgAreaBottom = MARGIN + 20;
      const maxW = CONTENT_WIDTH - 10;
      const maxH = imgAreaTop - imgAreaBottom;

      const imgBytes = att.jpegBytes ?? att.bytes;
      let embedded = false;

      if (imgBytes && imgBytes.length > 0) {
        // Try JPEG first (canvas-converted or original)
        try {
          const img = await mainDoc.embedJpg(imgBytes);
          const scale = Math.min(maxW / img.width, maxH / img.height, 1);
          const iw = img.width * scale;
          const ih = img.height * scale;
          const ix = MARGIN + (CONTENT_WIDTH - iw) / 2;
          const iy = imgAreaTop - ih;
          attPage.drawImage(img, { x: ix, y: iy, width: iw, height: ih });
          embedded = true;
        } catch {
          // Try PNG fallback with original bytes
          try {
            const img = await mainDoc.embedPng(att.bytes);
            const scale = Math.min(maxW / img.width, maxH / img.height, 1);
            const iw = img.width * scale;
            const ih = img.height * scale;
            const ix = MARGIN + (CONTENT_WIDTH - iw) / 2;
            const iy = imgAreaTop - ih;
            attPage.drawImage(img, { x: ix, y: iy, width: iw, height: ih });
            embedded = true;
          } catch {
            // failed
          }
        }
      }

      if (!embedded) {
        drawWrappedText(
          attPage,
          "Gambar tidak dapat ditampilkan. Silakan buka file aslinya.",
          MARGIN,
          PAGE_HEIGHT / 2,
          { font: helvetica, size: 10, color: rgb(0.5, 0.1, 0.1) },
        );
      }
    } else if (!att.isPdf) {
      // Word/other: info page
      mainDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      const attPage = lastPage();
      attPage.drawRectangle({
        x: MARGIN,
        y: PAGE_HEIGHT - MARGIN - 30,
        width: CONTENT_WIDTH,
        height: 30,
        color: rgb(0.1, 0.22, 0.42),
      });
      attPage.drawText(
        `LAMPIRAN ${att.index} - ${getAttachmentTypeLabel(att.mimeType)}`,
        {
          x: MARGIN + 10,
          y: PAGE_HEIGHT - MARGIN - 20,
          size: 11,
          font: helveticaBold,
          color: rgb(1, 1, 1),
        },
      );

      // Info box
      attPage.drawRectangle({
        x: MARGIN,
        y: PAGE_HEIGHT / 2 - 30,
        width: CONTENT_WIDTH,
        height: 80,
        color: rgb(0.95, 0.97, 1),
      });
      attPage.drawText("Berkas terlampir dalam laporan ini.", {
        x: MARGIN + 10,
        y: PAGE_HEIGHT / 2 + 30,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.22, 0.42),
      });
      attPage.drawText(
        "Catatan: File ini tidak dapat ditampilkan langsung dalam PDF.",
        {
          x: MARGIN + 10,
          y: PAGE_HEIGHT / 2 + 10,
          size: 9.5,
          font: helvetica,
          color: rgb(0.3, 0.3, 0.3),
        },
      );
      attPage.drawText(`Tipe file: ${getAttachmentTypeLabel(att.mimeType)}`, {
        x: MARGIN + 10,
        y: PAGE_HEIGHT / 2 - 10,
        size: 9,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
      });

      attPage.drawLine({
        start: { x: MARGIN, y: MARGIN - 5 },
        end: { x: PAGE_WIDTH - MARGIN, y: MARGIN - 5 },
        thickness: 0.5,
        color: rgb(0.8, 0.83, 0.9),
      });
      attPage.drawText(
        "Dicetak melalui Sistem Dashboard Penyuluh KB - BKKBN Kemendukbangga",
        {
          x: MARGIN,
          y: MARGIN - 18,
          size: 7.5,
          font: helvetica,
          color: rgb(0.6, 0.6, 0.6),
        },
      );
    }
  }

  // --- Merge PDF attachments ---
  const mainBytes = await mainDoc.save();
  let finalDoc = await PDFDocument.load(mainBytes);

  for (const att of attachments) {
    if (att.isPdf) {
      try {
        const attPdfDoc = await PDFDocument.load(att.bytes, {
          ignoreEncryption: true,
        });
        const pageCount = attPdfDoc.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
        const copiedPages = await finalDoc.copyPages(attPdfDoc, pageIndices);

        const hFont = await finalDoc.embedFont(StandardFonts.HelveticaBold);
        const rFont = await finalDoc.embedFont(StandardFonts.Helvetica);

        const labelPage = finalDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        labelPage.drawRectangle({
          x: MARGIN,
          y: PAGE_HEIGHT - MARGIN - 30,
          width: CONTENT_WIDTH,
          height: 30,
          color: rgb(0.1, 0.22, 0.42),
        });
        labelPage.drawText(`LAMPIRAN ${att.index} - DOKUMEN PDF`, {
          x: MARGIN + 10,
          y: PAGE_HEIGHT - MARGIN - 20,
          size: 11,
          font: hFont,
          color: rgb(1, 1, 1),
        });
        labelPage.drawText(
          "Halaman-halaman berikut adalah isi dokumen PDF yang dilampirkan:",
          {
            x: MARGIN,
            y: PAGE_HEIGHT / 2,
            size: 10,
            font: rFont,
            color: rgb(0.3, 0.3, 0.3),
          },
        );

        for (const copiedPage of copiedPages) {
          finalDoc.addPage(copiedPage);
        }
      } catch {
        // If PDF merge fails, add a notice page
        try {
          const hFont = await finalDoc.embedFont(StandardFonts.HelveticaBold);
          const rFont = await finalDoc.embedFont(StandardFonts.Helvetica);
          const noticePage = finalDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          noticePage.drawRectangle({
            x: MARGIN,
            y: PAGE_HEIGHT - MARGIN - 30,
            width: CONTENT_WIDTH,
            height: 30,
            color: rgb(0.1, 0.22, 0.42),
          });
          noticePage.drawText(`LAMPIRAN ${att.index} - DOKUMEN PDF`, {
            x: MARGIN + 10,
            y: PAGE_HEIGHT - MARGIN - 20,
            size: 11,
            font: hFont,
            color: rgb(1, 1, 1),
          });
          noticePage.drawText(
            "Dokumen PDF terlampir (tidak dapat digabung karena file terproteksi).",
            {
              x: MARGIN,
              y: PAGE_HEIGHT / 2,
              size: 10,
              font: rFont,
              color: rgb(0.3, 0.3, 0.3),
            },
          );
        } catch {
          // skip
        }
      }
    }
  }

  // --- Download ---
  const finalBytes = await finalDoc.save();
  const blob = new Blob([finalBytes.buffer as ArrayBuffer], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Laporan_RKH_${report.nomorLaporan.replace(/\//g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
