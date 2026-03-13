"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getDaftarUjianSiswa() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SISWA") {
    return { error: "Unauthorized" };
  }

  // 1. Dapatkan data siswa dan kelasnya
  const siswa = await prisma.siswa.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      kelasId: true,
    }
  });

  if (!siswa) return { error: "Data siswa tidak ditemukan" };

  // 2. Dapatkan jadwal ujian yang ditujukan untuk kelas siswa tersebut
  // Kita ambil jadwal yang waktuSelesai-nya belum lewat lebih dari 1 jam (toleransi)
  const now = new Date();
  const toleranceTime = new Date(now.getTime() - 60 * 60 * 1000);

  const jadwal = await prisma.jadwalUjian.findMany({
    where: {
      kelas: {
        some: {
          id: siswa.kelasId
        }
      },
      waktuSelesai: {
        gt: toleranceTime
      }
    },
    include: {
      ujian: {
        include: {
          mataPelajaran: { select: { nama: true } },
          bankSoal: {
            select: {
              _count: { select: { soal: true } }
            }
          }
        }
      },
      ruang: { select: { nama: true } },
    },
    orderBy: {
      waktuMulai: 'asc'
    }
  });

  // 3. Dapatkan sesi ujian yang sudah pernah/sedang diikuti siswa
  const sesiSiswa = await prisma.sesiUjian.findMany({
    where: {
      siswaId: siswa.id,
    },
    select: {
      ujianId: true,
      status: true,
      id: true
    }
  });

  return {
    jadwal,
    sesiSiswa,
    siswaId: siswa.id
  };
}

// Mengambil riwayat ujian yang telah selesai dikerjakan siswa
export async function getRiwayatHasilSiswa() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SISWA") {
    return { error: "Unauthorized" };
  }

  const siswa = await prisma.siswa.findUnique({
    where: { userId: session.user.id }
  });

  if (!siswa) return { error: "Data siswa tidak ditemukan" };

  const riwayatSesi = await prisma.sesiUjian.findMany({
    where: {
      siswaId: siswa.id,
      status: 'SELESAI'
    },
    include: {
      ujian: {
        include: {
          mataPelajaran: { select: { nama: true } }
        }
      },
      hasil: true
    },
    orderBy: {
      waktuSelesai: 'desc'
    }
  });

  return riwayatSesi;
}
