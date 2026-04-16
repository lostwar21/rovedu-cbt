"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  X,
  Loader2,
  Shield,
  User,
  Filter,
  Search,
  CheckCircle2,
} from "lucide-react";
import { formatWIBTime, formatWIBDay } from "@/lib/date-utils";
import { Modal } from "@/components/ui/Modal";
import {
  createJadwalUjian,
  updateJadwalUjian,
  deleteJadwalUjian,
} from "@/lib/actions/jadwal";

interface JadwalItem {
  id: string;
  ujianId: string;
  ruangId: string;
  pengawasId: string | null;
  waktuMulai: string | Date;
  waktuSelesai: string | Date;
  ujian: {
    judul: string;
    mataPelajaran: { nama: string };
    bankSoal: {
      guru: {
        user: { name: string | null };
      }
    }
  };
  ruang: {
    nama: string;
  };
  kelas: { id: string; nama: string }[];
}

interface RoomItem {
  id: string;
  nama: string;
  kapasitas: number;
}

interface ExamItem {
  id: string;
  judul: string;
  mataPelajaran: { nama: string };
  bankSoal?: {
      guru: {
          user: { name: string | null };
      }
  }
}

interface PengawasItem {
  id: string;
  name: string | null;
  username: string | null;
}

interface KelasItem {
  id: string;
  nama: string;
  tingkat: number;
}

interface Props {
  listJadwal: JadwalItem[];
  listRuang: RoomItem[];
  listUjian: ExamItem[];
  listPengawas: PengawasItem[];
  listKelas: KelasItem[];
}

export function AdminManajemenJadwal({
  listJadwal,
  listRuang,
  listUjian,
  listPengawas,
  listKelas,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalItem | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRuang, setFilterRuang] = useState("all");

  // Form states
  const [ujianId, setUjianId] = useState("");
  const [ruangId, setRuangId] = useState("");
  const [pengawasId, setPengawasId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  const resetForm = () => {
    setUjianId("");
    setRuangId("");
    setPengawasId("");
    setTanggal("");
    setJamMulai("");
    setJamSelesai("");
    setSelectedKelasIds([]);
    setEditingJadwal(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (j: JadwalItem) => {
    setEditingJadwal(j);
    setUjianId(j.ujianId);
    setRuangId(j.ruangId);
    setPengawasId(j.pengawasId || "");

    const start = new Date(j.waktuMulai);
    const end = new Date(j.waktuSelesai);

    setTanggal(start.toISOString().split("T")[0]);
    setJamMulai(start.toTimeString().substring(0, 5));
    setJamSelesai(end.toTimeString().substring(0, 5));
    setSelectedKelasIds(j.kelas.map(k => k.id));

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!ujianId || !ruangId || !tanggal || !jamMulai || !jamSelesai || selectedKelasIds.length === 0) {
      return alert("Mohon lengkapi data jadwal dan pilih minimal satu kelas.");
    }

    const start = new Date(`${tanggal}T${jamMulai}`);
    const end = new Date(`${tanggal}T${jamSelesai}`);

    if (start >= end) {
      return alert("Waktu selesai harus setelah waktu mulai.");
    }

    startTransition(async () => {
      try {
        if (editingJadwal) {
          await updateJadwalUjian(editingJadwal.id, {
            ruangId,
            waktuMulai: start,
            waktuSelesai: end,
            pengawasId: pengawasId || undefined,
            kelasIds: selectedKelasIds,
          });
        } else {
          await createJadwalUjian({
            ujianId,
            ruangId,
            waktuMulai: start,
            waktuSelesai: end,
            pengawasId: pengawasId || undefined,
            kelasIds: selectedKelasIds,
          });
        }
        setShowModal(false);
      } catch (err: any) {
        alert("Gagal memproses jadwal: " + err.message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus jadwal ini dari roster?")) {
      startTransition(async () => {
        await deleteJadwalUjian(id);
      });
    }
  };

  const filteredJadwal = listJadwal.filter(j => {
    const matchesSearch = j.ujian.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         j.ujian.mataPelajaran.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRuang = filterRuang === "all" || j.ruangId === filterRuang;
    return matchesSearch && matchesRuang;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Otoritas Jadwal Admin</h1>
            <div className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider border border-primary/20">
              Master Control
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Sinkronisasi roster ujian pusat, penugasan pengawas, dan override jadwal guru.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 border-r pr-4 border-border mr-1">
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Jadwal</p>
                    <p className="text-xl font-black">{listJadwal.length}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Ruang Aktif</p>
                    <p className="text-xl font-black">{listRuang.length}</p>
                </div>
            </div>
            <button
                onClick={openCreate}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 active:scale-95 ease-in-out duration-200"
            >
                <Plus className="w-5 h-5" /> Buat Roster Baru
            </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Cari Mata Pelajaran atau Judul Ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            value={filterRuang}
            onChange={(e) => setFilterRuang(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Semua Ruangan</option>
            {listRuang.map(r => (
              <option key={r.id} value={r.id}>{r.nama}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List Jadwal */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJadwal.length === 0 ? (
          <div className="col-span-full py-20 bg-background/50 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted-foreground animate-in fade-in slide-in-from-bottom-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-medium">Tidak ada roster yang sesuai dengan filter.</p>
          </div>
        ) : (
          filteredJadwal.map((j) => {
            const isCompleted = new Date(j.waktuSelesai) < new Date();
            const teacherName = j.ujian.bankSoal.guru.user.name || "Guru";
            const pengawas = listPengawas.find(p => p.id === j.pengawasId);

            return (
              <div
                key={j.id}
                className={`group relative glass p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 ${isCompleted ? 'grayscale-[0.5] opacity-80' : 'border-border'}`}
              >
                {isCompleted && (
                  <div className="absolute top-4 right-4 text-xs font-bold text-success flex items-center gap-1 bg-success/10 px-2 py-1 rounded-full border border-success/20">
                    <CheckCircle2 className="w-3 h-3" /> SELESAI
                  </div>
                )}
                
                <div className="space-y-1 mb-6">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                    <User className="w-3 h-3 text-primary/50" /> {teacherName}
                  </p>
                  <h3 className="font-extrabold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {j.ujian.judul}
                  </h3>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    {j.ujian.mataPelajaran.nama}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/40">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span suppressHydrationWarning className="text-foreground">
                      {formatWIBDay(j.waktuMulai)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span suppressHydrationWarning className="font-medium text-foreground">
                      {formatWIBTime(j.waktuMulai)} - {formatWIBTime(j.waktuSelesai)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-bold">{j.ruang.nama}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {j.kelas.map(k => (
                        <span key={k.id} className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-[10px] font-bold rounded-md border border-blue-500/20">
                            {k.nama}
                        </span>
                    ))}
                  </div>

                  <div className={`flex items-center gap-3 text-sm font-bold p-2 rounded-xl border ${j.pengawasId ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {pengawas ? pengawas.name : "Belum Ada Pengawas"}
                    </span>
                  </div>
                </div>

                {/* Actions Overlay for Desktop */}
                <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 rounded-2xl">
                    <button
                        onClick={() => openEdit(j)}
                        className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform"
                    >
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleDelete(j.id)}
                        className="w-12 h-12 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form Admin */}
      <Modal
        isOpen={showModal}
        onClose={() => !isPending && setShowModal(false)}
        title={editingJadwal ? "Sesuaikan Roster" : "Pemetaan Roster Baru"}
        maxWidth="xl"
      >
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm -mt-4">Otoritas Master Admin: Menyamakan roster dengan jadwal pengawas pusat.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Ujian */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-1">
                Pilih Mata Ujian (List Guru) 
              </label>
              <select
                disabled={!!editingJadwal}
                value={ujianId}
                onChange={(e) => setUjianId(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all font-medium disabled:opacity-50"
              >
                <option value="">-- Pilih Ujian & Pengampu --</option>
                {listUjian.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.judul} - [{ex.bankSoal?.guru.user.name || 'Guru'}]
                  </option>
                ))}
              </select>
            </div>

            {/* Ruang */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-muted-foreground">Lokasi Ruangan</label>
              <select
                value={ruangId}
                onChange={(e) => setRuangId(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all font-medium"
              >
                <option value="">-- Pilih Ruang --</option>
                {listRuang.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama} (Kap: {r.kapasitas})
                  </option>
                ))}
              </select>
            </div>

            {/* Pengawas */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-muted-foreground">Petugas Pengawas</label>
              <select
                value={pengawasId}
                onChange={(e) => setPengawasId(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all font-bold"
              >
                <option value="">-- Tanpa Pengawas --</option>
                {listPengawas.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-muted-foreground">Hari & Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Waktu */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Mulai</label>
                <input
                  type="time"
                  value={jamMulai}
                  onChange={(e) => setJamMulai(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-muted-foreground">Selesai</label>
                <input
                  type="time"
                  value={jamSelesai}
                  onChange={(e) => setJamSelesai(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Pilih Kelas */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[11px] font-black uppercase text-muted-foreground flex items-center justify-between">
                Peserta Ujian (Kelas)
                <span className="normal-case font-medium text-[10px] opacity-70">Pilih satu atau lebih kelas</span>
              </label>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/30 border border-border rounded-2xl">
                {listKelas.map((k) => {
                  const isSelected = selectedKelasIds.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedKelasIds(selectedKelasIds.filter(id => id !== k.id));
                        } else {
                          setSelectedKelasIds([...selectedKelasIds, k.id]);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        }`}
                    >
                      {k.nama}
                    </button>
                  );
                })}
              </div>
              {selectedKelasIds.length === 0 && (
                <p className="text-[10px] text-destructive font-medium animate-pulse">
                  * Wajib memilih minimal satu kelas agar ujian dapat muncul di akun siswa.
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowModal(false)}
              className="px-6 py-3 border border-border rounded-xl hover:bg-muted transition-colors text-sm font-bold"
            >
              Batalkan
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="px-10 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all text-sm font-black flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingJadwal ? "TERAPKAN PERUBAHAN" : "VALIDASI & SIMPAN"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
