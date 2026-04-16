import { auth } from "@/auth";
import { getBankSoalByGuru, getMapelByGuru, getGuruId } from "@/lib/actions/bank-soal";
import { BankSoalTable } from "@/components/guru/bank-soal/BankSoalTable";

export default async function BankSoalPage() {
  const session = await auth();

  // Pastikan yang login adalah tipe GURU dan memiliki ID
  if (!session?.user?.id || (session.user.role !== "GURU" && session.user.role !== "ADMIN")) {
    return <div className="p-8 text-center text-muted-foreground">Anda tidak memiliki akses ke halaman ini.</div>;
  }

  // Cari ID Spesifik Guru tersebut di database berdasar session.id
  const guruId = await getGuruId(session.user.id);
  
  // Jika role adalah ADMIN, kita gunakan virtual guruId "admin" (sudah ditangani di getGuruId)
  // Dan kita tidak melakukan early return "Profil Belum Tersedia"
  if (!guruId && session.user.role !== "ADMIN") {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Profil Guru Belum Tersedia</h2>
        <p className="text-muted-foreground">Silakan hubungi administrator untuk memastikan akun Anda terdaftar sebagai profil Guru.</p>
      </div>
    );
  }

  // Fallback ID untuk Admin jika getGuruId entah bagaimana gagal
  const finalGuruId = guruId || "admin";

  // Ambil data dari server actions yang baru kita buat
  const dataBankSoal = await getBankSoalByGuru(finalGuruId);
  const listMapel = await getMapelByGuru(session.user.id);

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bank Soal (Super Admin)</h1>
        <p className="text-muted-foreground mt-2">Pusat pengelolaan seluruh bank soal antar guru.</p>
      </div>

      <BankSoalTable data={dataBankSoal} listMapel={listMapel} guruId={finalGuruId} />
    </div>
  );
}
