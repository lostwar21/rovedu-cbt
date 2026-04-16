"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// Import dihapus untuk mencegah runtime crash jika client stale
// import { TingkatKesulitan } from "@prisma/client";

export async function importSoalExcelAction(
    bankSoalId: string, 
    soalData: Array<{
        teks: string;
        gambar: string | null;
        tipe: "PG" | "ESSAY";
        bobot: number;
        tingkatKesulitan: "MUDAH" | "SEDANG" | "SULIT";
        taksonomi: string;
        kompetensiDasar: string;
        acakOpsi: boolean;
        opsi?: Array<{ teks: string; benar: boolean }>;
    }>
) {
    if (!bankSoalId || !soalData || soalData.length === 0) {
        throw new Error("Data soal tidak valid atau kosong.");
    }

    try {
        // Lakukan import dalam satu transaksi untuk menjamin integritas data
        await prisma.$transaction(async (tx) => {
            for (const soal of soalData) {
                if (soal.tipe === "PG") {
                    await tx.soal.create({
                        data: {
                            bankSoalId,
                            tipe: "PG",
                            teks: soal.teks,
                            bobot: soal.bobot || 1,
                            tingkatKesulitan: soal.tingkatKesulitan || "SEDANG",
                            taksonomi: soal.taksonomi || "",
                            kompetensiDasar: soal.kompetensiDasar || "",
                            acakOpsi: soal.acakOpsi !== undefined ? soal.acakOpsi : true,
                            gambar: soal.gambar,
                            opsi: {
                                create: soal.opsi?.map(o => ({
                                    teks: o.teks,
                                    benar: o.benar
                                })) || []
                            }
                        }
                    });
                } else if (soal.tipe === "ESSAY") {
                    await tx.soal.create({
                        data: {
                            bankSoalId,
                            tipe: "ESSAY",
                            teks: soal.teks,
                            bobot: soal.bobot || 1,
                            tingkatKesulitan: soal.tingkatKesulitan || "SEDANG",
                            taksonomi: soal.taksonomi || "",
                            kompetensiDasar: soal.kompetensiDasar || "",
                            acakOpsi: false
                        }
                    });
                }
            }
        });

        revalidatePath(`/guru/bank-soal/${bankSoalId}`);
        return { success: true, count: soalData.length };
    } catch (error: any) {
        console.error("Error importing soal:", error);
        
        let customMessage = error.message;
        if (error.code === 'P2021' || error.message?.includes('column')) {
            customMessage = "Struktur database belum siap. Mohon jalankan 'npx prisma db push' di terminal.";
        }
        
        throw new Error("Gagal mengimport soal: " + customMessage);
    }
}
