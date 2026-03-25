"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, X, Loader2, BookOpen } from "lucide-react";
import { createMataPelajaran, updateMataPelajaran, deleteMataPelajaran } from "@/lib/actions/mapel";
import { Modal } from "@/components/ui/Modal";

interface Mapel {
  id: string;
  nama: string;
  kode: string;
  _count: {
    guru: number;
  };
}

interface Props {
  data: Mapel[];
}

export function MapelTable({ data }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Mapel | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (item?: Mapel) => {
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
        await updateMataPelajaran(editingItem.id, formData);
      } else {
        await createMataPelajaran(formData);
      }
      handleCloseModal();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus mata pelajaran ini? Aksi ini akan mempengaruhi bank soal terkait.")) {
      startTransition(async () => {
        await deleteMataPelajaran(id);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-foreground">Daftar Mata Pelajaran</h2>
           <p className="text-sm text-muted-foreground mt-1">Kelola mata pelajaran yang akan diujikan.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all hover-lift font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Mata Pelajaran
        </button>
      </div>

      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground bg-muted/30">
                <th className="py-4 px-6 font-medium">Kode Mapel</th>
                <th className="py-4 px-6 font-medium">Nama Mata Pelajaran</th>
                <th className="py-4 px-6 font-medium text-center">Jumlah Guru Pengampu</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Belum ada data mata pelajaran.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-medium text-primary bg-primary/5 uppercase tracking-wider">{item.kode}</td>
                    <td className="py-4 px-6 font-bold text-foreground">{item.nama}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 text-accent font-medium">
                        <BookOpen className="w-3.5 h-3.5" /> {item._count.guru} Guru
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Kode Mapel (Singkatan)</label>
            <input
              name="kode"
              defaultValue={editingItem?.kode}
              required
              placeholder="Contoh: MAT, BIND, FIS"
              className="w-full px-4 py-2 rounded-md border border-border bg-background uppercase focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Mata Pelajaran</label>
            <input
              name="nama"
              defaultValue={editingItem?.nama}
              required
              placeholder="Contoh: Matematika Wajib"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
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
      </Modal>
    </div>
  );
}
