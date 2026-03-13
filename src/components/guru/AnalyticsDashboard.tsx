"use client";

interface AnalyticsData {
  totalPeserta: number;
  rataRata: number;
  nilaiTertinggi: number;
  nilaiTerendah: number;
  distribusi: { A: number; B: number; C: number; D: number; E: number };
  perKelas: { nama: string; rataRata: number; jumlahSiswa: number }[];
  topSiswa: { nama: string; kelas: string; nilai: number; ujian: string }[];
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData | null }) {
  if (!data || data.totalPeserta === 0) {
    return (
      <div className="glass rounded-[var(--radius-lg)] p-8 text-center border border-dashed border-border">
        <p className="text-muted-foreground text-sm">Belum ada data analitik. Statistik akan muncul setelah siswa menyelesaikan ujian.</p>
      </div>
    );
  }

  const maxDistribusi = Math.max(data.distribusi.A, data.distribusi.B, data.distribusi.C, data.distribusi.D, data.distribusi.E, 1);

  const gradeColors: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-blue-500",
    C: "bg-amber-500",
    D: "bg-orange-500",
    E: "bg-red-500",
  };

  const gradeLabels: Record<string, string> = {
    A: "80-100",
    B: "70-79",
    C: "60-69",
    D: "50-59",
    E: "<50",
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Pengerjaan" value={data.totalPeserta} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard label="Rata-Rata Nilai" value={data.rataRata} color="text-primary" bg="bg-primary/10" />
        <StatCard label="Nilai Tertinggi" value={data.nilaiTertinggi} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard label="Nilai Terendah" value={data.nilaiTerendah} color="text-destructive" bg="bg-destructive/10" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Distribusi Nilai */}
        <div className="glass rounded-[var(--radius-lg)] p-6">
          <h3 className="text-lg font-bold mb-1">Distribusi Nilai</h3>
          <p className="text-xs text-muted-foreground mb-5">Persebaran grade seluruh siswa yang sudah mengerjakan ujian</p>
          <div className="space-y-3">
            {Object.entries(data.distribusi).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-3">
                <div className="w-8 text-center">
                  <span className="text-sm font-black">{grade}</span>
                </div>
                <div className="flex-1 h-7 bg-muted rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full ${gradeColors[grade]} rounded-lg transition-all duration-700 ease-out`}
                    style={{ width: `${(count / maxDistribusi) * 100}%`, minWidth: count > 0 ? '2rem' : '0' }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                    {count} siswa
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground w-12 text-right">{gradeLabels[grade]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rata-rata Per Kelas */}
        <div className="glass rounded-[var(--radius-lg)] p-6">
          <h3 className="text-lg font-bold mb-1">Perbandingan Kelas</h3>
          <p className="text-xs text-muted-foreground mb-5">Rata-rata nilai per kelas, diurutkan dari yang tertinggi</p>
          {data.perKelas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 italic">Belum ada data kelas.</p>
          ) : (
            <div className="space-y-3">
              {data.perKelas.map((kelas, idx) => (
                <div key={kelas.nama} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{kelas.nama}</span>
                      <span className="text-sm font-bold text-primary">{kelas.rataRata}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/70 rounded-full transition-all duration-500"
                        style={{ width: `${kelas.rataRata}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{kelas.jumlahSiswa} pengerjaan</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 Siswa */}
      {data.topSiswa.length > 0 && (
        <div className="glass rounded-[var(--radius-lg)] p-6">
          <h3 className="text-lg font-bold mb-1">🏆 Top 5 Siswa Berprestasi</h3>
          <p className="text-xs text-muted-foreground mb-4">Siswa dengan nilai tertinggi dari seluruh ujian Anda</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {data.topSiswa.map((s, idx) => (
              <div key={idx} className={`p-4 rounded-xl border text-center transition-all ${idx === 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-background/50'}`}>
                <div className={`text-2xl mb-1 ${idx === 0 ? '' : 'opacity-50'}`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <p className="text-sm font-bold truncate">{s.nama}</p>
                <p className="text-[10px] text-muted-foreground truncate">{s.kelas} • {s.ujian}</p>
                <p className="text-lg font-black text-primary mt-1">{Math.round(s.nilai)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`p-4 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-center gap-1`}>
      <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}</p>
    </div>
  );
}
