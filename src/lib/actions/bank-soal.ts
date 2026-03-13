"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGuruId(userId: string) {
  const guru = await prisma.guru.findUnique({ where: { userId } });
  return guru?.id;
}

export async function getMapelByGuru(userId: string) {
  const guru = await prisma.guru.findUnique({
    where: { userId },
    include: { mataPelajaran: true }
  });
  return guru?.mataPelajaran || [];
}

export async function getBankSoalByGuru(guruId: string) {
    // Fungsi ini bertugas menarik data dari tabel bankSoal
    // dan menyertakan juga relasi Mata Pelajarannya.
    return await prisma.bankSoal.findMany({
        where: { guruId: guruId },
        include: {
            mataPelajaran: true,
            _count: {
                select: { soal: true } // Menghitung jumlah butir soal di dalamnya
            }
        },
        orderBy: { nama: "asc" }, // Diurutkan sesuai abjad
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
