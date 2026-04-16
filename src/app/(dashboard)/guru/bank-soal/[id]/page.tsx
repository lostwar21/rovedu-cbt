import { auth } from "@/auth";
import { getBankSoalLengkap } from "@/lib/actions/soal";
import { EditorSoalLanjutan } from "@/components/guru/bank-soal/EditorSoalLanjutan";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export default async function DetilBankSoalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  // Pastikan yang login adalah tipe GURU
  if (!session?.user?.id || (session.user.role !== "GURU" && session.user.role !== "ADMIN")) {
    return <div className="p-8 text-center text-muted-foreground">Akses Ditolak.</div>;
  }

  // Di Next.js 16+, params adalah Promise — harus di-await dulu
  const { id } = await params;

  // Load Data
  const bankSoal = await getBankSoalLengkap(id);

  if (!bankSoal) {
     return (
        <div className="p-12 text-center flex flex-col items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4"/>
            <h2 className="text-xl font-bold mb-2">Bank Soal Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-6">Mungkin bank soal ini telah dihapus atau URL tidak valid.</p>
            <Link href="/guru/bank-soal" className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium">Kembali ke Daftar</Link>
        </div>
     );
  }

  return (
    <div className="fade-in">
       {/* Inject komponen editor level-lanjut yang menampilkan list soal & form */}
       <EditorSoalLanjutan bankSoal={bankSoal} />
    </div>
  );
}
