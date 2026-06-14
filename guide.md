# Panduan Sistem Trial & Pengembangan (Rovedu CBT)

Dokumen ini menjelaskan bagaimana mode trial dan pengembangan (dev) dikonfigurasi dalam repositori ini menggunakan standar industri (Single Codebase & Feature Flags).

## 1. Arsitektur Repositori (Git Branching)
Kita menggunakan **1 folder repositori** untuk semua keperluan, namun dipisahkan melalui Git Branches:
- `main`: Branch utama yang berisi kode asli/produksi (versi yang sudah terjual). Kita telah menguncinya dengan tag `v1.0-terjual`.
- `trial-dev`: Branch yang Anda gunakan saat ini. Ini adalah tempat di mana kita menerapkan batasan trial dan melakukan pengembangan fitur baru tanpa merusak versi `main`.

**Perintah Penting Git:**
- Kembali ke versi original/terjual: `git checkout main`
- Beralih kembali ke versi trial: `git checkout trial-dev`

## 2. Mengaktifkan Mode Trial (Feature Flag)
Mode Trial diatur sepenuhnya oleh *Environment Variables* di file `.env`.
Buka file `.env` dan pastikan Anda memiliki baris berikut:

```env
NEXT_PUBLIC_IS_TRIAL=true
```

**Cara Kerjanya:**
- Jika `NEXT_PUBLIC_IS_TRIAL=true`, maka sistem akan otomatis mengaktifkan batasan kuota, menonaktifkan beberapa fitur premium (seperti export/download), dan memunculkan *badge* "TRIAL" di atas logo Rovedu.
- Jika variabel ini dihapus atau diubah menjadi `false`, maka sistem akan kembali bertindak sebagai versi Premium / Full Version.

## 3. Batasan Trial (Freemium & Quota Gating)
Di dalam mode trial (`NEXT_PUBLIC_IS_TRIAL=true`), batasan berikut diterapkan:
1. **Kuota Siswa**: Maksimal hanya bisa mendaftarkan 30 siswa.
2. **Kuota Ujian**: Maksimal hanya bisa membuat 2 sesi ujian/bank soal.
3. **Fitur Export**: Tombol untuk mengunduh rekap nilai (Excel/PDF) di-disable dengan memunculkan pesan "Fitur ini tidak tersedia di versi Trial".

## 4. Pembersihan Data (Sanitasi)
Di branch `trial-dev` ini, file-file *script* pengecekan spesifik (seperti pengecekan data sekolah tertentu) akan dihapus, dan data *seeder* (`prisma/seed.ts` atau `run_seed.js`) akan diubah menjadi data dummy (fiktif) murni. Ini memastikan jika Anda membagikan *source code* atau mendemokan aplikasi dari branch ini, tidak ada data klien asli yang bocor.

---

> **TIP:**
> Jika ada calon klien baru yang tertarik dengan sistem ini dan ingin membelinya, Anda cukup melakukan:
> `git checkout -b klien-baru` (membuat cabang baru dari *trial-dev*), lalu mengubah `NEXT_PUBLIC_IS_TRIAL=false` di server produksi mereka.
