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
}

export interface UserProfileData {
  name: string;
  nip: string;
  unitKerja: string;
  wilayah: string;
}

async function fetchLogoBase64(): Promise<string> {
  try {
    const response = await fetch(
      "/assets/generated/bkkbn-logo-transparent.dim_400x120.png",
    );
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export async function downloadReportPDF(
  report: ReportData,
  userProfile: UserProfileData,
) {
  const logoBase64 = await fetchLogoBase64();

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan RKH ${report.nomorLaporan}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a2e;
      background: #fff;
      padding: 20mm;
    }
    .header {
      display: flex;
      align-items: center;
      border-bottom: 3px solid #1a3a6b;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header img {
      height: 70px;
      object-fit: contain;
      margin-right: 20px;
    }
    .header-text h1 {
      font-size: 13pt;
      font-weight: 700;
      color: #1a3a6b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .header-text h2 {
      font-size: 10pt;
      font-weight: 500;
      color: #444;
      margin-top: 3px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1a3a6b;
      border-left: 4px solid #1a3a6b;
      padding-left: 10px;
      margin: 18px 0 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    .info-table td {
      padding: 5px 8px;
      vertical-align: top;
      font-size: 10.5pt;
    }
    .info-table td:first-child {
      width: 38%;
      font-weight: 600;
      color: #333;
    }
    .info-table td:nth-child(2) {
      width: 3%;
      color: #666;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .report-table th {
      background: #1a3a6b;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-size: 10pt;
      font-weight: 600;
    }
    .report-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #dde4f0;
      font-size: 10.5pt;
      vertical-align: top;
    }
    .report-table tr:nth-child(even) td {
      background: #f5f7ff;
    }
    .report-table td:first-child {
      font-weight: 600;
      color: #1a3a6b;
      width: 38%;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: 600;
    }
    .status-submitted { background: #d1fae5; color: #065f46; }
    .status-draft { background: #fef3c7; color: #92400e; }
    .signature-area {
      margin-top: 40px;
      display: flex;
      justify-content: flex-end;
    }
    .signature-box {
      text-align: center;
      width: 220px;
    }
    .signature-box p { font-size: 10.5pt; }
    .signature-space { height: 70px; border-bottom: 1px solid #333; margin: 8px 0; }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #dde4f0;
      padding-top: 8px;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }
    @media print {
      body { padding: 15mm; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="BKKBN Logo" />` : ""}
    <div class="header-text">
      <h1>Laporan Rencana Kerja Harian Penyuluh KB</h1>
      <h2>Berdasarkan Peraturan Menteri (Permen) Nomor 10</h2>
    </div>
  </div>

  <div class="section-title">Identitas Penyuluh</div>
  <table class="info-table">
    <tr><td>Nama</td><td>:</td><td>${userProfile.name}</td></tr>
    <tr><td>NIP</td><td>:</td><td>${userProfile.nip}</td></tr>
    <tr><td>Unit Kerja</td><td>:</td><td>${userProfile.unitKerja}</td></tr>
    <tr><td>Wilayah</td><td>:</td><td>${userProfile.wilayah}</td></tr>
  </table>

  <div class="section-title">Detail Laporan</div>
  <table class="report-table">
    <tbody>
      <tr>
        <td>Nomor Laporan</td>
        <td>${report.nomorLaporan}</td>
      </tr>
      <tr>
        <td>Tanggal</td>
        <td>${report.tanggal}</td>
      </tr>
      <tr>
        <td>Nama Kegiatan</td>
        <td>${report.namaKegiatan}</td>
      </tr>
      <tr>
        <td>Sasaran</td>
        <td>${report.sasaran}</td>
      </tr>
      <tr>
        <td>Indikator Keberhasilan</td>
        <td>${report.indikatorKeberhasilan}</td>
      </tr>
      <tr>
        <td>Volume / Jumlah</td>
        <td>${report.volume}</td>
      </tr>
      <tr>
        <td>Metode Kegiatan</td>
        <td>${report.metodeKegiatan}</td>
      </tr>
      <tr>
        <td>Lokasi Kegiatan</td>
        <td>${report.lokasiKegiatan}</td>
      </tr>
      <tr>
        <td>Waktu Pelaksanaan</td>
        <td>${report.waktuPelaksanaan}</td>
      </tr>
      <tr>
        <td>Sumber Dana</td>
        <td>${report.sumberDana}</td>
      </tr>
      <tr>
        <td>Keterangan</td>
        <td>${report.keterangan || "-"}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>
          <span class="status-badge ${report.status === "submitted" ? "status-submitted" : "status-draft"}">
            ${report.status === "submitted" ? "Dikirim" : "Draf"}
          </span>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="signature-area">
    <div class="signature-box">
      <p>Yang Membuat Laporan,</p>
      <div class="signature-space"></div>
      <p><strong>${userProfile.name}</strong></p>
      <p>NIP. ${userProfile.nip}</p>
    </div>
  </div>

  <div class="footer">
    Dicetak melalui Sistem Dashboard Penyuluh KB &mdash; BKKBN Kemendukbangga
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Popup diblokir. Harap izinkan popup untuk mengunduh PDF.");
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  });
}
