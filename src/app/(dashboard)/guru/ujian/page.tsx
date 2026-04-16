import { auth } from "@/auth";
import { getUjianByGuru, getDataFormUjian } from "@/lib/actions/ujian";
import { ManajemenUjianTable } from "@/components/guru/ujian/ManajemenUjianTable";
import { redirect } from "next/navigation";

export default async function ManajemenUjianPage() {
  const session = await auth();

  if (!session?.user || (session.user.role !== "GURU" && session.user.role !== "ADMIN")) {
    return redirect("/login");
  }

  const [listUjian, dataForm] = await Promise.all([
    getUjianByGuru(),
    getDataFormUjian(),
  ]);

  if (!dataForm && session.user.role !== "ADMIN") {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Data tidak tersedia. Pastikan akun guru Anda sudah dikonfigurasi dengan benar.
      </div>
    );
  }

  // Jika dataForm null (admin), berikan objek kosong agar komponen tidak crash
  const safeDataForm = dataForm || { guru: { bankSoal: [] }, kelas: [] };

  return (
    <div className="fade-in space-y-6">
      {session.user.role === "ADMIN" && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-primary font-bold">
          Mode Super Admin: Menampilkan seluruh manajemen ujian antar guru.
        </div>
      )}
      <ManajemenUjianTable
        listUjian={listUjian as any}
        listBankSoal={safeDataForm.guru.bankSoal as any}
        listKelas={safeDataForm.kelas as any}
      />
    </div>
  );
}
