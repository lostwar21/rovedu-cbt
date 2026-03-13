import { auth } from "@/auth";
import { getBankSoalByGuru, getMapelByGuru, getGuruId } from "@/lib/actions/bank-soal";
import { BankSoalTable } from "@/components/guru/bank-soal/BankSoalTable";

export default async function BankSoalPage() {
  const session = await auth();

  // Pastikan yang login adalah tipe GURU dan memiliki ID
  if (!session?.user?.id || session.user.role !== "GURU") {
    return <div className="p-8 text-center text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</div>;
  }

  // Cari ID Spesifik Guru tersebut di database berdasar session.id
  const guruId = await getGuruId(session.user.id);
  
  if (!guruId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Profil Guru Belum Tersedia</h2>
        <p className="text-muted-foreground">Silakan hubungi administrator untuk memastikan akun Anda terdaftar sebagai profil Guru.</p>
      </div>
    );
  }

  // Ambil data dari server actions yang baru kita buat
  const dataBankSoal = await getBankSoalByGuru(guruId);
  const listMapel = await getMapelByGuru(session.user.id);

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bank Soal</h1>
        <p className="text-muted-foreground mt-2">Pusat pengelolaan soal-soal Anda secara independen.</p>
      </div>

      <BankSoalTable data={dataBankSoal} listMapel={listMapel} guruId={guruId} />
    </div>
  );
}
