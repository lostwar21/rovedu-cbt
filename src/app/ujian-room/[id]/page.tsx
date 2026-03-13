import { getDetailSesiUjian } from "@/lib/actions/sesi";
import { TestEngine } from "@/components/siswa/TestEngine";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function UjianRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const sesiId = resolvedParams.id;

  try {
    const data = await getDetailSesiUjian(sesiId);

    return (
      <TestEngine
        sesi={data.sesi}
        listSoal={data.soal}
        jawabanExist={data.jawabanExist}
      />
    );
  } catch (error: any) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-destructive/20 rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-destructive mb-2">Akses Ditolak</h1>
            <p className="text-muted-foreground">{error.message || "Sesi ujian tidak valid atau telah berakhir."}</p>
          </div>
          <Link 
            href="/siswa/ujian"
            className="block w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 rounded-xl font-bold transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }
}
