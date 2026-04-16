import { getSesiByUjianAction } from "@/lib/actions/sesi";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChevronLeft, User, BookOpen, Clock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { ExportButton } from "@/components/guru/ExportButton";

export default async function UjianResultPage({ 
  params 
}: { 
  params: Promise<{ ujianId: string }> 
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "GURU") {
    redirect("/login");
  }

  const { ujianId } = await params;
  
  const ujian = await prisma.ujian.findUnique({
    where: { id: ujianId },
    include: { mataPelajaran: true }
  });

  if (!ujian) redirect("/guru/penilaian");

  const listSesi = await getSesiByUjianAction(ujianId);

  // Kalkulasi Statistik
  const finishedSesi = listSesi.filter(s => s.status === 'SELESAI');
  const totalNilai = finishedSesi.reduce((acc, curr) => acc + (curr.hasil?.nilaiTotal || 0), 0);
  const avgNilai = finishedSesi.length > 0 ? (totalNilai / finishedSesi.length).toFixed(1) : "0.0";
  
  const rawMax = finishedSesi.length > 0 ? Math.max(...finishedSesi.map(s => s.hasil?.nilaiTotal || 0)) : 0;
  const rawMin = finishedSesi.length > 0 ? Math.min(...finishedSesi.map(s => s.hasil?.nilaiTotal || 0)) : 0;
  const maxNilai = Number(rawMax).toFixed(1);
  const minNilai = Number(rawMin).toFixed(1);

  const passedCount = finishedSesi.filter(s => (s.hasil?.nilaiTotal || 0) >= 75).length; // KKM 75 asumsi

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/guru/penilaian" 
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{ujian.judul}</h1>
            <p className="text-xs text-muted-foreground">{ujian.mataPelajaran.nama} • Rekapitulasi Hasil & Statistik</p>
          </div>
        </div>

        <ExportButton 
          data={listSesi} 
          filename={`Rekap_${ujian.judul.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}`} 
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Rata-rata Nilai</p>
          <p className="text-2xl font-black text-primary">{avgNilai}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Tertinggi / Terendah</p>
          <p className="text-2xl font-black">{maxNilai} <span className="text-muted-foreground text-sm">/ {minNilai}</span></p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Sudah Selesai</p>
          <p className="text-2xl font-black text-emerald-500">{finishedSesi.length} <span className="text-muted-foreground text-sm">/ {listSesi.length}</span></p>
        </div>
        <div className="bg-card border border-border p-4 rounded-xl">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Lulus (KKM 75)</p>
          <p className="text-2xl font-black text-blue-500">{passedCount}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius-lg)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Siswa</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Jawaban</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nilai Sementara</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listSesi.map((sesi) => (
                <tr key={sesi.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{sesi.siswa.user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sesi.siswa.nis} • {sesi.siswa.kelas.nama}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      sesi.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {sesi.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      {sesi._count.jawaban} Terjawab
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-primary">
                        {(sesi.hasil?.nilaiTotal || 0).toFixed(1)}
                      </span>
                      {sesi.hasil?.nilaiEssay === 0 && (
                        <span className="text-[9px] text-amber-500 font-bold flex items-center gap-1 uppercase">
                          <Star className="w-2.5 h-2.5" /> Butuh Koreksi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/guru/penilaian/sesi/${sesi.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-xs font-bold transition-all"
                    >
                      Buka Lembar Jawab <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {listSesi.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-muted-foreground italic text-sm">
                    Belum ada siswa yang mengerjakan atau menyelesaikan ujian ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
