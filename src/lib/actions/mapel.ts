"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMataPelajaran() {
  return await prisma.mataPelajaran.findMany({
    include: {
      _count: {
        select: { guru: true }
      }
    },
    orderBy: { nama: "asc" },
  });
}

export async function createMataPelajaran(formData: FormData) {
  const nama = formData.get("nama") as string;
  const kode = formData.get("kode") as string;

  await prisma.mataPelajaran.create({
    data: {
      nama,
      kode,
    },
  });

  revalidatePath("/admin/data-master/mapel");
}

export async function updateMataPelajaran(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const kode = formData.get("kode") as string;

  await prisma.mataPelajaran.update({
    where: { id },
    data: {
      nama,
      kode,
    },
  });

  revalidatePath("/admin/data-master/mapel");
}

export async function deleteMataPelajaran(id: string) {
  await prisma.mataPelajaran.delete({
    where: { id },
  });

  revalidatePath("/admin/data-master/mapel");
}
