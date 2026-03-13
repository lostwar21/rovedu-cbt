import { BookOpen, FileText, ClipboardList, CheckCircle, ArrowRight, BarChart3 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getGuruAnalytics } from "@/lib/actions/analytics";
import { AnalyticsDashboard } from "@/components/guru/AnalyticsDashboard";

export default async function GuruDashboard() {
  const session = await auth();

  // Cari data guru dari DB
  const guru = await prisma.guru.findUnique({
    where: { userId: session!.user!.id! },
    select: { id: true }
  });

  const guruId = guru?.id;

  const [bankSoalCount, ujianList, belumDinilaiCount, sudahDinilaiCount, analytics] = await Promise.all([
    prisma.bankSoal.count({ where: { guruId: guruId! } }),
    prisma.ujian.findMany({
      where: { bankSoal: { guruId: guruId! } },
      include: {
        mataPelajaran: { select: { nama: true } },
        kelas: { select: { nama: true } },
        _count: { select: { attempts: true } }
      },
      orderBy: { id: 'desc' },
      take: 5
    }),
    prisma.sesiUjian.count({
      where: {
        status: 'SELESAI',
        ujian: { bankSoal: { guruId: guruId! } },
        hasil: { nilaiEssay: 0 }
      }
    }),
    prisma.sesiUjian.count({
      where: {
        status: 'SELESAI',
        ujian: { bankSoal: { guruId: guruId! } },
        hasil: { nilaiEssay: { gt: 0 } }
      }
    }),
    getGuruAnalytics()
  ]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-[var(--radius-lg)] p-8 border border-white/20 dark:border-white/5 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Selamat Datang, Bapak/Ibu {session?.user?.name || "Guru"}
        </h1>
        <p className="text-muted-foreground">
          Pantau bank soal, kelola ujian, dan cek hasil nilai siswa Anda dengan mudah.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Bank Soal Saya</p>
            <h3 className="text-3xl font-bold text-foreground">{bankSoalCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Ujian Dibuat</p>
            <h3 className="text-3xl font-bold text-foreground">{ujianList.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Belum Dinilai</p>
            <h3 className="text-3xl font-bold text-foreground">{belumDinilaiCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>

        <div className="glass rounded-[var(--radius-lg)] p-6 hover-lift flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Selesai Dinilai</p>
            <h3 className="text-3xl font-bold text-foreground">{sudahDinilaiCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" /> Analitik Performa Siswa
        </h2>
        <AnalyticsDashboard data={analytics} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Exams Panel */}
        <div className="glass rounded-[var(--radius-lg)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Ujian Terakhir Dibuat</h2>
            <Link href="/guru/ujian" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {ujianList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 italic">Belum ada ujian yang dibuat.</p>
            ) : ujianList.map((ujian) => (
              <div key={ujian.id} className="flex items-center justify-between p-4 rounded-md border border-border/50 bg-background/50">
                <div>
                  <h4 className="font-medium text-foreground text-sm line-clamp-1">{ujian.judul}</h4>
                  <p className="text-xs text-muted-foreground">{ujian.mataPelajaran.nama} • {ujian._count.attempts} pengerjaan</p>
                </div>
                <Link href={`/guru/penilaian/${ujian.id}`} className="text-sm text-primary font-medium hover:underline flex-shrink-0">
                  Nilai
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass rounded-[var(--radius-lg)] p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link href="/guru/bank-soal" className="w-full flex items-center justify-between p-4 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
              <span className="flex items-center gap-2"><BookOpen className="w-5 h-5"/> Kelola Bank Soal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/guru/ujian" className="w-full flex items-center justify-between p-4 rounded-md border border-border bg-background hover:bg-muted transition-colors font-medium">
              <span className="flex items-center gap-2 text-foreground"><FileText className="w-5 h-5"/> Buat Ujian Baru</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/guru/penilaian" className="w-full flex items-center justify-between p-4 rounded-md border border-border bg-background hover:bg-muted transition-colors font-medium">
              <span className="flex items-center gap-2 text-foreground"><ClipboardList className="w-5 h-5"/> Koreksi & Nilai</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
