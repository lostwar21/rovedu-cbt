"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Analitik ringkas untuk dashboard Guru
export async function getGuruAnalytics() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GURU") return null;

  const guru = await prisma.guru.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!guru) return null;

  // Ambil semua hasil ujian dari ujian milik guru ini
  const hasilUjian = await prisma.hasilUjian.findMany({
    where: {
      sesi: {
        ujian: { bankSoal: { guruId: guru.id } }
      }
    },
    include: {
      siswa: {
        include: {
          kelas: { select: { id: true, nama: true } },
          user: { select: { name: true } }
        }
      },
      sesi: {
        include: {
          ujian: {
            select: { judul: true, mataPelajaranId: true }
          }
        }
      }
    }
  });

  if (hasilUjian.length === 0) return {
    totalPeserta: 0,
    rataRata: 0,
    nilaiTertinggi: 0,
    nilaiTerendah: 0,
    distribusi: { A: 0, B: 0, C: 0, D: 0, E: 0 },
    perKelas: [],
    topSiswa: []
  };

  const nilai = hasilUjian.map(h => h.nilaiTotal);
  const rataRata = nilai.reduce((a, b) => a + b, 0) / nilai.length;

  // Distribusi Nilai (A: 80-100, B: 70-79, C: 60-69, D: 50-59, E: <50)
  const distribusi = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  nilai.forEach(n => {
    if (n >= 80) distribusi.A++;
    else if (n >= 70) distribusi.B++;
    else if (n >= 60) distribusi.C++;
    else if (n >= 50) distribusi.D++;
    else distribusi.E++;
  });

  // Rata-rata per Kelas
  const kelasMap = new Map<string, { nama: string; total: number; count: number }>();
  hasilUjian.forEach(h => {
    const kId = h.siswa.kelas.id;
    const kNama = h.siswa.kelas.nama;
    if (!kelasMap.has(kId)) kelasMap.set(kId, { nama: kNama, total: 0, count: 0 });
    const entry = kelasMap.get(kId)!;
    entry.total += h.nilaiTotal;
    entry.count++;
  });

  const perKelas = Array.from(kelasMap.values()).map(k => ({
    nama: k.nama,
    rataRata: Math.round((k.total / k.count) * 10) / 10,
    jumlahSiswa: k.count
  })).sort((a, b) => b.rataRata - a.rataRata);

  // Top 5 Siswa
  const topSiswa = [...hasilUjian]
    .sort((a, b) => b.nilaiTotal - a.nilaiTotal)
    .slice(0, 5)
    .map(h => ({
      nama: h.siswa.user.name || "Tanpa Nama",
      kelas: h.siswa.kelas.nama,
      nilai: h.nilaiTotal,
      ujian: h.sesi.ujian.judul
    }));

  return {
    totalPeserta: hasilUjian.length,
    rataRata: Math.round(rataRata * 10) / 10,
    nilaiTertinggi: Math.max(...nilai),
    nilaiTerendah: Math.min(...nilai),
    distribusi,
    perKelas,
    topSiswa
  };
}
