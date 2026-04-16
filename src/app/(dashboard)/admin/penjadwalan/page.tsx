"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminManajemenJadwal } from "@/components/admin/jadwal/AdminManajemenJadwal";
import { getAllJadwalAction, getRuangUjian } from "@/lib/actions/jadwal";
import { getAllUjianAction } from "@/lib/actions/ujian";
import { getKelas } from "@/lib/actions/kelas";
import { getPengguna } from "@/lib/actions/pengguna";

export default async function AdminPenjadwalanPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return redirect("/login");
  }

  // Load data secara paralel untuk performa maksimal
  const [listJadwal, listRuang, listUjian, listPengawas, listKelas] = await Promise.all([
    getAllJadwalAction(),
    getRuangUjian(),
    getAllUjianAction(),
    getPengguna(["PENGAWAS", "GURU"]), // Ambil akun Admin & Pengawas gabungan
    getKelas(),
  ]);

  return (
    <div className="fade-in max-w-7xl mx-auto p-4 md:p-8">
      <AdminManajemenJadwal
        listJadwal={listJadwal as any}
        listRuang={listRuang as any}
        listUjian={listUjian as any}
        listPengawas={listPengawas as any}
        listKelas={listKelas as any}
      />
    </div>
  );
}
