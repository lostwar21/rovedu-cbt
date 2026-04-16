import { Activity, Users, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { auth } from "@/auth";
import { getJadwalByPengawas } from "@/lib/actions/jadwal";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PengawasDashboard() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "PENGAWAS" && session.user.role !== "ADMIN")) {
    return <div className="p-8 text-center text-muted-foreground">Akses Ditolak.</div>;
  }

  const listJadwal = await getJadwalByPengawas(session?.user?.id as string);

  const stats = {
    ruanganAktif: listJadwal.length,
    totalPeserta: 0, // Bisa dihitung jika perlu join ke Siswa
    pelanggaran: 0, // Bisa dihitung dari Pelanggaran table
    selesai: 0
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-emerald-500/10 to-accent/10 rounded-[var(--radius-lg)] p-8 border border-white/20 dark:border-white/5 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Selamat Datang, Bapak/Ibu {session?.user?.name || "Pengawas"}
        </h1>
        <p className="text-muted-foreground">
          Monitor status ujian dan keamanan ruangan yang Anda awasi secara real-time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Jadwal Tugas</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.ruanganAktif}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Status Keamanan</p>
            <h3 className="text-lg font-bold text-emerald-500 uppercase">Aktif</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between opacity-50">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Pelanggaran Terdeteksi</p>
            <h3 className="text-3xl font-bold text-destructive">-</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between opacity-50">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Ujian Selesai</p>
            <h3 className="text-3xl font-bold text-foreground">-</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tampilan Ruangan */}
      <div className="glass rounded-[var(--radius-lg)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Status Ruangan Anda</h2>
        </div>
        
        {listJadwal.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">Anda belum memiliki jadwal pengawasan aktif hari ini.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listJadwal.map((jadwal) => (
              <div key={jadwal.id} className="p-5 border border-border bg-card rounded-xl hover:border-primary/50 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{jadwal.ruang.nama}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{jadwal.ujian.mataPelajaran.nama}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-500 uppercase tracking-tighter">
                    Tersedia
                  </span>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Judul Ujian:</span>
                    <span className="font-medium">{jadwal.ujian.judul}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Waktu:</span>
                    <span className="font-medium">
                      {jadwal.waktuMulai.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {jadwal.waktuSelesai.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <Link 
                  href={`/pengawas/monitor/${jadwal.id}`}
                  className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                >
                  <Activity className="w-4 h-4" /> Buka Monitor Ujian
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
