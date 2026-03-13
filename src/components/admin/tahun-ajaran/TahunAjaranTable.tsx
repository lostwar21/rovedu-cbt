"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, CheckCircle, X, Loader2 } from "lucide-react";
import { 
  createTahunAjaran, 
  updateTahunAjaran, 
  deleteTahunAjaran, 
  setTahunAjaranAktif 
} from "@/lib/actions/tahun-ajaran";

interface TahunAjaran {
  id: string;
  nama: string;
  semester: string;
  aktif: boolean;
}

interface Props {
  data: TahunAjaran[];
}

export function TahunAjaranTable({ data }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TahunAjaran | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (item?: TahunAjaran) => {
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
        await updateTahunAjaran(editingItem.id, formData);
      } else {
        await createTahunAjaran(formData);
      }
      handleCloseModal();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      startTransition(async () => {
        await deleteTahunAjaran(id);
      });
    }
  };

  const handleSetAktif = async (id: string) => {
    startTransition(async () => {
      await setTahunAjaranAktif(id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Manajemen Tahun Ajaran</h1>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all hover-lift font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Tahun Ajaran
        </button>
      </div>

      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground bg-muted/30">
                <th className="py-4 px-6 font-medium">Tahun Ajaran</th>
                <th className="py-4 px-6 font-medium">Semester</th>
                <th className="py-4 px-6 font-medium text-center">Status</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Belum ada data tahun ajaran.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-foreground">{item.nama}</td>
                    <td className="py-4 px-6 text-muted-foreground">{item.semester}</td>
                    <td className="py-4 px-6 text-center">
                      {item.aktif ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetAktif(item.id)}
                          disabled={isPending}
                          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                          Set Aktif
                        </button>
                      )}
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

      {/* Simple Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-[var(--radius-lg)] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingItem ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}
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
                <label className="text-sm font-medium text-foreground">Nama Tahun Ajaran</label>
                <input
                  name="nama"
                  defaultValue={editingItem?.nama}
                  required
                  placeholder="Contoh: 2023/2024"
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Semester</label>
                <select
                  name="semester"
                  defaultValue={editingItem?.semester}
                  required
                  className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
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
