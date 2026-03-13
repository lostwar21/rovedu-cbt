import { Users, BookOpen, Activity, FileText, ArrowRight, Key } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusUjian } from "@prisma/client";
import Link from "next/link";
import { SystemHealthMonitor } from "@/components/admin/SystemHealthMonitor";

export default async function AdminDashboard() {
  const now = new Date();

  const [totalSiswa, totalSoal, ujianAktif, activeUsersCount, jadwalBerjalan] = await Promise.all([
    prisma.siswa.count(),
    prisma.soal.count(),
    prisma.ujian.count(),
    prisma.sesiUjian.count({ where: { status: StatusUjian.BERJALAN } }),
    prisma.jadwalUjian.findMany({
      where: {
        waktuMulai: { lte: now },
        waktuSelesai: { gte: now }
      },
      include: {
        ujian: {
          include: {
            mataPelajaran: { select: { nama: true } },
            kelas: { select: { nama: true } }
          }
        },
        ruang: { select: { nama: true } }
      },
      orderBy: { waktuMulai: 'asc' },
      take: 10
    })
  ]);

  return (
    <div className="space-y-8 fade-in h-full">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-[var(--radius-lg)] p-8 border border-white/20 dark:border-white/5 shadow-sm">
        <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-3">
          Status Operasional Sistem
          <div className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
        </h1>
        <p className="text-muted-foreground font-medium">
          Dashboard pusat kontrol Rovedu CBT. Monitoring real-time aktivitas pengerjaan dan kesehatan server.
        </p>
      </div>

      {/* System Health Section */}
      <SystemHealthMonitor activeUsers={activeUsersCount} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Siswa</p>
            <h3 className="text-3xl font-bold text-foreground">{totalSiswa.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Ujian Berlangsung</p>
            <h3 className="text-3xl font-bold text-foreground">{jadwalBerjalan.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Soal</p>
            <h3 className="text-3xl font-bold text-foreground">{totalSoal.toLocaleString()}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Ujian</p>
            <h3 className="text-3xl font-bold text-foreground">{ujianAktif}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <FileText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Real-time Monitor Ujian */}
      <div className="glass rounded-[var(--radius-lg)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Real-time Monitor Ujian Berjalan</h2>
          <Link href="/admin/data-master" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            Kelola Data <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="pb-3 font-medium px-4">Sesi Ujian / Mata Pelajaran</th>
                <th className="pb-3 font-medium px-4">Ruang</th>
                <th className="pb-3 font-medium px-4">Token</th>
                <th className="pb-3 font-medium px-4">Waktu</th>
                <th className="pb-3 font-medium px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm border-t border-border/50">
              {jadwalBerjalan.length > 0 ? jadwalBerjalan.map((j) => (
                <tr key={j.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-bold text-foreground">{j.ujian.judul}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">{j.ujian.mataPelajaran.nama}</p>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground font-medium">{j.ruang.nama}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 w-fit">
                        <Key className="w-3.5 h-3.5" />
                        <span className="font-black tracking-widest text-xs">{j.ujian.token || "---"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground font-medium tabular-nums">
                    {new Date(j.waktuMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(j.waktuSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted-foreground text-sm italic">
                    Tidak ada ujian yang sedang berlangsung saat ini.
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
