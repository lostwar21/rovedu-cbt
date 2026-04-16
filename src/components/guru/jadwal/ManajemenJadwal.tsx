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
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
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
  waktuMulai: string | Date;
  waktuSelesai: string | Date;
  ujian: {
    judul: string;
    mataPelajaran: { nama: string };
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
}

interface KelasItem {
  id: string;
  nama: string;
}

interface Props {
  listJadwal: JadwalItem[];
  listRuang: RoomItem[];
  listUjian: ExamItem[];
  listKelas: KelasItem[];
  guruId: string;
}

export function ManajemenJadwal({
  listJadwal,
  listRuang,
  listUjian,
  listKelas,
  guruId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalItem | null>(null);

  // Form states
  const [ujianId, setUjianId] = useState("");
  const [ruangId, setRuangId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRuang, setSelectedRuang] = useState<string>("all");

  const filteredJadwal = listJadwal.filter(j => {
    const matchesSearch = j.ujian.judul.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRuang = selectedRuang === "all" || j.ruangId === selectedRuang;
    return matchesSearch && matchesRuang;
  });

  const resetForm = () => {
    setUjianId("");
    setRuangId("");
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

    const start = new Date(j.waktuMulai);
    const end = new Date(j.waktuSelesai);

    setTanggal(start.toISOString().split("T")[0]);
    setJamMulai(start.toTimeString().substring(0, 5));
    setJamSelesai(end.toTimeString().substring(0, 5));
    setSelectedKelasIds(j.kelas?.map(k => k.id) || []);

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!ujianId || !ruangId || !tanggal || !jamMulai || !jamSelesai || selectedKelasIds.length === 0) {
      return alert("Semua kolom harus diisi dan pilih minimal satu kelas.");
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
            kelasIds: selectedKelasIds,
          });
        } else {
          await createJadwalUjian({
            ujianId,
            ruangId,
            waktuMulai: start,
            waktuSelesai: end,
            kelasIds: selectedKelasIds,
          });
        }
        setShowModal(false);
        // router.refresh() if supported/needed, usually not in guru space if using server actions correctly with revalidate
      } catch (err: any) {
        alert("Gagal menyimpan jadwal: " + err.message);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus jadwal ini?")) {
      startTransition(async () => {
        await deleteJadwalUjian(id);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Jadwal Ujian</h1>
          <p className="text-muted-foreground text-sm">
            Atur pembagian waktu dan ruang untuk ujian yang telah dibuat.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Jadwal
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Cari judul ujian atau mapel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedRuang}
            onChange={(e) => setSelectedRuang(e.target.value)}
            className="flex-1 md:w-60 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          >
            <option value="all">Semua Ruangan</option>
            {listRuang.map(r => (
              <option key={r.id} value={r.id}>{r.nama}</option>
            ))}
          </select>
        </div>

        {(searchQuery || selectedRuang !== "all") && (
          <button 
            onClick={() => { setSearchQuery(""); setSelectedRuang("all"); }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium underline underline-offset-4"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredJadwal.length === 0 ? (
          <div className="col-span-full p-12 border border-dashed border-border rounded-lg text-center opacity-50">
            <Calendar className="w-12 h-12 mx-auto mb-3" />
            <p>
              {searchQuery || selectedRuang !== "all" 
                ? "Tidak ada jadwal yang cocok dengan filter." 
                : "Belum ada jadwal ujian."}
            </p>
          </div>
        ) : (
          filteredJadwal.map((j) => (
            <div
              key={j.id}
              className="glass p-5 rounded-lg border border-border/50 relative group"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-tight">
                    {j.ujian.judul}
                  </h3>
                  <p className="text-xs text-primary font-medium">
                    {j.ujian.mataPelajaran.nama}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(j)}
                    className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span suppressHydrationWarning>
                    {new Date(j.waktuMulai).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span suppressHydrationWarning className="font-medium text-foreground">
                    {new Date(j.waktuMulai).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(j.waktuSelesai).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-foreground">{j.ruang.nama}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {j.kelas?.map(k => (
                    <span key={k.id} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-md border border-primary/20">
                      {k.nama}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showModal}
        onClose={() => !isPending && setShowModal(false)}
        title={editingJadwal ? "Edit Jadwal" : "Tambah Jadwal Baru"}
      >
        <div className="space-y-4">
          {/* Ujian */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pilih Ujian</label>
            <select
              disabled={!!editingJadwal}
              value={ujianId}
              onChange={(e) => setUjianId(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            >
              <option value="">-- Pilih Ujian --</option>
              {listUjian.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.judul} ({ex.mataPelajaran.nama})
                </option>
              ))}
            </select>
          </div>

          {/* Ruang */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ruang Ujian</label>
            <select
              value={ruangId}
              onChange={(e) => setRuangId(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">-- Pilih Ruang --</option>
              {listRuang.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama} (Kap: {r.kapasitas})
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tanggal</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Waktu */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jam Mulai</label>
              <input
                type="time"
                value={jamMulai}
                onChange={(e) => setJamMulai(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Jam Selesai</label>
              <input
                type="time"
                value={jamSelesai}
                onChange={(e) => setJamSelesai(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Pilih Kelas */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Pilih Kelas Peserta</label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 border border-border rounded-md">
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
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all border ${isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      }`}
                  >
                    {k.nama}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all text-sm font-medium flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingJadwal ? "Update Jadwal" : "Simpan Jadwal"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
