"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTahunAjaran() {
  return await prisma.tahunAjaran.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function createTahunAjaran(formData: FormData) {
  const nama = formData.get("nama") as string;
  const semester = formData.get("semester") as string;

  await prisma.tahunAjaran.create({
    data: {
      nama,
      semester,
    },
  });

  revalidatePath("/admin/tahun-ajaran");
}

export async function updateTahunAjaran(id: string, formData: FormData) {
  const nama = formData.get("nama") as string;
  const semester = formData.get("semester") as string;

  await prisma.tahunAjaran.update({
    where: { id },
    data: {
      nama,
      semester,
    },
  });

  revalidatePath("/admin/tahun-ajaran");
}

export async function deleteTahunAjaran(id: string) {
  await prisma.tahunAjaran.delete({
    where: { id },
  });

  revalidatePath("/admin/tahun-ajaran");
}

export async function setTahunAjaranAktif(id: string) {
  // Matikan semua yang aktif dulu
  await prisma.tahunAjaran.updateMany({
    where: { aktif: true },
    data: { aktif: false },
  });

  // Aktifkan yang dipilih
  await prisma.tahunAjaran.update({
    where: { id },
    data: { aktif: true },
  });

  revalidatePath("/admin/tahun-ajaran");
}
