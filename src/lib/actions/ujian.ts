"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Guru: Dapatkan semua ujian yang dibuat oleh guru yang login
export async function getUjianByGuru() {
  const session = await auth();
  if (!session?.user?.id) return [];

  // Jika ADMIN, berikan akses ke seluruh ujian
  if (session.user.role === 'ADMIN') {
    return await prisma.ujian.findMany({
      include: {
        mataPelajaran: { select: { id: true, nama: true } },
        bankSoal: { 
          include: { 
            guru: { include: { user: { select: { name: true } } } } 
          } 
        },
        kelas: { select: { id: true, nama: true } },
        jadwal: { select: { waktuMulai: true, waktuSelesai: true } },
        _count: { select: { attempts: true } }
      },
      orderBy: { id: 'desc' }
    });
  }

  const guru = await prisma.guru.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!guru) return [];

  return await prisma.ujian.findMany({
    where: { bankSoal: { guruId: guru.id } },
    include: {
      mataPelajaran: { select: { id: true, nama: true } },
      bankSoal: { select: { nama: true } },
      kelas: { select: { id: true, nama: true } },
      jadwal: { select: { waktuMulai: true, waktuSelesai: true } },
      _count: { select: { attempts: true } }
    },
    orderBy: { id: 'desc' }
  });
}

// Admin: Dapatkan semua ujian dari seluruh guru
export async function getAllUjianAction() {
  return await prisma.ujian.findMany({
    include: {
      mataPelajaran: { select: { nama: true } },
      bankSoal: { 
        include: { 
          guru: { include: { user: { select: { name: true } } } } 
        } 
      },
      kelas: { select: { id: true, nama: true } },
      jadwal: true,
      _count: { select: { attempts: true } }
    },
    orderBy: { id: 'desc' }
  });
}
// Data yang dibutuhkan untuk form pembuatan ujian
export async function getDataFormUjian() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const guru = await prisma.guru.findUnique({
    where: { userId: session.user.id },
    include: {
      bankSoal: {
        include: { mataPelajaran: true, _count: { select: { soal: true } } },
        orderBy: { nama: 'asc' }
      }
    }
  });
  if (!guru) return null;

  // Dapatkan semua kelas untuk pemilihan peserta ujian
  const kelas = await prisma.kelas.findMany({
    include: { tahunAjaran: true },
    orderBy: [{ tahunAjaran: { aktif: 'desc' } }, { nama: 'asc' }]
  });

  return { guru, kelas };
}

// Helper: Generate 6 karakter random (Uppercase Alphanumeric)
function generateRandomToken() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Tanpa I, O, 1, 0
  let newToken = '';
  for (let i = 0; i < 6; i++) {
    newToken += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return newToken;
}

// Buat Ujian Baru
export async function createUjian(data: {
  judul: string;
  deskripsi?: string;
  durasi: number;
  bankSoalId: string;
  mataPelajaranId: string;
  tahunAjaranId: string;
  kelasIds: string[];
  token?: string;
  acakSoal: boolean;
  acakOpsi: boolean;
  tampilkanHasil: boolean;
  skala: any; 
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Tidak terautentikasi.");

  // Auto-derive tahunAjaranId jika kosong
  let tahunAjaranId = data.tahunAjaranId;
  if (!tahunAjaranId && data.kelasIds.length > 0) {
    const kelas = await prisma.kelas.findUnique({
      where: { id: data.kelasIds[0] },
      select: { tahunAjaranId: true }
    });
    tahunAjaranId = kelas?.tahunAjaranId || "";
  }

  if (!tahunAjaranId) throw new Error("Tahun ajaran tidak ditemukan.");

  // Jika skala besar (UAS/UTS) dan token kosong, buatkan otomatis
  let finalToken = data.token;
  if (!finalToken && data.skala !== "HARIAN") {
    finalToken = generateRandomToken();
  }

  await prisma.ujian.create({
    data: {
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      skala: data.skala,
      durasi: data.durasi,
      bankSoalId: data.bankSoalId,
      mataPelajaranId: data.mataPelajaranId,
      tahunAjaranId,
      token: finalToken || null,
      acakSoal: data.acakSoal,
      acakOpsi: data.acakOpsi,
      tampilkanHasil: data.tampilkanHasil,
      kelas: {
        connect: data.kelasIds.map(id => ({ id }))
      }
    } as any
  });

  revalidatePath('/guru/ujian');
}

// Update Ujian
export async function updateUjian(ujianId: string, data: any) {
  // Jika skala besar (UAS/UTS) dan token saat ini kosong, buatkan otomatis
  let finalToken = data.token;
  
  if (data.skala !== "HARIAN" && !finalToken) {
    // Cek apakah di DB sudah ada token
    const existing = await prisma.ujian.findUnique({
      where: { id: ujianId },
      select: { token: true }
    });
    if (!existing?.token) {
      finalToken = generateRandomToken();
    } else {
      finalToken = existing.token;
    }
  }

  await prisma.ujian.update({
    where: { id: ujianId },
    data: {
      judul: data.judul,
      deskripsi: data.deskripsi || null,
      skala: data.skala,
      durasi: data.durasi,
      token: finalToken || null,
      acakSoal: data.acakSoal,
      acakOpsi: data.acakOpsi,
      tampilkanHasil: data.tampilkanHasil,
      kelas: {
        set: data.kelasIds.map((id: string) => ({ id }))
      }
    } as any
  });
  revalidatePath('/guru/ujian');
}

// Hapus Ujian
export async function deleteUjian(ujianId: string) {
  try {
    // Manual Cascade Delete dikarenakan Foreign Key 'RESTRICT' di server Supabase saat SQL Migration
    const sesi = await prisma.sesiUjian.findMany({ where: { ujianId }, select: { id: true } });
    const sesiIds = sesi.map(s => s.id);

    await prisma.$transaction([
      prisma.hasilUjian.deleteMany({ where: { sesiId: { in: sesiIds } } }),
      prisma.jawabanSiswa.deleteMany({ where: { sesiId: { in: sesiIds } } }),
      prisma.pelanggaran.deleteMany({ where: { sesiId: { in: sesiIds } } }),
      prisma.jadwalUjian.deleteMany({ where: { ujianId } }),
      prisma.sesiUjian.deleteMany({ where: { ujianId } }),
      prisma.ujian.delete({ where: { id: ujianId } })
    ]);

    revalidatePath('/guru/ujian');
    return { success: true };
  } catch (error: any) {
    console.error("Gagal menghapus ujian:", error);
    throw new Error("Gagal menghapus ujian karena data masih terhubung dengan sesi/jadwal siswa.");
  }
}
// Refresh Token Ujian (Dynamic Token)
export async function refreshUjianToken(ujianId: string) {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "GURU", "PENGAWAS"].includes(session.user.role)) {
    throw new Error("Anda tidak memiliki otoritas untuk mengubah token.");
  }

  // Generate 6 karakter random
  const newToken = generateRandomToken();

  await prisma.ujian.update({
    where: { id: ujianId },
    data: { token: newToken }
  });

  revalidatePath('/guru/ujian');
  revalidatePath('/pengawas/monitoring');
  
  return newToken;
}
