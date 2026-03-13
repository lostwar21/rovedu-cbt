"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, X, Loader2, BookOpen, Layers } from "lucide-react";
import { createBankSoal, updateBankSoal, deleteBankSoal } from "@/lib/actions/bank-soal";
import Link from "next/link";

interface MataPelajaran {
  id: string;
  nama: string;
  kode: string;
}

interface BankSoal {
  id: string;
  nama: string;
  mataPelajaranId: string;
  mataPelajaran: MataPelajaran;
  _count: {
    soal: number;
  };
}

interface Props {
  data: BankSoal[];
  listMapel: MataPelajaran[];
  guruId: string;
}

export function BankSoalTable({ data, listMapel, guruId }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BankSoal | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (item?: BankSoal) => {
    setEditingItem(item || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      if (editingItem) {
        await updateBankSoal(editingItem.id, formData);
      } else {
        await createBankSoal(guruId, formData);
      }
      handleCloseModal();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus bank soal ini? Seluruh butir soal di dalamnya akan ikut terhapus secara permanen.")) {
      startTransition(async () => {
        await deleteBankSoal(id);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-foreground">Daftar Bank Soal Anda</h2>
           <p className="text-sm text-muted-foreground mt-1">Buat kotak soal untuk menampung butir-butir pertanyaan.</p>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all hover-lift font-medium shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" /> Buat Bank Soal Baru
        </button>
      </div>

      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground bg-muted/30">
                <th className="py-4 px-6 font-medium">Nama Bank Soal</th>
                <th className="py-4 px-6 font-medium">Mata Pelajaran</th>
                <th className="py-4 px-6 font-medium text-center">Jumlah Soal</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Belum ada bank soal. Silakan buat baru.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-foreground text-base">{item.nama}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted border border-border/50 text-foreground font-medium text-xs">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground"/> {item.mataPelajaran.nama}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full font-medium ${item._count.soal > 0 ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                        <Layers className="w-3.5 h-3.5" /> {item._count.soal} Butir
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Tombol ke Detail Soal - Ini akan kita buat selanjutnya */}
                        <Link 
                           href={`/guru/bank-soal/${item.id}`}
                           className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium text-xs rounded transition-colors"
                        >
                          Kelola Soal
                        </Link>
                        <button
                          title="Edit Info Bank Soal"
                          onClick={() => handleOpenModal(item)}
                          disabled={isPending}
                          className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          title="Hapus Bank Soal"
                          onClick={() => handleDelete(item.id)}
                          disabled={isPending}
                          className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-[var(--radius-lg)] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingItem ? "Edit Bank Soal" : "Buat Bank Soal"}
              </h2>
              <button 
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {listMapel.length === 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-md text-sm mb-4">
                      <strong>Perhatian:</strong> Akun Anda belum terhubung dengan Mata Pelajaran manapun. Hubungi Admin untuk mengatur bidang studi Anda agar bisa membuat Bank Soal.
                  </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nama Bank Soal</label>
                <input
                  name="nama"
                  defaultValue={editingItem?.nama || ""}
                  required
                  placeholder="Contoh: UTS Matematika Sem 1"
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Topik / Mata Pelajaran</label>
                <select
                  name="mataPelajaranId"
                  required
                  defaultValue={editingItem?.mataPelajaranId || ""}
                  disabled={listMapel.length === 0}
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                >
                  <option value="" disabled>Pilih Bidang Studi...</option>
                  {listMapel.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.kode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3 mt-6 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted font-medium transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || listMapel.length === 0}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Bank Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
