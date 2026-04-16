"use server"

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Hyper-Safe Import Action
 * Fungsi ini tidak akan pernah melakukan 'throw error' secara fatal.
 * Ia selalu mengembalikan objek JSON murni: { success, count, error }
 */
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
    console.log(`[IMPORT] Memulai proses import untuk Bank Soal ID: ${bankSoalId}. Total soal: ${soalData?.length}`);

    if (!bankSoalId || !soalData || soalData.length === 0) {
        return { success: false, count: 0, error: "Data soal tidak valid atau kosong." };
    }

    try {
        // Gunakan timeout dan transaksi yang lebih terisolasi
        const result = await prisma.$transaction(async (tx) => {
            let createCount = 0;
            for (const soal of soalData) {
                if (soal.tipe === "PG") {
                    await tx.soal.create({
                        data: {
                            bankSoalId,
                            tipe: "PG",
                            teks: soal.teks,
                            bobot: Number(soal.bobot) || 1,
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
                            bobot: Number(soal.bobot) || 1,
                            tingkatKesulitan: soal.tingkatKesulitan || "SEDANG",
                            taksonomi: soal.taksonomi || "",
                            kompetensiDasar: soal.kompetensiDasar || "",
                            acakOpsi: false
                        }
                    });
                }
                createCount++;
            }
            return createCount;
        }, {
            timeout: 30000 // Berikan waktu 30 detik untuk transaksi besar
        });

        console.log(`[IMPORT] Transaksi Berhasil. ${result} soal dibuat.`);

        // Revalidasi di luar transaksi
        try {
            revalidatePath(`/guru/bank-soal/${bankSoalId}`);
        } catch (revalidateError) {
            console.error("[IMPORT] Gagal revalidatePath, tapi data sudah masuk:", revalidateError);
        }

        return { success: true, count: result };

    } catch (error: any) {
        console.error("[IMPORT] KESALAHAN FATAL:", error);
        
        let msg = error?.message || "Terjadi kesalahan internal pada server.";
        if (error?.code === 'P2021' || msg.includes('column')) {
            msg = "Struktur database tidak sinkron. Mohon jalankan 'npx prisma db push'.";
        } else if (msg.includes('serialize')) {
            msg = "Gagal mengirimkan data dari server ke browser (Serialization Error).";
        }

        return { 
            success: false, 
            count: 0, 
            error: msg
        };
    }
}
