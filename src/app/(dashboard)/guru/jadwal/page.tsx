import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManajemenJadwal } from "@/components/guru/jadwal/ManajemenJadwal";
import { getJadwalByGuru, getRuangUjian } from "@/lib/actions/jadwal";
import { getUjianByGuru } from "@/lib/actions/ujian";
import { getKelas } from "@/lib/actions/kelas";

export default async function JadwalUjianPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "GURU") {
    return redirect("/login");
  }

  // Ambil profil guru untuk mendapatkan guruId
  const guru = await prisma.guru.findUnique({
    where: { userId: session.user.id },
  });

  if (!guru) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Data guru tidak ditemukan.
      </div>
    );
  }

  // Load data secara paralel
  const [listJadwal, listRuang, listUjian, listKelas] = await Promise.all([
    getJadwalByGuru(guru.id),
    getRuangUjian(),
    getUjianByGuru(),
    getKelas(),
  ]);

  return (
    <div className="fade-in">
      <ManajemenJadwal
        listJadwal={listJadwal as any}
        listRuang={listRuang as any}
        listUjian={listUjian as any}
        listKelas={listKelas as any}
        guruId={guru.id}
      />
    </div>
  );
}
