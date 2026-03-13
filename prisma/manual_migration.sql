-- ============================================================
-- Manual Migration Script - Rovedu CBT
-- Jalankan skrip ini di Supabase Dashboard > SQL Editor
-- jika `prisma db push` tidak bisa berjalan.
-- ============================================================

-- 1. Enum baru
DO $$ BEGIN
  CREATE TYPE "TingkatKesulitan" AS ENUM ('MUDAH', 'SEDANG', 'SULIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SkalaUjian" AS ENUM ('HARIAN', 'UTS', 'UAS', 'TRYOUT', 'LAINNYA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StatusUjian" AS ENUM ('BERJALAN', 'SELESAI', 'DIBLOKIR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Kolom baru di Tabel Soal
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "bobot" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "kategori" TEXT;
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "kompetensiDasar" TEXT;
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "tingkatKesulitan" "TingkatKesulitan" DEFAULT 'SEDANG';
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "taksonomi" TEXT;
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "acakOpsi" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "rubrikPenilaian" TEXT;
ALTER TABLE "Soal" ADD COLUMN IF NOT EXISTS "izinkanLampiran" BOOLEAN NOT NULL DEFAULT false;

-- 3. Kolom baru di Tabel Ujian
ALTER TABLE "Ujian" ADD COLUMN IF NOT EXISTS "skala" "SkalaUjian" NOT NULL DEFAULT 'HARIAN';

-- 4. Tabel RuangUjian
CREATE TABLE IF NOT EXISTS "RuangUjian" (
  "id" TEXT NOT NULL,
  "nama" TEXT NOT NULL,
  "kapasitas" INTEGER NOT NULL,
  CONSTRAINT "RuangUjian_pkey" PRIMARY KEY ("id")
);

-- 5. Tabel JadwalUjian
CREATE TABLE IF NOT EXISTS "JadwalUjian" (
  "id" TEXT NOT NULL,
  "ujianId" TEXT NOT NULL,
  "ruangId" TEXT NOT NULL,
  "pengawasId" TEXT,
  "waktuMulai" TIMESTAMP(3) NOT NULL,
  "waktuSelesai" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "JadwalUjian_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JadwalUjian_ujianId_fkey') THEN
    ALTER TABLE "JadwalUjian" ADD CONSTRAINT "JadwalUjian_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JadwalUjian_ruangId_fkey') THEN
    ALTER TABLE "JadwalUjian" ADD CONSTRAINT "JadwalUjian_ruangId_fkey" FOREIGN KEY ("ruangId") REFERENCES "RuangUjian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. Tabel SesiUjian
CREATE TABLE IF NOT EXISTS "SesiUjian" (
  "id" TEXT NOT NULL,
  "siswaId" TEXT NOT NULL,
  "ujianId" TEXT NOT NULL,
  "waktuMulai" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "waktuSelesai" TIMESTAMP(3),
  "status" "StatusUjian" NOT NULL DEFAULT 'BERJALAN',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "SesiUjian_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SesiUjian_siswaId_fkey') THEN
    ALTER TABLE "SesiUjian" ADD CONSTRAINT "SesiUjian_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SesiUjian_ujianId_fkey') THEN
    ALTER TABLE "SesiUjian" ADD CONSTRAINT "SesiUjian_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 7. Tabel JawabanSiswa
CREATE TABLE IF NOT EXISTS "JawabanSiswa" (
  "id" TEXT NOT NULL,
  "sesiId" TEXT NOT NULL,
  "soalId" TEXT NOT NULL,
  "opsiDipilihId" TEXT,
  "jawabanEssay" TEXT,
  "nilaiEssay" INTEGER,
  "ragu" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JawabanSiswa_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JawabanSiswa_sesiId_fkey') THEN
    ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiUjian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'JawabanSiswa_soalId_fkey') THEN
    ALTER TABLE "JawabanSiswa" ADD CONSTRAINT "JawabanSiswa_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 8. Tabel HasilUjian
CREATE TABLE IF NOT EXISTS "HasilUjian" (
  "id" TEXT NOT NULL,
  "siswaId" TEXT NOT NULL,
  "sesiId" TEXT NOT NULL,
  "nilaiPg" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "nilaiEssay" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "nilaiTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lulus" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "HasilUjian_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HasilUjian_sesiId_key" UNIQUE ("sesiId")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HasilUjian_siswaId_fkey') THEN
    ALTER TABLE "HasilUjian" ADD CONSTRAINT "HasilUjian_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'HasilUjian_sesiId_fkey') THEN
    ALTER TABLE "HasilUjian" ADD CONSTRAINT "HasilUjian_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiUjian"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- 9. Tabel Pelanggaran
CREATE TABLE IF NOT EXISTS "Pelanggaran" (
  "id" TEXT NOT NULL,
  "sesiId" TEXT NOT NULL,
  "tipe" TEXT NOT NULL,
  "waktu" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "keterangan" TEXT,
  CONSTRAINT "Pelanggaran_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Pelanggaran_sesiId_fkey') THEN
    ALTER TABLE "Pelanggaran" ADD CONSTRAINT "Pelanggaran_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiUjian"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
