import { FileText, ClipboardList, Clock, CheckCircle, Calendar, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { getDaftarUjianSiswa, getRiwayatHasilSiswa } from "@/lib/actions/siswa-ujian";
import Link from "next/link";

export default async function SiswaDashboard() {
  const session = await auth();

  const [dataUjian, riwayat] = await Promise.all([
    getDaftarUjianSiswa(),
    getRiwayatHasilSiswa()
  ]);

  const jadwal: any[] = ('jadwal' in dataUjian ? dataUjian.jadwal : []) as any[];
  const sesiSiswa: any[] = ('sesiSiswa' in dataUjian ? dataUjian.sesiSiswa : []) as any[];
  const riwayatList: any[] = Array.isArray(riwayat) ? riwayat : [];

  const now = new Date();
  const ujianMendatang = jadwal.filter((j: any) => new Date(j.waktuMulai) > now).length;
  const ujianSelesai = riwayatList.length;
  const avgNilai = ujianSelesai > 0
    ? (riwayatList.reduce((acc: number, curr: any) => acc + (curr.hasil?.nilaiTotal || 0), 0) / ujianSelesai).toFixed(1)
    : '-';

  // Jadwal hari ini: yang waktuMulai hari ini dan waktuSelesai belum lewat
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const jadwalHariIni: any[] = jadwal.filter((j: any) => {
    const mulai = new Date(j.waktuMulai);
    return mulai >= todayStart && mulai <= todayEnd;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-[var(--radius-lg)] p-8 border border-white/20 dark:border-white/5 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Selamat Datang, {session?.user?.name || "Siswa"}
        </h1>
        <p className="text-muted-foreground">
          Persiapkan diri Anda dengan baik. Periksa jadwal ujian mendatang dan kerjakan dengan jujur.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Ujian Mendatang</p>
            <h3 className="text-3xl font-bold text-foreground">{ujianMendatang}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Ujian Selesai</p>
            <h3 className="text-3xl font-bold text-foreground">{ujianSelesai}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Rata-rata Nilai</p>
            <h3 className="text-3xl font-bold text-foreground">{avgNilai}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Jadwal Ujian Hari Ini */}
      <div className="glass rounded-[var(--radius-lg)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Jadwal Ujian Anda Hari Ini</h2>
          <Link href="/siswa/ujian" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {jadwalHariIni.length > 0 ? jadwalHariIni.map((j: any) => {
            const sesi = sesiSiswa.find((s: any) => s.ujianId === j.ujianId);
            const isSelesai = sesi?.status === 'SELESAI';
            const isBelumMulai = now < new Date(j.waktuMulai);

            return (
              <div key={j.id} className={`p-5 border-l-4 ${isSelesai ? 'border-l-emerald-500 bg-emerald-500/5' : isBelumMulai ? 'border-l-muted bg-background/50 opacity-75' : 'border-l-primary bg-background'} shadow-sm rounded-r-lg flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${isSelesai ? 'bg-emerald-500/10 text-emerald-600' : isBelumMulai ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                      {isSelesai ? 'Selesai' : isBelumMulai ? 'Belum Mulai' : 'Tersedia'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{j.ujian.judul}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(j.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} — {new Date(j.waktuSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({j.ujian.durasi} Menit)
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {isSelesai ? (
                    <span className="px-6 py-2.5 bg-muted text-muted-foreground font-medium rounded-md text-sm inline-block">Sudah Selesai</span>
                  ) : (
                    <Link
                      href="/siswa/ujian"
                      className={`px-6 py-2.5 font-medium rounded-md shadow-sm text-sm inline-block transition-all ${isBelumMulai ? 'bg-muted text-muted-foreground pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                    >
                      {isBelumMulai ? 'Belum Waktunya' : sesi?.status === 'BERJALAN' ? 'Lanjutkan' : 'Mulai Kerjakan'}
                    </Link>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="py-10 text-center border-2 border-dashed border-border rounded-lg">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground text-sm">Tidak ada jadwal ujian untuk hari ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
