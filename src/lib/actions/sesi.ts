"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { formatWIBTime } from "@/lib/date-utils";

export async function mulaiUjianAction(data: {
  jadwalId: string;
  tokenInput?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SISWA") {
    throw new Error("Tidak terautentikasi.");
  }

  // 1. Dapatkan data jadwal dan ujian
  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: data.jadwalId },
    include: {
      ujian: true,
    }
  });

  if (!jadwal) throw new Error("Jadwal ujian tidak ditemukan.");

  const now = new Date();
  
  // 2. Validasi Waktu (Hanya bisa mulai jika sekarang di antara waktuMulai dan waktuSelesai)
  // Berikan toleransi keterlambatan (siswa masih bisa masuk selama waktuSelesai belum lewat)
  if (now < jadwal.waktuMulai) {
    throw new Error(`Ujian belum dimulai. Silakan tunggu hingga ${formatWIBTime(jadwal.waktuMulai)}.`);
  }
  
  if (now > jadwal.waktuSelesai) {
    throw new Error("Ujian sudah berakhir.");
  }

  // 3. Validasi Token (Jika ujian memerlukan token)
  if (jadwal.ujian.token) {
    if (!data.tokenInput) {
      throw new Error("Token diperlukan untuk memulai ujian ini.");
    }
    if (data.tokenInput !== jadwal.ujian.token) {
      throw new Error("Token yang Anda masukkan salah.");
    }
  }

  // 4. Cek apakah sudah ada sesi aktif
  const siswa = await prisma.siswa.findUnique({
    where: { userId: session.user.id }
  });
  if (!siswa) throw new Error("Profil siswa tidak ditemukan.");

  const existingSesi = await prisma.sesiUjian.findFirst({
    where: {
      siswaId: siswa.id,
      ujianId: jadwal.ujianId,
    }
  });

  if (existingSesi) {
    if (existingSesi.status === "SELESAI") {
      throw new Error("Anda sudah menyelesaikan ujian ini.");
    }
    return { success: true, sesiId: existingSesi.id };
  }

  // 5. Buat Sesi Baru (dengan proteksi Race Condition via @@unique constraint)
  try {
    const sesiBaru = await prisma.sesiUjian.create({
      data: {
        siswaId: siswa.id,
        ujianId: jadwal.ujianId,
        jadwalId: jadwal.id,
        status: "BERJALAN",
        waktuMulai: now,
      }
    });
    revalidatePath('/siswa/ujian');
    return { success: true, sesiId: sesiBaru.id };
  } catch (e: any) {
    // Unique constraint violation = sesi sudah dibuat oleh request paralel
    if (e.code === 'P2002') {
      const fallback = await prisma.sesiUjian.findFirst({
        where: { siswaId: siswa.id, ujianId: jadwal.ujianId }
      });
      if (fallback) return { success: true, sesiId: fallback.id };
    }
    throw e;
  }
}

// Mendapatkan detail soal untuk pengerjaan ujian (OPTIMIZED: 2 parallel queries instead of 4 sequential)
export async function getDetailSesiUjian(sesiId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Query 1: Sesi + Ujian + Mapel (single query with include)
  const [siswa, sesi] = await Promise.all([
    prisma.siswa.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    prisma.sesiUjian.findUnique({
      where: { id: sesiId },
      include: {
        ujian: {
          include: {
            mataPelajaran: { select: { nama: true } },
          },
          // Hanya select field yang dibutuhkan
        },
      }
    })
  ]);

  if (!siswa) throw new Error("Terjadi kesalahan pada data siswa.");
  if (!sesi || sesi.status === "SELESAI") {
    throw new Error("Sesi ujian tidak valid atau sudah selesai.");
  }
  if (sesi.siswaId !== siswa.id) {
    throw new Error("AKSES DILARANG: Sesi uji bukan milik Anda!");
  }

  // Query 2: Soal + Jawaban (parallel)
  const [soalRaw, jawabanRaw] = await Promise.all([
    prisma.soal.findMany({
      where: { bankSoalId: sesi.ujian.bankSoalId },
      include: { opsi: true }
    }),
    prisma.jawabanSiswa.findMany({
      where: { sesiId: sesi.id }
    })
  ]);

  let listSoal = [...soalRaw];
  
  if (sesi.ujian.acakSoal) {
    listSoal = shuffleWithSeed(listSoal, sesi.id);
  }

  if (sesi.ujian.acakOpsi) {
    listSoal = listSoal.map(s => ({
      ...s,
      opsi: shuffleWithSeed([...s.opsi], `${sesi.id}-${s.id}`)
    }));
  }

  return {
    sesi: {
      id: sesi.id,
      waktuMulai: sesi.waktuMulai.toISOString(),
      status: sesi.status,
      ujian: {
        judul: sesi.ujian.judul,
        durasi: sesi.ujian.durasi,
        mapel: sesi.ujian.mataPelajaran?.nama,
      },
      // Hitung sisa waktu dalam detik di server
      sisaDetik: Math.max(0, Math.floor(
        ((sesi.waktuMulai.getTime() + (sesi.ujian.durasi * 60 * 1000)) - Date.now()) / 1000
      ))
    },
    soal: listSoal,
    jawabanExist: jawabanRaw
  };
}

// Helper: Fisher-Yates Shuffle with Seed
function shuffleWithSeed<T>(array: T[], seed: string): T[] {
  let m = array.length, t, i;
  let seedNum = 0;
  for (let charIdx = 0; charIdx < seed.length; charIdx++) {
    seedNum += seed.charCodeAt(charIdx);
  }

  const random = () => {
    const x = Math.sin(seedNum++) * 10000;
    return x - Math.floor(x);
  };

  while (m) {
    i = Math.floor(random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

// Simpan Jawaban (Auto-save) — OPTIMIZED: 3 queries → 1 validasi + 1 upsert
export async function simpanJawabanAction(data: {
  sesiId: string;
  soalId: string;
  opsiId?: string | null;
  essay?: string | null;
  ragu?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Single combined validation query (siswa + sesi ownership in one shot)
  const siswa = await prisma.siswa.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!siswa) throw new Error("Profil siswa tidak ditemukan");

  const sesi = await prisma.sesiUjian.findUnique({
    where: { id: data.sesiId },
    select: { siswaId: true, status: true }
  });

  if (!sesi || sesi.siswaId !== siswa.id) {
    throw new Error("AKSES DIBLOKIR: Sesi bukan milik Anda.");
  }
  if (sesi.status === "SELESAI") {
    throw new Error("Sesi ujian telah ditutup.");
  }

  // Atomic upsert (menggunakan @@unique([sesiId, soalId]))
  return await prisma.jawabanSiswa.upsert({
    where: {
      sesiId_soalId: {
        sesiId: data.sesiId,
        soalId: data.soalId,
      }
    },
    update: {
      opsiDipilihId: data.opsiId || null,
      jawabanEssay: data.essay || null,
      ragu: data.ragu ?? false,
    },
    create: {
      sesiId: data.sesiId,
      soalId: data.soalId,
      opsiDipilihId: data.opsiId || null,
      jawabanEssay: data.essay || null,
      ragu: data.ragu || false,
    }
  });
}

// Submit Final Ujian
export async function submitUjianAction(sesiId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const siswa = await prisma.siswa.findUnique({
    where: { userId: session.user.id }
  });

  if (!siswa) throw new Error("Profil siswa tidak valid");

  const sesi = await prisma.sesiUjian.findUnique({
    where: { id: sesiId },
    select: { id: true, status: true, ujianId: true, siswaId: true }
  });

  if (!sesi) throw new Error("Sesi tidak ditemukan.");
  if (sesi.status === "SELESAI") return { success: true };

  // VALIDASI FATAL: Mencegah submit ujian orang lain
  if (sesi.siswaId !== siswa.id) {
    throw new Error("AKSES DIBLOKIR: Anda tidak berhak mensubmit sesi ini.");
  }

  const ujianObj = await prisma.ujian.findUnique({
    where: { id: sesi.ujianId },
    select: { bankSoalId: true }
  });

  const soalPGStr = await prisma.soal.findMany({
    where: { bankSoalId: ujianObj?.bankSoalId, tipe: "PG" },
    include: { opsi: true }
  });

  const jawabanSiswaLengkap = await prisma.jawabanSiswa.findMany({
    where: { sesiId: sesi.id }
  });

  // 1. Kalkulasi Nilai PG Otomatis
  let correctPg = 0;

  soalPGStr.forEach(s => {
    const jwb = jawabanSiswaLengkap.find(j => j.soalId === s.id);
    const correctOpsi = s.opsi.find(o => o.benar);
    if (jwb?.opsiDipilihId === correctOpsi?.id) {
      correctPg += s.bobot;
    }
  });

  const totalBobotPg = soalPGStr.reduce((acc, curr) => acc + curr.bobot, 0);
  const rawNilaiPg = totalBobotPg > 0 ? (correctPg / totalBobotPg) * 100 : 0;
  const nilaiPg = Number(rawNilaiPg.toFixed(2));

  // 2. Tandai Sesi Selesai
  try {
    await prisma.$transaction([
      prisma.sesiUjian.update({
        where: { id: sesiId },
        data: {
          status: "SELESAI",
          waktuSelesai: new Date()
        }
      }),
      prisma.hasilUjian.create({
        data: {
          siswaId: sesi.siswaId,
          sesiId: sesi.id,
          nilaiPg: nilaiPg,
          nilaiTotal: nilaiPg, // Nilai total awal (belum termasuk essay yang dinilai manual)
        }
      })
    ]);
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Race condition teratasi: Data hasil ujian sudah ada dikarenakan double submit
      console.log(`[CBT] Abaikan duplicate constraint untuk submit sesi ${sesiId}`);
    } else {
      throw error;
    }
  }

  revalidatePath('/siswa/ujian');
  return { success: true };
}

// Log Pelanggaran (Ujian)
export async function logPelanggaranAction(sesiId: string, tipe: string, keterangan?: string) {
  try {
    await prisma.pelanggaran.create({
      data: {
        sesiId,
        tipe,
        keterangan
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Gagal mencatat pelanggaran:", error);
    return { success: false };
  }
}

// Blokir Sesi Ujian (Otomatis saat ketahuan pindah tab)
export async function blokirSesiAction(sesiId: string, alasan: string) {
  try {
    const sesi = await prisma.sesiUjian.update({
      where: { id: sesiId },
      data: { status: "DIBLOKIR" }
    });
    
    await prisma.pelanggaran.create({
      data: {
        sesiId,
        tipe: "SYSTEM_BLOCK",
        keterangan: alasan
      }
    });

    revalidatePath(`/ujian-room/${sesiId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Gagal memblokir sesi." };
  }
}

// Buka Blokir Sesi Ujian (Menggunakan Token)
export async function resumeSesiAction(sesiId: string, inputToken: string) {
  try {
    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: sesiId },
      include: { ujian: true }
    });

    if (!sesi) return { success: false, message: "Sesi tidak ditemukan." };
    if (sesi.status !== "DIBLOKIR") return { success: true }; // Sudah terbuka

    if (sesi.ujian.token !== inputToken) {
      return { success: false, message: "Token yang Anda masukkan salah. Hubungi pengawas." };
    }

    // Buka blokir
    await prisma.sesiUjian.update({
      where: { id: sesiId },
      data: { status: "BERJALAN" }
    });

    await prisma.pelanggaran.create({
      data: {
        sesiId,
        tipe: "RESUME",
        keterangan: "Sesi berhasil dipulihkan dengan token."
      }
    });

    revalidatePath(`/ujian-room/${sesiId}`);
    return { success: true };
  } catch (error) {
    return { success: false, message: "Gagal membuka blokir sesi." };
  }
}

// Mendapatkan data monitoring real-time untuk satu jadwal (Digunakan Pengawas)
export async function getMonitoringDataAction(jadwalId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const jadwal = await prisma.jadwalUjian.findUnique({
    where: { id: jadwalId },
    include: {
      ujian: {
        include: {
          mataPelajaran: true,
          kelas: true,
        }
      },
      ruang: true,
    }
  });

  if (!jadwal) throw new Error("Jadwal tidak ditemukan.");

  // Ambil semua sesi untuk jadwal ujian (ruangan) spesifik ini
  // Filter ini sangat akurat karena jadwalId merepresentasikan Kombinasi [Ujian + Ruang + Pengawas + Waktu]
  const daftarSesi = await prisma.sesiUjian.findMany({
    where: {
      jadwalId: jadwalId
    },
    include: {
      siswa: {
        include: {
          user: {
            select: { name: true }
          },
          kelas: true,
        }
      },
      logPelanggaran: {
        orderBy: { waktu: "desc" },
        take: 1
      },
      _count: {
        select: { jawaban: true }
      }
    },
    orderBy: {
      siswa: {
        user: { name: "asc" }
      }
    }
  });

  // Hitung total soal untuk persentase progres
  const totalSoal = await prisma.soal.count({
    where: { bankSoalId: jadwal.ujian.bankSoalId }
  });

  return {
    jadwal,
    totalSoal,
    daftarSesi: daftarSesi.map(s => ({
      id: s.id,
      siswaName: s.siswa.user.name,
      siswaNis: s.siswa.nis,
      kelas: s.siswa.kelas.nama,
      status: s.status,
      waktuMulai: s.waktuMulai,
      lastPelanggaran: s.logPelanggaran[0]?.keterangan || null,
      progres: s._count.jawaban,
    }))
  };
}

// Paksa Selesai Sesi (Oleh Pengawas) — Logika scoring terpisah tanpa validasi kepemilikan siswa
export async function forceSubmitSesiAction(sesiId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "SISWA") {
    throw new Error("Unauthorized");
  }

  const sesi = await prisma.sesiUjian.findUnique({
    where: { id: sesiId },
    select: { id: true, status: true, ujianId: true, siswaId: true }
  });

  if (!sesi) throw new Error("Sesi tidak ditemukan.");
  if (sesi.status === "SELESAI") return { success: true };

  const ujianObj = await prisma.ujian.findUnique({
    where: { id: sesi.ujianId },
    select: { bankSoalId: true }
  });

  const [soalPG, jawabanSiswa] = await Promise.all([
    prisma.soal.findMany({
      where: { bankSoalId: ujianObj?.bankSoalId, tipe: "PG" },
      include: { opsi: true }
    }),
    prisma.jawabanSiswa.findMany({
      where: { sesiId: sesi.id }
    })
  ]);

  let correctPg = 0;
  soalPG.forEach(s => {
    const jwb = jawabanSiswa.find(j => j.soalId === s.id);
    const correctOpsi = s.opsi.find(o => o.benar);
    if (jwb?.opsiDipilihId === correctOpsi?.id) {
      correctPg += s.bobot;
    }
  });

  const totalBobotPg = soalPG.reduce((acc, curr) => acc + curr.bobot, 0);
  const rawNilaiPg = totalBobotPg > 0 ? (correctPg / totalBobotPg) * 100 : 0;
  const nilaiPg = Number(rawNilaiPg.toFixed(2));

  try {
    await prisma.$transaction([
      prisma.sesiUjian.update({
        where: { id: sesiId },
        data: { status: "SELESAI", waktuSelesai: new Date() }
      }),
      prisma.hasilUjian.create({
        data: {
          siswaId: sesi.siswaId,
          sesiId: sesi.id,
          nilaiPg,
          nilaiTotal: nilaiPg,
        }
      })
    ]);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log(`[CBT] Abaikan duplicate constraint untuk force-submit sesi ${sesiId}`);
    } else {
      throw error;
    }
  }

  return { success: true };
}

// Reset Sesi (Hapus Percobaan - Oleh Pengawas/Guru)
export async function resetSesiAction(sesiId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "SISWA") {
    throw new Error("Unauthorized");
  }

  const sesi = await prisma.sesiUjian.findUnique({
    where: { id: sesiId },
    select: { id: true, ujianId: true }
  });

  if (!sesi) throw new Error("Sesi tidak ditemukan.");

  await prisma.$transaction([
    prisma.hasilUjian.deleteMany({ where: { sesiId } }),
    prisma.jawabanSiswa.deleteMany({ where: { sesiId } }),
    prisma.pelanggaran.deleteMany({ where: { sesiId } }),
    prisma.sesiUjian.delete({ where: { id: sesiId } })
  ]);

  return { success: true };
}

// Mendapatkan daftar sesi untuk penilaian (Digunakan Guru)
export async function getSesiByUjianAction(ujianId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await prisma.sesiUjian.findMany({
    where: { ujianId },
    include: {
      siswa: {
        include: {
          user: { select: { name: true } },
          kelas: true
        }
      },
      hasil: true,
      _count: { select: { jawaban: true } }
    },
    orderBy: {
      siswa: { user: { name: "asc" } }
    }
  });
}

// Mendapatkan detail jawaban siswa untuk koreksi (Digunakan Guru)
export async function getJawabanSiswaForScoring(sesiId: string) {
  return await prisma.jawabanSiswa.findMany({
    where: { sesiId },
    include: {
      soal: {
        include: { opsi: true }
      }
    },
    orderBy: { soal: { id: "asc" } }
  });
}

// Update Nilai Essay Manual (Oleh Guru) dan Kalkulasi Nilai Total
export async function updateEssayScoreAction(data: {
  sesiId: string;
  jawabanId: string;
  score: number;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role === "SISWA") {
    throw new Error("Unauthorized");
  }

  // 1. Update nilai pada jawaban spesifik
  await prisma.jawabanSiswa.update({
    where: { id: data.jawabanId },
    data: { nilaiEssay: data.score }
  });

  // 2. Hitung ulang total nilai essay untuk sesi ini
  const allJawaban = await prisma.jawabanSiswa.findMany({
    where: { sesiId: data.sesiId },
    select: { nilaiEssay: true }
  });

  const totalNilaiEssay = allJawaban.reduce((sum, j) => sum + (j.nilaiEssay || 0), 0);

  // 3. Update HasilUjian (nilaiTotal = nilaiPg + totalNilaiEssay)
  // Catatan: Rumus nilai bisa disesuaikan, di sini kita asumsikan akumulasi.
  // Untuk lebih akurat, kita ambil nilaiPg asli dari HasilUjian.
  const hasil = await prisma.hasilUjian.findUnique({
    where: { sesiId: data.sesiId }
  });

  if (hasil) {
    await prisma.hasilUjian.update({
      where: { id: hasil.id },
      data: {
        nilaiEssay: totalNilaiEssay,
        nilaiTotal: Number((hasil.nilaiPg + totalNilaiEssay).toFixed(2))
      }
    });
  }

  revalidatePath(`/guru/penilaian/sesi/${data.sesiId}`);
  return { success: true };
}


