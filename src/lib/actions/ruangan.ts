"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getRuangan() {
  return await prisma.ruangUjian.findMany({
    orderBy: { nama: "asc" },
  });
}

export async function createRuangan(formData: FormData) {
  const nama = formData.get("nama") as string;
  const kapasitas = parseInt(formData.get("kapasitas") as string, 10);

  await prisma.ruangUjian.create({
    data: {
      nama,
      kapasitas,
    },
  });

  revalidatePath("/admin/data-master/ruangan");
}

export async function updateRuangan(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const kapasitas = parseInt(formData.get("kapasitas") as string, 10);

  await prisma.ruangUjian.update({
    where: { id },
    data: {
      nama,
      kapasitas,
    },
  });

  revalidatePath("/admin/data-master/ruangan");
}

export async function deleteRuangan(id: string) {
  await prisma.ruangUjian.delete({
    where: { id },
  });

  revalidatePath("/admin/data-master/ruangan");
}
