"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getGuruId(userId: string) {
  const guru = await prisma.guru.findUnique({ where: { userId } });
  return guru?.id;
}

export async function getMapelByGuru(userId: string) {
  const session = await auth();
  
  // Jika Admin, ambil SEMUA Mata Pelajaran
  if (session?.user?.role === 'ADMIN') {
    return await prisma.mataPelajaran.findMany({ orderBy: { nama: 'asc' } });
  }

  const guru = await prisma.guru.findUnique({
    where: { userId },
    include: { mataPelajaran: true }
  });
  return guru?.mataPelajaran || [];
}

export async function getBankSoalByGuru(guruId: string) {
    const session = await auth();

    // Jika Admin, ambil SEMUA Bank Soal (baik milik mereka sendiri jika ada guruId, maupun milik guru lain)
    if (session?.user?.role === 'ADMIN') {
        return await prisma.bankSoal.findMany({
            include: {
                mataPelajaran: true,
                guru: { include: { user: { select: { name: true } } } },
                _count: { select: { soal: true } }
            },
            orderBy: { nama: "asc" },
        });
    }

    return await prisma.bankSoal.findMany({
        where: { guruId: guruId },
        include: {
            mataPelajaran: true,
            _count: {
                select: { soal: true }
            }
        },
        orderBy: { nama: "asc" },
    });
}

export async function createBankSoal(guruId: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const mataPelajaranId = formData.get("mataPelajaranId") as string;

  await prisma.bankSoal.create({
    data: {
      nama,
      mataPelajaranId,
      guruId,
    },
  });

  revalidatePath("/guru/bank-soal");
}

export async function updateBankSoal(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const mataPelajaranId = formData.get("mataPelajaranId") as string;

  await prisma.bankSoal.update({
    where: { id },
    data: {
      nama,
      mataPelajaranId,
    },
  });

  revalidatePath("/guru/bank-soal");
}

export async function deleteBankSoal(id: string) {
  await prisma.bankSoal.delete({
    where: { id },
  });

  revalidatePath("/guru/bank-soal");
}
