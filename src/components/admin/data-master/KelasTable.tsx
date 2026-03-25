"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, X, Loader2, Users } from "lucide-react";
import { createKelas, updateKelas, deleteKelas } from "@/lib/actions/kelas";
import { Modal } from "@/components/ui/Modal";

interface Kelas {
  id: string;
  nama: string;
  tingkat: number;
  tahunAjaranId: string;
  tahunAjaran: {
    nama: string;
    semester: string;
  };
  _count: {
    siswa: number;
  };
}

interface TahunAjaran {
  id: string;
  nama: string;
  semester: string;
  aktif: boolean;
}

interface Props {
  data: Kelas[];
  listTahunAjaran: TahunAjaran[];
}

export function KelasTable({ data, listTahunAjaran }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Kelas | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (item?: Kelas) => {
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
        await updateKelas(editingItem.id, formData);
      } else {
        await createKelas(formData);
      }
      handleCloseModal();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kelas ini? Aksi ini berpotensi menghapus data siswa di dalamnya.")) {
      startTransition(async () => {
        await deleteKelas(id);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-foreground">Daftar Kelas</h2>
           <p className="text-sm text-muted-foreground mt-1">Kelola pembagian kelas untuk sistem ujian.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all hover-lift font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Kelas
        </button>
      </div>

      <div className="glass rounded-[var(--radius-lg)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground bg-muted/30">
                <th className="py-4 px-6 font-medium">Nama Kelas</th>
                <th className="py-4 px-6 font-medium">Tingkat</th>
                <th className="py-4 px-6 font-medium">Tahun Ajaran</th>
                <th className="py-4 px-6 font-medium text-center">Jumlah Siswa</th>
                <th className="py-4 px-6 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    Belum ada data kelas.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-foreground">{item.nama}</td>
                    <td className="py-4 px-6 font-medium text-muted-foreground">Kelas {item.tingkat}</td>
                    <td className="py-4 px-6 text-muted-foreground">
                      {item.tahunAjaran.nama} ({item.tahunAjaran.semester})
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-medium">
                        <Users className="w-3.5 h-3.5" /> {item._count.siswa} Siswa
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
        title={editingItem ? "Edit Kelas" : "Tambah Kelas"}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nama Kelas</label>
            <input
              name="nama"
              defaultValue={editingItem?.nama}
              required
              placeholder="Contoh: XII IPA 1"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tingkat Kelas (Angka)</label>
            <input
              type="number"
              name="tingkat"
              defaultValue={editingItem?.tingkat}
              required
              min="1"
              max="12"
              placeholder="Contoh: 12"
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tahun Ajaran</label>
            <select
              name="tahunAjaranId"
              defaultValue={editingItem?.tahunAjaranId}
              required
              className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="" disabled>Pilih Tahun Ajaran...</option>
              {listTahunAjaran.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama} ({ta.semester}) {ta.aktif ? "— Aktif" : ""}
                </option>
              ))}
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
      </Modal>
    </div>
  );
}
