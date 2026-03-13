"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, X, Loader2, Users } from "lucide-react";
import { createRuangan, updateRuangan, deleteRuangan } from "@/lib/actions/ruangan";

interface Ruangan {
  id: string;
  nama: string;
  kapasitas: number;
}

interface Props {
  data: Ruangan[];
}

export function RuanganTable({ data }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ruangan | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (item?: Ruangan) => {
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
        await updateRuangan(editingItem.id, formData);
      } else {
        await createRuangan(formData);
      }
      handleCloseModal();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus ruangan ini? Aksi ini akan berdampak pada jadwal ujian yang terkait.")) {
      startTransition(async () => {
        await deleteRuangan(id);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-foreground">Daftar Ruang Ujian</h2>
           <p className="text-sm text-muted-foreground mt-1">Kelola data ruangan fisik atau virtual tempat ujian diadakan.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all hover-lift font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Ruangan
        </button>
      </div>

      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground bg-muted/30">
                <th className="py-4 px-6 font-medium">Nama Ruangan</th>
                <th className="py-4 px-6 font-medium text-center">Kapasitas Maksimal</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-muted-foreground">
                    Belum ada data ruang ujian.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-foreground">{item.nama}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
                        <Users className="w-3.5 h-3.5" /> {item.kapasitas} Peserta
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          disabled={isPending}
                          className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
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
                {editingItem ? "Edit Ruangan" : "Tambah Ruangan"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nama Ruangan</label>
                <input
                  name="nama"
                  defaultValue={editingItem?.nama}
                  required
                  placeholder="Contoh: Lab Komputer A"
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Kapasitas Peserta</label>
                <input
                  type="number"
                  name="kapasitas"
                  defaultValue={editingItem?.kapasitas}
                  required
                  min="1"
                  placeholder="Contoh: 36"
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
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
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-all flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
