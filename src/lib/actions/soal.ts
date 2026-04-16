"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// NOTE: Kolom baru (tingkatKesulitan, acakOpsi, dst.) akan aktif setelah
// `prisma db push` selesai. Untuk sementara, hanya field dasar yang dikirim.

export async function getBankSoalLengkap(bankSoalId: string) {
  try {
    return await prisma.bankSoal.findUnique({
      where: { id: bankSoalId },
      include: {
        mataPelajaran: true,
        soal: {
          include: { opsi: true },
          orderBy: { id: 'asc' }
        }
      }
    });
  } catch (error) {
    console.error("Gagal memuat Detail Bank Soal:", error);
    return null;
  }
}

// Tambah Soal Pilihan Ganda
export async function createSoalPG(bankSoalId: string, data: any) {
    await prisma.soal.create({
        data: {
            bankSoalId,
            teks: data.teks,
            tipe: "PG",
            bobot: parseInt(data.bobot) || 1,
            kategori: data.kategori || null,
            kompetensiDasar: data.kompetensiDasar || null,
            tingkatKesulitan: data.tingkatKesulitan || "SEDANG",
            taksonomi: data.taksonomi || null,
            acakOpsi: data.acakOpsi ?? true,
            gambar: data.gambar || null,
            opsi: {
                create: data.opsi.map((o: any) => ({
                    teks: o.teks,
                    benar: o.benar
                }))
            }
        }
    });
    revalidatePath(`/guru/bank-soal/${bankSoalId}`);
}

// Tambah Soal Essay
export async function createSoalEssay(bankSoalId: string, data: any) {
    await prisma.soal.create({
        data: {
            bankSoalId,
            teks: data.teks,
            tipe: "ESSAY",
            bobot: parseInt(data.bobot) || 1,
            kategori: data.kategori || null,
            kompetensiDasar: data.kompetensiDasar || null,
            tingkatKesulitan: data.tingkatKesulitan || "SEDANG",
            taksonomi: data.taksonomi || null,
            acakOpsi: false,
            gambar: data.gambar || null,
        }
    });
    revalidatePath(`/guru/bank-soal/${bankSoalId}`);
}

// Update Soal Pilihan Ganda
export async function updateSoalPG(bankSoalId: string, soalId: string, data: any) {
    await prisma.$transaction(async (tx) => {
        // 1. Hapus semua opsi lama
        await tx.opsiJawaban.deleteMany({ where: { soalId } });
        
        // 2. Update soal utama + buat ulang opsi baru
        await tx.soal.update({
            where: { id: soalId },
            data: {
                teks: data.teks,
                bobot: parseInt(data.bobot) || 1,
                kategori: data.kategori || null,
                kompetensiDasar: data.kompetensiDasar || null,
                tingkatKesulitan: data.tingkatKesulitan || "SEDANG",
                taksonomi: data.taksonomi || null,
                acakOpsi: data.acakOpsi ?? true,
                gambar: data.gambar || null,
                opsi: {
                    create: data.opsi.map((o: any) => ({
                        teks: o.teks,
                        benar: o.benar
                    }))
                }
            }
        });
    });
    revalidatePath(`/guru/bank-soal/${bankSoalId}`);
}

// Update Soal Essay
export async function updateSoalEssay(bankSoalId: string, soalId: string, data: any) {
    await prisma.soal.update({
        where: { id: soalId },
        data: {
            teks: data.teks,
            bobot: parseInt(data.bobot) || 1,
            kategori: data.kategori || null,
            kompetensiDasar: data.kompetensiDasar || null,
            tingkatKesulitan: data.tingkatKesulitan || "SEDANG",
            taksonomi: data.taksonomi || null,
            gambar: data.gambar || null,
        }
    });
    revalidatePath(`/guru/bank-soal/${bankSoalId}`);
}

export async function deleteSoal(bankSoalId: string, soalId: string) {
    await prisma.soal.delete({ where: { id: soalId } });
    revalidatePath(`/guru/bank-soal/${bankSoalId}`);
}
