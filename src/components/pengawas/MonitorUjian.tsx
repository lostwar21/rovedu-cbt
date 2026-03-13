"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  MoreVertical, 
  Power, 
  RotateCcw,
  Search,
  ChevronRight,
  Filter,
  Lock,
  Loader2
} from "lucide-react";
import { getMonitoringDataAction, forceSubmitSesiAction, resetSesiAction } from "@/lib/actions/sesi";
import { refreshUjianToken } from "@/lib/actions/ujian";

interface Props {
  jadwalId: string;
}

export function MonitorUjian({ jadwalId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("SEMUA");
  const [isPending, startTransition] = useTransition();

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await getMonitoringDataAction(jadwalId);
      setData(res);
    } catch (err) {
      console.error("Gagal mengambil data monitoring:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Polling setiap 10 detik
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [jadwalId]);

  const handleForceSubmit = (sesiId: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin mengakhiri paksa ujian siswa "${name}"?`)) {
      startTransition(async () => {
        try {
          await forceSubmitSesiAction(sesiId);
          fetchData(true);
        } catch (err: any) {
          alert("Gagal: " + err.message);
        }
      });
    }
  };

  const handleResetSesi = (sesiId: string, name: string) => {
    if (confirm(`PERINGATAN: Menghapus sesi "${name}" akan menghapus SEMUA jawaban yang telah dikerjakan. Siswa harus mengulang dari awal. Lanjutkan?`)) {
      startTransition(async () => {
        try {
          await resetSesiAction(sesiId);
          fetchData(true);
        } catch (err: any) {
          alert("Gagal: " + err.message);
        }
      });
    }
  };

  const handleRefreshToken = () => {
    if (confirm("Apakah Anda yakin ingin memperbarui token ujian? Token lama tidak akan bisa digunakan lagi untuk masuk.")) {
      startTransition(async () => {
        try {
          await refreshUjianToken(data.jadwal.ujianId);
          fetchData(true);
        } catch (err: any) {
          alert("Gagal memperbarui token: " + err.message);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Menghubungkan ke ruang ujian...</p>
      </div>
    );
  }

  const filteredSesi = data?.daftarSesi.filter((s: any) => {
    const matchesSearch = s.siswaName.toLowerCase().includes(searchTerm.toLowerCase()) || s.siswaNis.includes(searchTerm);
    const matchesStatus = statusFilter === "SEMUA" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: data?.daftarSesi.length || 0,
    berjalan: data?.daftarSesi.filter((s: any) => s.status === "BERJALAN").length || 0,
    diblokir: data?.daftarSesi.filter((s: any) => s.status === "DIBLOKIR").length || 0,
    selesai: data?.daftarSesi.filter((s: any) => s.status === "SELESAI").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" /> Monitor Ujian Real-time
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <p className="text-muted-foreground text-sm">
              {data?.jadwal.ujian.judul} — {data?.jadwal.ruang.nama}
            </p>
            {data?.jadwal.ujian.token && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg">
                <span className="text-[10px] font-black uppercase opacity-60 tracking-wider">Token Ujian:</span>
                <span className="text-sm font-black tracking-[0.2em] font-mono">{data.jadwal.ujian.token}</span>
                <button 
                  onClick={handleRefreshToken}
                  disabled={isPending}
                  title="Segarkan Token"
                  className="ml-1 p-1 hover:bg-primary/20 rounded-md transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => fetchData()}
          className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Peserta" value={stats.total} icon={<Users />} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard label="Sedang Mengerjakan" value={stats.berjalan} icon={<Activity />} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard label="Diblokir (Pelanggaran)" value={stats.diblokir} icon={<Lock />} color="text-destructive" bg="bg-destructive/10" />
        <StatCard label="Sudah Selesai" value={stats.selesai} icon={<CheckCircle2 />} color="text-emerald-500" bg="bg-emerald-500/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Cari Nama atau NIS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card border border-border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="SEMUA">Semua Status</option>
          <option value="BERJALAN">Berjalan</option>
          <option value="DIBLOKIR">Diblokir</option>
          <option value="SELESAI">Selesai</option>
        </select>
      </div>

      {/* Grid Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSesi?.map((siswa: any) => (
          <SiswaCard 
            key={siswa.id} 
            siswa={siswa} 
            totalSoal={data.totalSoal}
            onForceSubmit={() => handleForceSubmit(siswa.id, siswa.siswaName)}
            onReset={() => handleResetSesi(siswa.id, siswa.siswaName)}
          />
        ))}
        {filteredSesi?.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-2xl">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Tidak ada siswa yang sesuai kriteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, bg }: any) {
  return (
    <div className={`p-4 rounded-xl border border-border bg-card flex items-center gap-4`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg} ${color}`}>
        {React.cloneElement(icon, { className: "w-5 h-5" })}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function SiswaCard({ siswa, totalSoal, onForceSubmit, onReset }: any) {
  const progresPct = Math.round((siswa.progres / totalSoal) * 100) || 0;
  
  return (
    <div className={`group relative bg-card border-2 rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${
      siswa.status === 'DIBLOKIR' ? 'border-destructive/30 bg-destructive/5' : 
      siswa.status === 'SELESAI' ? 'border-emerald-500/20' : 'border-border'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h4 className="font-bold text-sm truncate max-w-[150px]">{siswa.siswaName}</h4>
          <p className="text-[10px] text-muted-foreground font-mono">{siswa.siswaNis} • {siswa.kelas}</p>
        </div>
        <StatusBadge status={siswa.status} />
      </div>

      <div className="space-y-4">
        {/* Progres */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase">
            <span className="text-muted-foreground tracking-tighter">Progres Soal</span>
            <span className="text-primary">{siswa.progres} / {totalSoal}</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${progresPct}%` }}
            />
          </div>
        </div>

        {/* Pelanggaran Popover */}
        {siswa.status === 'DIBLOKIR' && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
            <p className="text-[9px] font-black text-destructive uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Pelanggaran Terakhir
            </p>
            <p className="text-[10px] text-destructive leading-tight italic">{siswa.lastPelanggaran}</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2">
          {siswa.status !== 'SELESAI' && (
            <button 
              onClick={onForceSubmit}
              title="Paksa Kumpulkan"
              className="flex-1 py-1.5 rounded-md bg-muted hover:bg-destructive hover:text-white transition-all text-[10px] font-bold uppercase flex items-center justify-center gap-1.5"
            >
              <Power className="w-3 h-3" /> Selesai
            </button>
          )}
          <button 
            onClick={onReset}
            title="Reset Sesi"
            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary/10 hover:text-secondary transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    BERJALAN: { label: "Aktif", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
    DIBLOKIR: { label: "Terblokir", bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive animate-pulse" },
    SELESAI: { label: "Selesai", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  };

  const config = configs[status] || { label: status, bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted" };

  return (
    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5 ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
