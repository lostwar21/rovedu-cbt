import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ManajemenJadwal } from "@/components/guru/jadwal/ManajemenJadwal";
import { getJadwalByGuru, getRuangUjian } from "@/lib/actions/jadwal";
import { getUjianByGuru } from "@/lib/actions/ujian";
import { getKelas } from "@/lib/actions/kelas";

export default async function JadwalUjianPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "GURU" && session.user.role !== "ADMIN")) {
    return redirect("/login");
  }

  // Ambil profil guru untuk mendapatkan guruId (hanya jika role adalah GURU)
  let guruId = "";
  if (session.user.role === "GURU") {
    const guru = await prisma.guru.findUnique({
      where: { userId: session.user.id },
    });
    if (!guru) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          Data guru tidak ditemukan. Silakan hubungi admin.
        </div>
      );
    }
    guruId = guru.id;
  } else {
    // Role ADMIN tidak butuh guruId spesifik untuk melihat data global
    guruId = "admin"; 
  }

  // Load data secara paralel
  const [listJadwal, listRuang, listUjian, listKelas] = await Promise.all([
    getJadwalByGuru(guruId),
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
        guruId={guruId}
      />
    </div>
  );
}
