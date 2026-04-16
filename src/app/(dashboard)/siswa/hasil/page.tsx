import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRiwayatHasilSiswa } from "@/lib/actions/siswa-ujian";
import { ClipboardList, Star, Calendar, CheckCircle } from "lucide-react";

export default async function HasilUjianSiswaPage() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "SISWA" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const riwayat: any = await getRiwayatHasilSiswa();

  if (riwayat.error) {
    return <div className="p-8 text-center text-muted-foreground">{riwayat.error}</div>;
  }

  // Hitung metrik sederhana
  const totalUjian = riwayat.length;
  const avgNilai = totalUjian > 0 
    ? (riwayat.reduce((acc: number, curr: any) => acc + (curr.hasil?.nilaiTotal || 0), 0) / totalUjian).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" /> Riwayat & Hasil Ujian
          </h1>
          <p className="text-muted-foreground text-sm">Lihat daftar ujian yang telah Anda selesaikan beserta skor akhirnya.</p>
        </div>
        
        {totalUjian > 0 && (
          <div className="flex gap-4">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-center">
              <span className="block text-[10px] font-black uppercase tracking-widest">Selesai</span>
              <span className="text-xl font-black">{totalUjian}</span>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-center">
              <span className="block text-[10px] font-black uppercase tracking-widest">Rata-rata</span>
              <span className="text-xl font-black">{avgNilai}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {riwayat.map((sesi: any) => (
          <div key={sesi.id} className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
            {/* Dekorasi BG */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2.5 bg-muted rounded-xl text-foreground">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              {sesi.ujian.tampilkanHasil ? (
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Nilai Akhir</span>
                  <span className="text-3xl font-black text-primary leading-none">{sesi.hasil?.nilaiTotal || 0}</span>
                </div>
              ) : (
                <div className="text-right">
                   <span className="px-2 py-1 rounded bg-muted text-[9px] font-bold uppercase text-muted-foreground">Nilai Dirahasiakan</span>
                </div>
              )}
            </div>

            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-1">{sesi.ujian.judul}</h3>
              <p className="text-xs font-semibold text-muted-foreground mb-4">{sesi.ujian.mataPelajaran.nama}</p>
              
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Dikerjakan pada: {new Date(sesi.waktuSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalUjian === 0 && (
         <div className="py-20 text-center border-2 border-dashed border-border rounded-2xl">
           <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
           <p className="text-muted-foreground font-medium">Belum ada riwayat pengerjaan ujian.</p>
         </div>
      )}
    </div>
  );
}
