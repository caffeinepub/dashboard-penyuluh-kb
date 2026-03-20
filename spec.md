# Dashboard Penyuluh KB

## Current State
Aplikasi dashboard laporan harian Penyuluh KB. Pengguna dapat login, mendaftar (dengan tanda tangan kanvas), membuat/melihat laporan, dan mengunduh PDF. PDF lampiran diproses: gambar ditampilkan sebagai halaman gambar, PDF dimerge di akhir (setelah semua gambar), dan ada teks 'Halaman-halaman berikut adalah isi dokumen PDF yang dilampirkan:'. Tidak ada fitur edit profil untuk pengguna yang sudah terdaftar.

## Requested Changes (Diff)

### Add
- Halaman Edit Profil untuk penyuluh (`penyuluh-edit-profile` view) — dapat mengubah nama, NIP, unit kerja, wilayah, dan tanda tangan
- Nav item "Edit Profil" di sidebar penyuluh
- Mutation `useUpdateProfile` di useQueries.ts yang memanggil `actor.updateCallerUserProfile`

### Modify
- **SignaturePad** → ubah dari kanvas gambar tangan menjadi komponen file upload gambar (user upload foto/gambar tanda tangan); interface `SignaturePadHandle` tetap sama (getDataURL, isEmpty, clear)
- **LoginPage** → registrasi tetap menggunakan SignaturePad (yang sudah diubah jadi file upload)
- **pdfGenerator.ts** → 
  1. Hapus teks `'Halaman-halaman berikut adalah isi dokumen PDF yang dilampirkan:'`
  2. Proses semua lampiran dalam urutan upload asli (satu loop tunggal; jangan pisahkan images vs PDFs). Setelah mainDoc tersimpan sebagai finalDoc, proses semua attachment secara berurutan: untuk gambar buat halaman gambar, untuk PDF tambahkan label page + salin halaman PDF, untuk file lain buat halaman info
- **AppLayout.tsx** → tambah `'penyuluh-edit-profile'` ke `PenyuluhView` type dan nav item
- **App.tsx** → tangani view `penyuluh-edit-profile`, render EditProfile; pass `onEditProfile` callback ke AppLayout atau gunakan setCurrentView langsung

### Remove
- Tidak ada yang dihapus

## Implementation Plan
1. Ubah `SignaturePad.tsx` menjadi file upload gambar: tampilkan preview gambar yang diupload, tombol hapus/ganti, expose getDataURL/isEmpty/clear
2. Tambah `useUpdateProfile` mutation di useQueries.ts
3. Buat `src/frontend/src/pages/penyuluh/EditProfile.tsx` dengan form edit profil (nama, nip, unitKerja, wilayah, tandaTangan via file upload)
4. Tambah `penyuluh-edit-profile` ke AppView types dan nav items di AppLayout.tsx
5. Tangani view baru di App.tsx, teruskan profile data ke EditProfile
6. Perbaiki pdfGenerator.ts: hapus teks lampiran PDF, ubah ke satu pass berurutan untuk semua lampiran
