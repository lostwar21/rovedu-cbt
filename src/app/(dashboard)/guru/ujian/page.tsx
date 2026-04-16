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

  if (!dataForm) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Data tidak tersedia. Pastikan akun guru Anda sudah dikonfigurasi dengan benar.
      </div>
    );
  }

  return (
    <div className="fade-in">
      <ManajemenUjianTable
        listUjian={listUjian as any}
        listBankSoal={dataForm.guru.bankSoal as any}
        listKelas={dataForm.kelas as any}
      />
    </div>
  );
}
