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

/** Convert any image URL to JPEG bytes via canvas (handles WebP, HEIC, PNG, etc.) */
async function imageUrlToJpegBytes(url: string): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(null);
              return;
            }
            blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)));
          },
          "image/jpeg",
          0.88,
        );
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

interface AttachmentData {
  bytes: Uint8Array;
  jpegBytes: Uint8Array | null; // canvas-converted JPEG for images
  url: string;
  mimeType: string;
  isImage: boolean;
  isPdf: boolean;
  index: number;
  name: string;
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
      const blob = await resp.blob();
      const mimeType = blob.type || "application/octet-stream";
      const isImage = mimeType.startsWith("image/");
      const isPdf = mimeType === "application/pdf";
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);

      // Pre-convert image to JPEG via canvas for reliable embedding
      let jpegBytes: Uint8Array | null = null;
      if (isImage) {
        jpegBytes = await imageUrlToJpegBytes(url);
      }

      items.push({
        bytes,
        jpegBytes,
        url,
        mimeType,
        isImage,
        isPdf,
        index: i + 1,
        name: `Lampiran ${i + 1}`,
      });
    } catch {
      // skip failed attachment
    }
  }
  return items;
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

  // --- Attachment pages ---
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
      attPage.drawText(`LAMPIRAN ${att.index}`, {
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

      // Image area: from below header to above footer
      const imgAreaTop = PAGE_HEIGHT - MARGIN - 40; // just below header
      const imgAreaBottom = MARGIN + 20; // just above footer
      const maxW = CONTENT_WIDTH - 10;
      const maxH = imgAreaTop - imgAreaBottom;

      try {
        // Prefer canvas-converted JPEG for reliability
        const imgBytes = att.jpegBytes ?? att.bytes;
        let img: Awaited<ReturnType<typeof mainDoc.embedJpg>>;
        try {
          img = await mainDoc.embedJpg(imgBytes);
        } catch {
          img = await mainDoc.embedPng(att.bytes);
        }

        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const iw = img.width * scale;
        const ih = img.height * scale;
        // Center horizontally, place at top of image area
        const ix = MARGIN + (CONTENT_WIDTH - iw) / 2;
        const iy = imgAreaTop - ih;

        attPage.drawImage(img, { x: ix, y: iy, width: iw, height: ih });
      } catch {
        drawWrappedText(
          attPage,
          "Gambar tidak dapat ditampilkan. Format tidak didukung.",
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
      attPage.drawText(`LAMPIRAN ${att.index}`, {
        x: MARGIN + 10,
        y: PAGE_HEIGHT - MARGIN - 20,
        size: 11,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });
      attPage.drawText(`File: ${att.name}`, {
        x: MARGIN,
        y: PAGE_HEIGHT / 2 + 20,
        size: 11,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      attPage.drawText(`Tipe: ${att.mimeType || "Dokumen"}`, {
        x: MARGIN,
        y: PAGE_HEIGHT / 2,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
      });
      attPage.drawText("File ini terlampir dalam laporan.", {
        x: MARGIN,
        y: PAGE_HEIGHT / 2 - 20,
        size: 10,
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

        const labelPage = finalDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        const hFont = await finalDoc.embedFont(StandardFonts.HelveticaBold);
        const rFont = await finalDoc.embedFont(StandardFonts.Helvetica);
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
        // Skip failed PDF merges
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
