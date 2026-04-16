"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Mengambil semua ruang ujian yang tersedia
export async function getRuangUjian() {
  return await prisma.ruangUjian.findMany({
    orderBy: { nama: "asc" },
  });
}

import { auth } from "@/auth";

// Mengambil jadwal ujian untuk guru tertentu (berdasarkan ujian yang dibuat guru tersebut)
export async function getJadwalByGuru(guruId: string) {
  const session = await auth();

  // Jika ADMIN, berikan akses ke seluruh jadwal
  if (session?.user?.role === 'ADMIN') {
    return await prisma.jadwalUjian.findMany({
      include: {
        ujian: {
          include: {
            mataPelajaran: true,
            bankSoal: { 
              include: { 
                guru: { include: { user: { select: { name: true } } } } 
              } 
            }
          },
        },
        ruang: true,
        kelas: { select: { id: true, nama: true } },
      },
      orderBy: { waktuMulai: "asc" },
    });
  }

  return await prisma.jadwalUjian.findMany({
    where: {
      ujian: {
        bankSoal: {
          guruId: guruId,
        },
      },
    },
    include: {
      ujian: {
        include: {
          mataPelajaran: true,
        },
      },
      ruang: true,
      kelas: { select: { id: true, nama: true } },
    },
    orderBy: { waktuMulai: "asc" },
  });
}

// Mengambil jadwal ujian untuk pengawas tertentu
export async function getJadwalByPengawas(pengawasId: string) {
  const session = await auth();

  // Jika ADMIN, berikan akses ke seluruh jadwal (Monitoring global)
  if (session?.user?.role === 'ADMIN') {
    return await prisma.jadwalUjian.findMany({
      include: {
        ujian: {
          include: {
            mataPelajaran: true,
            bankSoal: { 
              include: { 
                guru: { include: { user: { select: { name: true } } } } 
              } 
            }
          },
        },
        ruang: true,
        kelas: { select: { id: true, nama: true } },
      },
      orderBy: { waktuMulai: "asc" },
    });
  }

  return await prisma.jadwalUjian.findMany({
    where: {
      pengawasId: pengawasId,
    },
    include: {
      ujian: {
        include: {
          mataPelajaran: true,
        },
      },
      ruang: true,
      kelas: { select: { id: true, nama: true } },
    },
    orderBy: { waktuMulai: "asc" },
  });
}

// Mengambil SEMUA jadwal ujian (Untuk Admin Master Authority)
export async function getAllJadwalAction() {
  return await prisma.jadwalUjian.findMany({
    include: {
      ujian: {
        include: {
          mataPelajaran: true,
          bankSoal: {
            include: {
              guru: {
                include: {
                  user: { select: { name: true } }
                }
              }
            }
          }
        },
      },
      ruang: true,
      kelas: { select: { id: true, nama: true } },
    },
    orderBy: { waktuMulai: "asc" },
  });
}

// Membuat jadwal ujian baru
export async function createJadwalUjian(data: {
  ujianId: string;
  ruangId: string;
  waktuMulai: Date;
  waktuSelesai: Date;
  pengawasId?: string;
  kelasIds: string[]; // Daftar kelas yang ikut di jadwal/ruangan ini
}) {
  await prisma.jadwalUjian.create({
    data: {
      ujianId: data.ujianId,
      ruangId: data.ruangId,
      waktuMulai: data.waktuMulai,
      waktuSelesai: data.waktuSelesai,
      pengawasId: data.pengawasId || null,
      kelas: {
        connect: data.kelasIds.map(id => ({ id }))
      }
    },
  });

  revalidatePath("/guru/jadwal");
  revalidatePath("/admin/penjadwalan");
}

// Update jadwal ujian
export async function updateJadwalUjian(
  id: string,
  data: {
    ruangId: string;
    waktuMulai: Date;
    waktuSelesai: Date;
    pengawasId?: string;
    kelasIds: string[];
  }
) {
  await prisma.jadwalUjian.update({
    where: { id },
    data: {
      ruangId: data.ruangId,
      waktuMulai: data.waktuMulai,
      waktuSelesai: data.waktuSelesai,
      pengawasId: data.pengawasId || null,
      kelas: {
        set: data.kelasIds.map(id => ({ id }))
      }
    },
  });

  revalidatePath("/guru/jadwal");
  revalidatePath("/admin/penjadwalan");
}

// Hapus jadwal ujian
export async function deleteJadwalUjian(id: string) {
  await prisma.jadwalUjian.delete({
    where: { id },
  });

  revalidatePath("/guru/jadwal");
  revalidatePath("/admin/penjadwalan");
}
