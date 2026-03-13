"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getKelas() {
  return await prisma.kelas.findMany({
    include: {
      tahunAjaran: true,
      _count: {
        select: { siswa: true }
      }
    },
    orderBy: [
      { tingkat: "asc" },
      { nama: "asc" }
    ],
  });
}

export async function createKelas(formData: FormData) {
  const nama = formData.get("nama") as string;
  const tingkat = parseInt(formData.get("tingkat") as string, 10);
  const tahunAjaranId = formData.get("tahunAjaranId") as string;

  await prisma.kelas.create({
    data: {
      nama,
      tingkat,
      tahunAjaranId,
    },
  });

  revalidatePath("/admin/data-master/kelas");
}

export async function updateKelas(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const tingkat = parseInt(formData.get("tingkat") as string, 10);
  const tahunAjaranId = formData.get("tahunAjaranId") as string;

  await prisma.kelas.update({
    where: { id },
    data: {
      nama,
      tingkat,
      tahunAjaranId,
    },
  });

  revalidatePath("/admin/data-master/kelas");
}

export async function deleteKelas(id: string) {
  await prisma.kelas.delete({
    where: { id },
  });

  revalidatePath("/admin/data-master/kelas");
}
