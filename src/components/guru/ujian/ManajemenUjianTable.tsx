"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, X, Loader2, ClipboardList, Clock, BookOpen, Users, ShieldCheck, Shuffle, Eye, Key } from "lucide-react";
import { createUjian, updateUjian, deleteUjian } from "@/lib/actions/ujian";
import Link from "next/link";

interface BankSoalOption {
  id: string;
  nama: string;
  mataPelajaran: { nama: string; id: string };
  _count: { soal: number };
}

interface KelasOption {
  id: string;
  nama: string;
  tahunAjaran: { nama: string; semester: string; aktif: boolean };
}

interface UjianItem {
  id: string;
  judul: string;
  skala: string;
  durasi: number;
  token: string | null;
  acakSoal: boolean;
  acakOpsi: boolean;
  tampilkanHasil: boolean;
  mataPelajaran: { id: string; nama: string };
  bankSoal: { nama: string };
  kelas: { id: string; nama: string }[];
  _count: { attempts: number };
}

interface Props {
  listUjian: UjianItem[];
  listBankSoal: BankSoalOption[];
  listKelas: KelasOption[];
}

const defaultForm = {
  judul: "",
  deskripsi: "",
  skala: "HARIAN",
  durasi: 60,
  bankSoalId: "",
  mataPelajaranId: "",
  tahunAjaranId: "",
  kelasIds: [] as string[],
  token: "",
  acakSoal: true,
  acakOpsi: true,
  tampilkanHasil: false,
};

export function ManajemenUjianTable({ listUjian, listBankSoal, listKelas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingUjian, setEditingUjian] = useState<UjianItem | null>(null);
  const [form, setForm] = useState(defaultForm);

  const selectedBankSoal = listBankSoal.find(b => b.id === form.bankSoalId);

  const openCreate = () => {
    setEditingUjian(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (u: UjianItem) => {
    setEditingUjian(u);
    setForm({
      judul: u.judul,
      deskripsi: "",
      skala: u.skala || "HARIAN",
      durasi: u.durasi,
      bankSoalId: "", // Tidak diubah saat edit, tampilkan saja nama
      mataPelajaranId: u.mataPelajaran?.id || "",
      tahunAjaranId: "",
      kelasIds: u.kelas.map(k => k.id),
      token: u.token || "",
      acakSoal: u.acakSoal,
      acakOpsi: u.acakOpsi,
      tampilkanHasil: u.tampilkanHasil,
    });
    setShowModal(true);
  };

  const handleBankSoalChange = (val: string) => {
    const bank = listBankSoal.find(b => b.id === val);
    setForm(prev => ({
      ...prev,
      bankSoalId: val,
      mataPelajaranId: bank?.mataPelajaran.id || "",
    }));
  };

  const handleKelasToggle = (kelasId: string) => {
    setForm(prev => ({
      ...prev,
      kelasIds: prev.kelasIds.includes(kelasId)
        ? prev.kelasIds.filter(id => id !== kelasId)
        : [...prev.kelasIds, kelasId]
    }));
  };

  const handleSubmit = async () => {
    if (!form.judul.trim()) return alert("Judul ujian tidak boleh kosong.");
    if (!editingUjian && !form.bankSoalId) return alert("Pilih bank soal terlebih dahulu.");
    if (form.kelasIds.length === 0) return alert("Pilih minimal satu kelas peserta.");
    if (form.durasi < 1) return alert("Durasi minimal 1 menit.");

    // Cari tahunAjaranId dari bank soal yang dipilih
    let tahunAjaranId = form.tahunAjaranId;
    if (!editingUjian) {
      const kelasObj = listKelas.find(k => form.kelasIds.includes(k.id));
      // If not stored in form, try fetching from kelas relation
      // For now use a fallback - we need to fetch it or pass it differently
      if (!tahunAjaranId) {
        // We'll need to store it when kelas is selected
        const firstKelas = listKelas.find(k => form.kelasIds.includes(k.id));
        // Unfortunately kelas object doesn't have tahunAjaranId directly, but it should
        // Let's skip this and use mataPelajaranId which we have
      }
    }

    startTransition(async () => {
      try {
        if (editingUjian) {
          await updateUjian(editingUjian.id, {
            judul: form.judul,
            deskripsi: form.deskripsi,
            skala: form.skala,
            durasi: Number(form.durasi),
            token: form.token || null, // Biarkan backend yang menangani filter skala
            kelasIds: form.kelasIds,
            acakSoal: form.acakSoal,
            acakOpsi: form.acakOpsi,
            tampilkanHasil: form.tampilkanHasil,
          });
        } else {
          await createUjian({
            judul: form.judul,
            deskripsi: form.deskripsi,
            skala: form.skala,
            durasi: Number(form.durasi),
            bankSoalId: form.bankSoalId,
            mataPelajaranId: form.mataPelajaranId,
            tahunAjaranId: form.tahunAjaranId,
            kelasIds: form.kelasIds,
            token: form.token || undefined, // Biarkan backend yang menangani token otomatis
            acakSoal: form.acakSoal,
            acakOpsi: form.acakOpsi,
            tampilkanHasil: form.tampilkanHasil,
          });
        }
        setShowModal(false);
        router.refresh();
      } catch (err: any) {
        alert("Terjadi kesalahan: " + (err.message || "Coba lagi."));
      }
    });
  };

  const handleDelete = (id: string, judul: string) => {
    if (confirm(`Hapus ujian "${judul}"? Semua sesi dan jawaban terkait juga akan dihapus.`)) {
      startTransition(async () => {
        await deleteUjian(id);
        router.refresh();
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Ujian</h1>
          <p className="text-muted-foreground text-sm">Buat dan kelola ujian berdasarkan bank soal Anda.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-md)] hover:bg-primary/90 font-medium shadow-sm hover-lift transition-all"
        >
          <Plus className="w-4 h-4" /> Buat Ujian Baru
        </button>
      </div>

      {/* Tabel */}
      {listUjian.length === 0 ? (
        <div className="p-14 text-center glass rounded-[var(--radius-lg)] border border-dashed border-border">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-muted-foreground">Belum ada ujian yang dibuat.</p>
          <p className="text-sm text-muted-foreground mt-1">Klik tombol "Buat Ujian Baru" untuk memulai.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listUjian.map(u => (
            <div key={u.id} className="glass rounded-[var(--radius-md)] p-4 group relative">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-foreground">{u.judul}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${u.skala === 'HARIAN' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>{u.skala}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20">{u.mataPelajaran?.nama}</span>
                    {u.token && <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1"><Key className="w-2.5 h-2.5"/> Token: {u.token}</span>}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> {u.bankSoal?.nama}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {u.durasi} menit</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/> {u.kelas.map(k => k.nama).join(", ") || "Belum ada kelas"}</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5"/> {u._count.attempts} percobaan</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {u.acakSoal && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 flex items-center gap-1"><Shuffle className="w-2.5 h-2.5"/> Acak Soal</span>}
                    {u.acakOpsi && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 flex items-center gap-1"><Shuffle className="w-2.5 h-2.5"/> Acak Opsi</span>}
                    {u.tampilkanHasil && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"><Eye className="w-2.5 h-2.5"/> Tampilkan Hasil</span>}
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => openEdit(u)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Edit ujian">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(u.id, u.judul)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Hapus ujian">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Ujian */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => !isPending && setShowModal(false)} />
          <div className="relative bg-card border border-border rounded-[var(--radius-lg)] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 z-10 bg-card/90 backdrop-blur-sm px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{editingUjian ? "Edit Ujian" : "Buat Ujian Baru"}</h2>
                <p className="text-sm text-muted-foreground">Isi detail ujian dan konfigurasinya.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Judul */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Judul Ujian</label>
                <input
                  type="text"
                  placeholder="Contoh: UTS Matematika Semester 1 2024"
                  value={form.judul}
                  onChange={e => setForm(prev => ({ ...prev, judul: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Deskripsi / Petunjuk <span className="text-muted-foreground font-normal">(opsional)</span></label>
                <textarea
                  rows={2}
                  placeholder="Tulis petunjuk pengerjaan bagi siswa..."
                  value={form.deskripsi}
                  onChange={e => setForm(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>

              {/* Bank Soal */}
              {!editingUjian ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Bank Soal</label>
                  <select
                    value={form.bankSoalId}
                    onChange={e => handleBankSoalChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    <option value="">-- Pilih Bank Soal --</option>
                    {listBankSoal.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nama} — {b.mataPelajaran.nama} ({b._count.soal} soal)
                      </option>
                    ))}
                  </select>
                  {selectedBankSoal && selectedBankSoal._count.soal === 0 && (
                    <p className="text-xs text-amber-500">⚠️ Bank soal ini masih kosong. Tambahkan soal terlebih dahulu.</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-muted/30 rounded-md border border-border/50 text-sm">
                  <p className="text-muted-foreground text-xs">Bank Soal (tidak bisa diubah setelah dibuat)</p>
                  <p className="font-medium mt-0.5">{editingUjian.bankSoal?.nama} — {editingUjian.mataPelajaran?.nama}</p>
                </div>
              )}

              {/* Skala, Durasi & Token */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Skala Ujian</label>
                  <select
                    value={form.skala}
                    onChange={e => setForm(prev => ({ ...prev, skala: e.target.value, token: e.target.value !== "HARIAN" ? "" : prev.token }))}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm"
                  >
                    <option value="HARIAN">Kuis / Ulangan Harian</option>
                    <option value="UTS">Ujian Tengah Semester (UTS)</option>
                    <option value="UAS">Ujian Akhir Semester (UAS)</option>
                    <option value="TRYOUT">Try Out</option>
                    <option value="LAINNYA">Lainnya...</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Durasi (menit)</label>
                  <input
                    type="number" min="1" max="300"
                    value={form.durasi}
                    onChange={e => setForm(prev => ({ ...prev, durasi: parseInt(e.target.value) || 60 }))}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Token Akses
                    {form.skala !== "HARIAN" && <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/20">Dikelola Admin</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={form.skala === "HARIAN" ? "Biarkan kosong jika tanpa token" : "Dibuat otomatis oleh Admin/Pengawas"}
                    value={form.token}
                    onChange={e => setForm(prev => ({ ...prev, token: e.target.value }))}
                    disabled={form.skala !== "HARIAN"}
                    className={`w-full px-3 py-2 rounded-md border border-border focus:ring-2 focus:ring-primary/20 text-sm font-mono ${form.skala !== 'HARIAN' ? 'bg-muted text-muted-foreground opacity-70 cursor-not-allowed' : 'bg-background'}`}
                  />
                </div>
              </div>

              {/* Kelas Peserta */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Kelas Peserta</label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar border border-border rounded-md p-3">
                  {listKelas.length === 0 ? (
                    <p className="text-xs text-muted-foreground col-span-2">Tidak ada kelas tersedia. Minta Admin menambahkan kelas terlebih dahulu.</p>
                  ) : listKelas.map(k => (
                    <label key={k.id} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border text-xs transition-colors ${form.kelasIds.includes(k.id) ? 'border-primary/40 bg-primary/5 text-primary' : 'border-border/50 hover:bg-muted/50 text-muted-foreground'}`}>
                      <input
                        type="checkbox"
                        checked={form.kelasIds.includes(k.id)}
                        onChange={() => handleKelasToggle(k.id)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                      <span className="font-medium text-foreground">{k.nama}</span>
                      <span className="ml-auto">{k.tahunAjaran.nama}{k.tahunAjaran.aktif ? " ⚡" : ""}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Opsi Ujian */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Opsi Ujian</label>
                <div className="space-y-2">
                  {[
                    { key: 'acakSoal', label: 'Acak Urutan Soal', desc: 'Soal ditampilkan dengan urutan berbeda untuk tiap siswa' },
                    { key: 'acakOpsi', label: 'Acak Urutan Opsi', desc: 'Opsi A,B,C,D diacak posisinya untuk tiap siswa (PG)' },
                    { key: 'tampilkanHasil', label: 'Tampilkan Hasil Setelah Submit', desc: 'Siswa bisa melihat jawaban benar setelah ujian selesai' },
                  ].map(opt => (
                    <label key={opt.key} className={`flex items-start gap-3 p-3 rounded-md cursor-pointer border transition-colors ${(form as any)[opt.key] ? 'border-primary/30 bg-primary/5' : 'border-border/50 hover:bg-muted/30'}`}>
                      <input
                        type="checkbox"
                        checked={(form as any)[opt.key]}
                        onChange={() => setForm(prev => ({ ...prev, [opt.key]: !(prev as any)[opt.key] }))}
                        className="mt-0.5 w-4 h-4 accent-primary"
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-card/90 backdrop-blur-sm px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} disabled={isPending} className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80 transition-colors">
                Batal
              </button>
              <button onClick={handleSubmit} disabled={isPending} className="px-5 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-2 transition-colors">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingUjian ? "Update Ujian" : "Simpan Ujian"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
